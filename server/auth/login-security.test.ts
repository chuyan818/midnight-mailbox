import { describe, expect, it } from "vitest";
import { authLimits, normalizeEmail, validateAuthEmail, validateAuthPassword } from "./email-auth";

describe("email login security policy", () => {
  it("normalizes email addresses before security checks", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
  });

  it("requires a valid email and a strong password", () => {
    expect(validateAuthEmail("test@example.com")).toBe(true);
    expect(validateAuthEmail("not-an-email")).toBe(false);
    expect(validateAuthPassword("Midnight2026!")).toBe(true);
    expect(validateAuthPassword("password")).toBe(false);
  });

  it("locks after five failures in a fifteen-minute window", () => {
    expect(authLimits.maxLoginFailures).toBe(5);
    expect(authLimits.loginFailureWindowMs).toBe(15 * 60 * 1000);
    expect(authLimits.loginLockMs).toBe(15 * 60 * 1000);
  });

  it("keeps verification-code limits unchanged", () => {
    expect(authLimits.maxCodeAttempts).toBe(5);
    expect(authLimits.codeDailyLimit).toBe(10);
  });
});
