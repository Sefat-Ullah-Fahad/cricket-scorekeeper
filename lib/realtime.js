import { EventEmitter } from 'events';

// Global singleton event emitter across requests and hot-reloads
const globalEmitter = globalThis.__cricket_emitter || new EventEmitter();
globalEmitter.setMaxListeners(200);
if (process.env.NODE_ENV !== 'production') {
  globalThis.__cricket_emitter = globalEmitter;
}

export function broadcastMatchUpdate(shareToken, data) {
  if (!shareToken) return;
  globalEmitter.emit(`match:${shareToken}`, data);
}

export function subscribeToMatch(shareToken, callback) {
  const eventName = `match:${shareToken}`;
  globalEmitter.on(eventName, callback);
  return () => {
    globalEmitter.off(eventName, callback);
  };
}
