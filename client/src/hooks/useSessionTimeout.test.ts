import { describe, expect, it } from "vitest";
import {
  SESSION_TIMEOUT_MS,
  SESSION_WARNING_MS,
  SESSION_WARNING_TOAST_ID,
} from "./useSessionTimeout";

describe("session timeout policy", () => {
  it("uses a 30 minute inactivity timeout with a 5 minute warning", () => {
    expect(SESSION_TIMEOUT_MS).toBe(30 * 60 * 1000);
    expect(SESSION_WARNING_MS).toBe(5 * 60 * 1000);
    expect(SESSION_WARNING_MS).toBeLessThan(SESSION_TIMEOUT_MS);
    expect(SESSION_WARNING_TOAST_ID).toBe("session-timeout-warning");
  });
});
