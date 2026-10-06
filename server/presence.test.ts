import { afterEach, describe, expect, it, vi } from "vitest";
import { getOnlineCount, heartbeat } from "./presence";

describe("online presence", () => {
  afterEach(() => vi.useRealTimers());

  it("counts active visitors and refreshes the same visitor", () => {
    const first = `presence-first-${Date.now()}-${Math.random()}`;
    const second = `presence-second-${Date.now()}-${Math.random()}`;
    expect(heartbeat(first).onlineCount).toBeGreaterThanOrEqual(1);
    const afterSecond = heartbeat(second).onlineCount;
    expect(afterSecond).toBeGreaterThanOrEqual(2);
    expect(heartbeat(first).onlineCount).toBe(afterSecond);
  });

  it("removes visitors after the heartbeat TTL", () => {
    vi.useFakeTimers();
    const visitor = `presence-expiry-${Date.now()}-${Math.random()}`;
    heartbeat(visitor);
    vi.advanceTimersByTime(71_000);
    expect(getOnlineCount().onlineCount).toBe(0);
  });
});
