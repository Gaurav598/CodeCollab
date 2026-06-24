import { Redis } from "ioredis";
import * as awarenessProtocol from "y-protocols/awareness";
import { config } from "./config.js";

const pub = new Redis(config.REDIS_URL);
const sub = new Redis(config.REDIS_URL);

// Map of docName to awareness instance
const awarenessMap = new Map<string, awarenessProtocol.Awareness>();

// Listen for incoming awareness updates from Redis
sub.on("message", (channel, message) => {
  if (channel.startsWith("awareness:")) {
    const docName = channel.substring(10); // "awareness:".length
    const awareness = awarenessMap.get(docName);
    
    if (awareness) {
      try {
        const update = Buffer.from(message, 'base64');
        awarenessProtocol.applyAwarenessUpdate(awareness, update, "redis");
      } catch (err) {
        console.error(`[Awareness] Failed to apply update for ${docName}:`, err);
      }
    }
  }
});

export function bindAwareness(docName: string, awareness: awarenessProtocol.Awareness) {
  if (awarenessMap.has(docName)) {
    return; // Already bound
  }

  awarenessMap.set(docName, awareness);
  
  // Subscribe to Redis channel for this document's awareness
  const channel = `awareness:${docName}`;
  sub.subscribe(channel).catch(console.error);

  // Listen to local awareness updates and broadcast them to Redis
  awareness.on("update", ({ added, updated, removed }: any, origin: any) => {
    // Prevent infinite loops by ignoring updates that came from Redis
    if (origin === "redis") return;

    const changedClients = added.concat(updated).concat(removed);
    if (changedClients.length === 0) return;

    try {
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
      const base64Update = Buffer.from(update).toString('base64');
      pub.publish(channel, base64Update).catch(console.error);
    } catch (err) {
      console.error(`[Awareness] Failed to encode update for ${docName}:`, err);
    }
  });
}

export function unbindAwareness(docName: string) {
  awarenessMap.delete(docName);
  sub.unsubscribe(`awareness:${docName}`).catch(console.error);
}
