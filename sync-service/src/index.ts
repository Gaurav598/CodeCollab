import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
// @ts-ignore
import { setupWSConnection, docs as yWsDocs } from "y-websocket/bin/utils";
import { config } from "./config.js";
import { extractToken, parseJwt } from "./auth.js";
import { checkMembership } from "./roomGuard.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const docConnectionCounts = new Map<string, number>();

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

  const claims = parseJwt(token);
  if (!claims || !claims.sub) return socket.destroy();

  const isMember = await checkMembership(roomId, claims.sub);
  if (!isMember) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    return socket.destroy();
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, { fileId, roomId, userId: claims.sub });
  });
});

wss.on("connection", (ws: any, request: any, { fileId, roomId, userId }: any) => {
  try {
    const docName = `file:${fileId}`;
    docConnectionCounts.set(docName, (docConnectionCounts.get(docName) ?? 0) + 1);
    
    // Native y-websocket connection handler (Bypassing external Y.Doc instantiation)
    setupWSConnection(ws, request, { docName });

    ws.on("close", () => {
      const remaining = (docConnectionCounts.get(docName) ?? 1) - 1;
      if (remaining <= 0) {
        docConnectionCounts.delete(docName);
        const doc = yWsDocs.get(docName);
        if (doc) {
          doc.destroy();
          yWsDocs.delete(docName);
        }
      } else {
        docConnectionCounts.set(docName, remaining);
      }
    });
  } catch (error) {
    console.error("[SYNC-WS] Error in connection handler:", error);
    ws.close();
  }
});

server.listen(config.PORT || 1234, () => {
  console.log(`Sync service listening on port ${config.PORT || 1234}`);
});
