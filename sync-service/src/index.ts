import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
// @ts-ignore
import { setupWSConnection, getYDoc, setPersistence } from "y-websocket/bin/utils";
import * as decoding from "lib0/decoding";
import { config } from "./config.js";
import { extractToken, verifyJwt } from "./auth.js";
import { checkCollaborationAccess } from "./roomGuard.js";
import { flushAllDocuments, registerDocumentContext, waitForDocumentReady, yjsPersistence } from "./persistence.js";
import { closeDocRedis } from "./docSync.js";
import { closeAwarenessRedis } from "./awareness.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
setPersistence(yjsPersistence);

app.use(express.json());

app.get("/health", async (_request, response) => {
  response.status(200).json({ status: "UP", service: "sync-service" });
});

server.on("upgrade", async (request, socket, head) => {
  const url = new URL(request.url || "", "http://localhost");
  if (!url.pathname.startsWith("/sync")) {
    socket.destroy();
    return;
  }

  const fileId = url.searchParams.get("fileId");
  const roomId = url.searchParams.get("roomId");

  if (!fileId || !roomId) return socket.destroy();

  const token = extractToken(request);
  if (!token) return socket.destroy();

  const claims = verifyJwt(token);
  if (!claims || !claims.sub) return socket.destroy();

  const access = await checkCollaborationAccess(roomId, fileId, claims.sub);
  if (!access) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    return socket.destroy();
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, { fileId, roomId, userId: claims.sub, canEdit: access.canEdit });
  });
});

wss.on("connection", async (ws: any, request: any, { fileId, roomId, userId, canEdit }: any) => {
  try {
    const docName = `file:${fileId}`;
    registerDocumentContext(docName, { fileId, roomId });
    const doc = getYDoc(docName);
    await waitForDocumentReady(doc);
    setupWSConnection(ws, request, { docName });

    let currentCanEdit = canEdit;
    installReadOnlyGuard(ws, () => currentCanEdit);

    const recheck = setInterval(async () => {
      const refreshed = await checkCollaborationAccess(roomId, fileId, userId);
      if (!refreshed) {
        clearInterval(recheck);
        ws.close(4403, "Access revoked");
        return;
      }
      currentCanEdit = refreshed.canEdit;
    }, config.AUTHORIZATION_RECHECK_MS);
    ws.once("close", () => clearInterval(recheck));
  } catch (error) {
    console.error("[SYNC-WS] Error in connection handler:", error);
    ws.close();
  }
});

export type ReadOnlyMessageDecision = "allow" | "ignore" | "reject";

/**
 * Viewers may request state and publish awareness. Their automatic sync-step-2
 * response is ignored because it can carry arbitrary document updates.
 */
export function classifyReadOnlyMessage(data: ArrayBuffer | Buffer | Uint8Array): ReadOnlyMessageDecision {
  try {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const outerType = decoding.readVarUint(decoder);
    if (outerType === 1) return "allow";
    if (outerType !== 0) return "reject";
    const syncType = decoding.readVarUint(decoder);
    if (syncType === 0) return "allow";
    if (syncType === 1) return "ignore";
    return "reject";
  } catch {
    return "reject";
  }
}

function installReadOnlyGuard(ws: any, canEdit: () => boolean): void {
  const handlers = ws.listeners("message");
  ws.removeAllListeners("message");
  ws.on("message", (data: ArrayBuffer | Buffer | Uint8Array) => {
    if (!canEdit()) {
      const decision = classifyReadOnlyMessage(data);
      if (decision === "ignore") return;
      if (decision === "reject") {
        ws.close(4403, "Read-only room role");
        return;
      }
    }
    handlers.forEach((handler: (...args: any[]) => void) => handler.call(ws, data));
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[Shutdown] ${signal}: flushing collaborative documents`);
  await flushAllDocuments();
  wss.clients.forEach((client) => client.close(1012, "Service restarting"));
  await Promise.allSettled([closeDocRedis(), closeAwarenessRedis()]);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

server.listen(config.PORT || 1234, () => {
  console.log(`Sync service listening on port ${config.PORT || 1234}`);
});
