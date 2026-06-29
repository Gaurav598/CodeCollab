import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
// @ts-ignore
import { setupWSConnection, getYDoc, docs } from "y-websocket/bin/utils";
import * as Y from "yjs";
// @ts-ignore
import { RedisPersistence } from "y-redis";
import { config } from "./config.js";
import { extractToken, parseJwt } from "./auth.js";
import { checkMembership } from "./roomGuard.js";
import { persistDocument } from "./persistence.js";
import { bindAwareness, closeAwarenessRedis, unbindAwareness } from "./awareness.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const docConnectionCounts = new Map<string, number>();

// Set up y-redis adapter for syncing documents and awareness
const redisPersistence = new RedisPersistence({
  redisOpts: config.REDIS_URL,
});

// Periodic auto-save removed: architecture moved to raw text and frontend handles auto-saves.

app.use(express.json());

app.get("/health", async (_request, response) => {
  response.status(200).json({
    status: "UP",
    service: "sync-service",
  });
});

app.get("/", (_request, response) => {
  response.json({
    service: "sync-service",
    status: "READY",
  });
});

// Upgrade HTTP requests to WebSocket on /sync
server.on("upgrade", async (request, socket, head) => {
  const url = new URL(request.url || "", "http://localhost");
  if (!url.pathname.startsWith("/sync")) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  const fileId = url.searchParams.get("fileId");
  const roomId = url.searchParams.get("roomId");

  if (!fileId || !roomId) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  // 1. Authenticate user
  const token = extractToken(request);
  if (!token) {
    console.warn("[SYNC-WS] Upgrade failed: Missing token in request URL or headers.");
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const claims = parseJwt(token);
  if (!claims || !claims.sub) {
    console.warn("[SYNC-WS] Upgrade failed: Invalid token claims or missing 'sub' (userId).");
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }
  const userId = claims.sub;

  // 2. Authorize via internal API
  const isMember = await checkMembership(roomId, userId);
  if (!isMember) {
    console.warn(`[SYNC-WS] Upgrade failed: User ${userId} is not a member of room ${roomId}. (Internal API returned false/error)`);
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  console.log(`[SYNC-WS] Upgrade successful for user ${userId} in room ${roomId}`);

  // 3. Upgrade the connection
  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log("[SYNC-WS] handleUpgrade callback called, emitting connection");
    wss.emit("connection", ws, request, { fileId, roomId, userId });
  });
});

wss.on("connection", (ws: any, request: any, { fileId, roomId, userId }: any) => {
  try {
    const docName = `file:${fileId}`;
    docConnectionCounts.set(docName, (docConnectionCounts.get(docName) ?? 0) + 1);
    
    // y-websocket sets up the connection logic internally.
    setupWSConnection(ws, request, { docName });

    // Bind the Yjs document to Redis for sync
    const doc = getYDoc(docName, true);
    if (!redisPersistence.docs.has(docName)) {
      redisPersistence.bindState(docName, doc);
    }
    
    doc.on('update', (update: Uint8Array, origin: any) => {
      require('fs').appendFileSync('sync-service.log', `[SYNC-WS] Doc ${docName} updated from origin: ${origin}\n`);
    });

    // Bind awareness
    // @ts-ignore
    const docFromUtils = docs.get(docName);
    if (docFromUtils && docFromUtils.awareness) {
      docFromUtils.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
        require('fs').appendFileSync('sync-service.log', `[SYNC-WS] Awareness ${docName} updated from origin: ${origin}, added: ${added}, updated: ${updated}, removed: ${removed}\n`);
      });
      bindAwareness(docName, docFromUtils.awareness);
    }

    ws.on("close", () => {
      const remaining = (docConnectionCounts.get(docName) ?? 1) - 1;
      if (remaining <= 0) {
        docConnectionCounts.delete(docName);
        unbindAwareness(docName);
      } else {
        docConnectionCounts.set(docName, remaining);
      }
    });
  } catch (error) {
    console.error("[SYNC-WS] Error in connection handler:", error);
    ws.close();
  }
});

server.listen(config.PORT, () => {
  console.log(`Sync service listening on port ${config.PORT}`);
});

async function shutdown() {
  console.log("Shutting down sync-service...");
  wss.close();
  await closeAwarenessRedis();
  await redisPersistence.destroy();
  server.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
