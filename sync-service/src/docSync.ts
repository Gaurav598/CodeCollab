import { Redis } from "ioredis";
import { config } from "./config.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Y = require("yjs");

const pub = new Redis(config.REDIS_URL);
const sub = new Redis(config.REDIS_URL);

type DocBinding = {
  doc: any;
  channel: string;
  updateHandler: (update: Uint8Array, origin: any) => void;
};

const docMap = new Map<string, DocBinding>();

sub.on("message", (channel, message) => {
  if (channel.startsWith("doc:")) {
    const docName = channel.substring(4); // "doc:".length
    const binding = docMap.get(docName);
    
    if (binding) {
      try {
        const update = Buffer.from(message, 'base64');
        Y.applyUpdate(binding.doc, update, "redis");
      } catch (err) {
        console.error(`[DocSync] Failed to apply update for ${docName}:`, err);
      }
    }
  }
});

export function bindDocState(docName: string, doc: any) {
  if (docMap.has(docName)) {
    return;
  }

  const channel = `doc:${docName}`;
  sub.subscribe(channel).catch(console.error);

  const updateHandler = (update: Uint8Array, origin: any) => {
    if (origin === "redis") return;
    try {
      const base64Update = Buffer.from(update).toString('base64');
      pub.publish(channel, base64Update).catch(err => {
        console.error(`[DocSync] Failed to publish to ${channel}`, err);
      });
    } catch (err) {
      console.error(`[DocSync] Failed to encode update for ${docName}:`, err);
    }
  };

  doc.on("update", updateHandler);
  docMap.set(docName, { doc, channel, updateHandler });
}

export function unbindDocState(docName: string) {
  const binding = docMap.get(docName);
  if (!binding) return;

  binding.doc.off("update", binding.updateHandler);
  docMap.delete(docName);
  sub.unsubscribe(binding.channel).catch(console.error);
}

export async function closeDocRedis(): Promise<void> {
  docMap.forEach((binding, docName) => {
    binding.doc.off("update", binding.updateHandler);
    docMap.delete(docName);
  });
  await Promise.all([pub.quit(), sub.quit()]);
}

const recoveryKey = (docName: string) => `yjs:recovery:${docName}`;

/** Redis is a recovery cache during a MongoDB outage, not durable storage. */
export async function cacheRecoverySnapshot(docName: string, state: string): Promise<boolean> {
  try {
    await pub.set(recoveryKey(docName), state, "EX", 7 * 24 * 60 * 60);
    return true;
  } catch (error) {
    console.error(`[DocSync] Failed to cache recovery state for ${docName}:`, error);
    return false;
  }
}

export async function loadRecoverySnapshot(docName: string): Promise<string | null> {
  try {
    return await pub.get(recoveryKey(docName));
  } catch (error) {
    console.error(`[DocSync] Failed to load recovery state for ${docName}:`, error);
    return null;
  }
}

export async function clearRecoverySnapshot(docName: string): Promise<void> {
  try {
    await pub.del(recoveryKey(docName));
  } catch (error) {
    console.error(`[DocSync] Failed to clear recovery state for ${docName}:`, error);
  }
}
