import { createRequire } from "module";
import { config } from "./config.js";
import {
  bindDocState,
  cacheRecoverySnapshot,
  clearRecoverySnapshot,
  loadRecoverySnapshot,
  unbindDocState,
} from "./docSync.js";
import { bindAwareness, unbindAwareness } from "./awareness.js";

const require = createRequire(import.meta.url);
const Y = require("yjs");

type SharedDoc = {
  getText(name: string): { length: number; insert(index: number, text: string): void; toString(): string };
  on(event: "update", handler: (update: Uint8Array, origin: unknown) => void): void;
  off(event: "update", handler: (update: Uint8Array, origin: unknown) => void): void;
  awareness: any;
};

interface Snapshot {
  fileId: string;
  roomId: string;
  state: string;
  version: number;
  content: string;
}

interface DocumentContext {
  fileId: string;
  roomId: string;
}

interface BoundDocument extends DocumentContext {
  doc: SharedDoc;
  version: number;
  dirty: boolean;
  flushTimer: ReturnType<typeof setTimeout> | null;
  maxWaitTimer: ReturnType<typeof setTimeout> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  retryDelayMs: number;
  revision: number;
  flushPromise: Promise<void> | null;
  updateHandler: (update: Uint8Array, origin: unknown) => void;
}

const contexts = new Map<string, DocumentContext>();
const bindings = new Map<string, BoundDocument>();
const pendingFinalFlushes = new Map<string, Promise<void>>();
const inMemoryRecovery = new Map<string, string>();
const readyPromises = new WeakMap<object, Promise<void>>();

export function registerDocumentContext(docName: string, context: DocumentContext): void {
  const existing = contexts.get(docName);
  if (existing && (existing.fileId !== context.fileId || existing.roomId !== context.roomId)) {
    throw new Error(`Conflicting context registered for ${docName}`);
  }
  contexts.set(docName, context);
}

function serviceHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.SERVICE_JWT_SECRET}`,
  };
}

async function loadSnapshot(fileId: string): Promise<Snapshot> {
  const response = await fetch(`${config.BACKEND_INTERNAL_URL}/files/${fileId}/collaboration`, {
    headers: serviceHeaders(),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Snapshot load failed with HTTP ${response.status}`), { status: response.status });
  }
  return await response.json() as Snapshot;
}

async function writeSnapshot(docName: string, binding: BoundDocument): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const encodedRevision = binding.revision;
    const state = Buffer.from(Y.encodeStateAsUpdate(binding.doc)).toString("base64");
    const content = binding.doc.getText("monaco").toString();
    const recoveryCached = await cacheRecoverySnapshot(`file:${binding.fileId}`, state);
    if (!recoveryCached) inMemoryRecovery.set(`file:${binding.fileId}`, state);

    const response = await fetch(`${config.BACKEND_INTERNAL_URL}/files/${binding.fileId}/collaboration`, {
      method: "PUT",
      headers: serviceHeaders(),
      body: JSON.stringify({
        roomId: binding.roomId,
        expectedVersion: binding.version,
        state,
        content,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const saved = await response.json() as Snapshot;
      binding.version = saved.version;
      binding.dirty = binding.revision > encodedRevision;
      binding.retryDelayMs = 1000;
      inMemoryRecovery.delete(`file:${binding.fileId}`);
      await clearRecoverySnapshot(`file:${binding.fileId}`);
      if (binding.dirty) scheduleFlush(docName, binding);
      return;
    }
    if (response.status === 404 || response.status === 403) {
      binding.dirty = false;
      inMemoryRecovery.delete(`file:${binding.fileId}`);
      await clearRecoverySnapshot(`file:${binding.fileId}`);
      throw Object.assign(new Error(`Document is no longer writable (HTTP ${response.status})`), { permanent: true });
    }
    if (response.status !== 409) {
      throw new Error(`Snapshot write failed with HTTP ${response.status}`);
    }

    // Merge the winner's CRDT state and retry with a combined snapshot.
    const current = await loadSnapshot(binding.fileId);
    if (current.roomId !== binding.roomId) {
      throw Object.assign(new Error("File-room ownership changed"), { permanent: true });
    }
    if (current.state) {
      Y.applyUpdate(binding.doc, Buffer.from(current.state, "base64"), "persistence-merge");
    }
    binding.version = current.version;
  }
  throw new Error("Snapshot remained stale after conflict retries");
}

function clearTimers(binding: BoundDocument): void {
  if (binding.flushTimer) clearTimeout(binding.flushTimer);
  if (binding.maxWaitTimer) clearTimeout(binding.maxWaitTimer);
  if (binding.retryTimer) clearTimeout(binding.retryTimer);
  binding.flushTimer = null;
  binding.maxWaitTimer = null;
  binding.retryTimer = null;
}

async function performFlush(docName: string, binding: BoundDocument, final: boolean): Promise<void> {
  try {
    await writeSnapshot(docName, binding);
  } catch (error: any) {
    if (error?.permanent) {
      binding.dirty = false;
      console.warn(`[Persistence] Stopped persistence for ${docName}: ${error.message}`);
      return;
    }
    console.error(`[Persistence] Flush failed for ${docName}; recovery state retained:`, error);
    binding.dirty = true;
    if (!final) {
      const delay = binding.retryDelayMs;
      binding.retryDelayMs = Math.min(delay * 2, 30000);
      binding.retryTimer = setTimeout(() => void flush(docName), delay);
    }
    if (final) throw error;
  }
}

async function flush(docName: string, final = false): Promise<void> {
  const binding = bindings.get(docName);
  if (!binding || !binding.dirty) return;
  if (binding.flushPromise) {
    await binding.flushPromise;
    if (final && binding.dirty) await flush(docName, true);
    return;
  }
  if (binding.flushTimer) clearTimeout(binding.flushTimer);
  if (binding.maxWaitTimer) clearTimeout(binding.maxWaitTimer);
  binding.flushTimer = null;
  binding.maxWaitTimer = null;

  const pending = performFlush(docName, binding, final).finally(() => {
    if (binding.flushPromise === pending) binding.flushPromise = null;
  });
  binding.flushPromise = pending;
  await pending;
}

function scheduleFlush(docName: string, binding: BoundDocument): void {
  binding.dirty = true;
  if (binding.flushTimer) clearTimeout(binding.flushTimer);
  binding.flushTimer = setTimeout(() => void flush(docName), config.DOCUMENT_FLUSH_DEBOUNCE_MS);
  if (!binding.maxWaitTimer) {
    binding.maxWaitTimer = setTimeout(() => void flush(docName), config.DOCUMENT_FLUSH_MAX_WAIT_MS);
  }
}

async function initializeDocument(docName: string, doc: SharedDoc): Promise<void> {
  const priorFinalFlush = pendingFinalFlushes.get(docName);
  if (priorFinalFlush) await priorFinalFlush.catch(() => undefined);

  const context = contexts.get(docName);
  if (!context) throw new Error(`No document context registered for ${docName}`);
  const redisRecovery = await loadRecoverySnapshot(docName);
  const memoryRecovery = inMemoryRecovery.get(docName);
  let snapshot: Snapshot;
  try {
    snapshot = await loadSnapshot(context.fileId);
  } catch (error) {
    const recoveryState = redisRecovery ?? memoryRecovery;
    if (!recoveryState) throw error;
    console.warn(`[Persistence] MongoDB snapshot unavailable for ${docName}; opening recoverable cached state`);
    snapshot = {
      fileId: context.fileId,
      roomId: context.roomId,
      state: "",
      version: -1,
      content: "",
    };
  }
  if (snapshot.roomId !== context.roomId) throw new Error("File-room ownership mismatch");

  if (snapshot.state) {
    Y.applyUpdate(doc, Buffer.from(snapshot.state, "base64"), "persistence-load");
  } else if (snapshot.content && doc.getText("monaco").length === 0) {
    doc.getText("monaco").insert(0, snapshot.content);
  }
  for (const state of [redisRecovery, memoryRecovery]) {
    if (state) Y.applyUpdate(doc, Buffer.from(state, "base64"), "persistence-recovery");
  }

  const initiallyDirty = Boolean(redisRecovery || memoryRecovery || (!snapshot.state && snapshot.content));
  const binding: BoundDocument = {
    ...context,
    doc,
    version: snapshot.version,
    dirty: initiallyDirty,
    flushTimer: null,
    maxWaitTimer: null,
    retryTimer: null,
    retryDelayMs: 1000,
    revision: initiallyDirty ? 1 : 0,
    flushPromise: null,
    updateHandler: () => {},
  };
  binding.updateHandler = (_update, origin) => {
    if (origin !== "persistence-load") {
      binding.revision += 1;
      scheduleFlush(docName, binding);
    }
  };
  doc.on("update", binding.updateHandler);
  bindings.set(docName, binding);
  bindDocState(docName, doc);
  bindAwareness(docName, doc.awareness);
  if (binding.dirty) scheduleFlush(docName, binding);
}

export function waitForDocumentReady(doc: SharedDoc): Promise<void> {
  return readyPromises.get(doc as object) ?? Promise.reject(new Error("Document persistence was not initialized"));
}

export const yjsPersistence = {
  provider: null,

  bindState(docName: string, doc: SharedDoc): Promise<void> {
    const ready = initializeDocument(docName, doc);
    readyPromises.set(doc as object, ready);
    return ready;
  },

  async writeState(docName: string, doc: SharedDoc): Promise<void> {
    const binding = bindings.get(docName);
    if (!binding) return;
    clearTimers(binding);
    binding.dirty = true;
    const finalFlush = flush(docName, true)
      .catch(async (error) => {
        const state = Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64");
        inMemoryRecovery.set(docName, state);
        console.error(`[Persistence] Final MongoDB flush deferred for ${docName}:`, error);
      })
      .finally(() => {
        doc.off("update", binding.updateHandler);
        unbindDocState(docName);
        unbindAwareness(docName);
        bindings.delete(docName);
        pendingFinalFlushes.delete(docName);
      });
    pendingFinalFlushes.set(docName, finalFlush);
    await finalFlush;
  },
};

export async function flushAllDocuments(): Promise<void> {
  await Promise.all([...bindings.keys()].map((docName) => flush(docName, true).catch(() => undefined)));
  await Promise.allSettled([...pendingFinalFlushes.values()]);
}
