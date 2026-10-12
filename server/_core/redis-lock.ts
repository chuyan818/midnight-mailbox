import crypto from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import { ENV } from "./env";

type RedisClient = RedisClientType;

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  end
  return 0
`;
const RENEW_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("pexpire", KEYS[1], ARGV[2])
  end
  return 0
`;

let client: RedisClient | null = null;
let connectPromise: Promise<RedisClient> | null = null;

export class DistributedLockBusyError extends Error {
  constructor(public readonly key: string) {
    super(`Distributed lock is busy: ${key}`);
    this.name = "DistributedLockBusyError";
  }
}

async function getRedisClient(): Promise<RedisClient | null> {
  if (!ENV.redisUrl) return null;
  if (client?.isReady) return client;

  if (!client) {
    client = createClient({ url: ENV.redisUrl });
    client.on("error", (error) => {
      console.error("[Redis] client error", error);
    });
  }

  if (!connectPromise) {
    connectPromise = client.connect().then(() => client!).finally(() => {
      connectPromise = null;
    });
  }

  return connectPromise;
}

/**
 * Runs a critical section under a Redis lease lock.
 *
 * Redis is used for cross-process serialization, while database constraints and
 * conditional updates remain the final correctness boundary. In development
 * without REDIS_URL this degrades to a local execution path; production fails
 * at startup through env.ts instead of silently running without locks.
 */
export async function withDistributedLock<T>(
  key: string,
  work: () => Promise<T>,
  options: { ttlMs?: number; waitMs?: number; retryMs?: number } = {},
): Promise<T> {
  const redis = await getRedisClient();
  if (!redis) return work();

  const ttlMs = options.ttlMs ?? 15_000;
  const waitMs = options.waitMs ?? 2_000;
  const retryMs = options.retryMs ?? 50;
  const lockKey = `midnight:lock:${key}`;
  const token = crypto.randomUUID();
  const deadline = Date.now() + waitMs;

  while (Date.now() <= deadline) {
    const acquired = await redis.set(lockKey, token, { NX: true, PX: ttlMs });
    if (acquired === "OK") {
      const renewTimer = setInterval(() => {
        void redis.eval(RENEW_LOCK_SCRIPT, {
          keys: [lockKey],
          arguments: [token, String(ttlMs)],
        }).catch((error) => {
          console.error(`[Redis] failed to renew lock ${key}`, error);
        });
      }, Math.max(1_000, Math.floor(ttlMs / 3)));
      try {
        return await work();
      } finally {
        clearInterval(renewTimer);
        await redis.eval(RELEASE_LOCK_SCRIPT, {
          keys: [lockKey],
          arguments: [token],
        }).catch((error) => {
          console.error(`[Redis] failed to release lock ${key}`, error);
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  throw new DistributedLockBusyError(key);
}

export async function closeRedisClient() {
  if (client?.isOpen) await client.quit();
  client = null;
  connectPromise = null;
}
