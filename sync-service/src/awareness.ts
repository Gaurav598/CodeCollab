import { Redis } from "ioredis";
import * as awarenessProtocol from "y-protocols/awareness";
import { config } from "./config.js";

const pub = new Redis(config.REDIS_URL);
const sub = new Redis(config.REDIS_URL);

type AwarenessBinding = {
  awareness: awarenessProtocol.Awareness;
  channel: string;
  updateHandler: (changes: any, origin: any) => void;
};

const awarenessMap = new Map<string, AwarenessBinding>();

// Listen for incoming awareness updates from Redis
sub.on("message", (channel, message) => {
  if (channel.startsWith("awareness:")) {
    const docName = channel.substring(10); // "awareness:".length
    const binding = awarenessMap.get(docName);
    
    if (binding) {
      try {
        const update = Buffer.from(message, 'base64');
        awarenessProtocol.applyAwarenessUpdate(binding.awareness, update, "redis");
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

  const channel = `awareness:${docName}`;
  sub.subscribe(channel).catch(console.error);

  const updateHandler = ({ added, updated, removed }: any, origin: any) => {
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
  };

  awareness.on("update", updateHandler);
  awarenessMap.set(docName, { awareness, channel, updateHandler });
}

export function unbindAwareness(docName: string) {
  const binding = awarenessMap.get(docName);
  if (!binding) {
    return;
  }
  binding.awareness.off("update", binding.updateHandler);
  awarenessMap.delete(docName);
  sub.unsubscribe(binding.channel).catch(console.error);
}

export async function closeAwarenessRedis(): Promise<void> {
  awarenessMap.forEach((binding, docName) => {
    binding.awareness.off("update", binding.updateHandler);
    awarenessMap.delete(docName);
  });
  await Promise.all([pub.quit(), sub.quit()]);
}
