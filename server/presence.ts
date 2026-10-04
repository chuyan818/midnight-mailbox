const PRESENCE_TTL_MS = 70_000;
const visitors = new Map<string, number>();

function pruneExpired(now = Date.now()) {
  visitors.forEach((lastSeenAt, visitorId) => {
    if (now - lastSeenAt > PRESENCE_TTL_MS) visitors.delete(visitorId);
  });
}

export function heartbeat(visitorId: string) {
  const now = Date.now();
  pruneExpired(now);
  visitors.set(visitorId, now);
  return { onlineCount: visitors.size, expiresInSeconds: Math.floor(PRESENCE_TTL_MS / 1000) };
}

export function getOnlineCount() {
  pruneExpired();
  return { onlineCount: visitors.size };
}

export const presenceConfig = { ttlMs: PRESENCE_TTL_MS };
