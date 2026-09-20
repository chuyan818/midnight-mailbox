import { describe, expect, it } from "vitest";
import { hashPassword, validateAuthEmail, validateAuthPassword, verifyPassword, authLimits } from "./email-auth";
import { createGoogleState, verifyGoogleState, googleOAuthConfig } from "./google-auth";

describe("email authentication security", () => {
  it("hashes passwords with a salted one-way representation", async () => {
    const first = await hashPassword("StrongPass123");
    const second = await hashPassword("StrongPass123");
    expect(first).not.toBe(second);
    expect(await verifyPassword("StrongPass123", first)).toBe(true);
    expect(await verifyPassword("WrongPass123", first)).toBe(false);
  });

  it("enforces email and password policy", () => {
    expect(validateAuthEmail("person@example.com")).toBe(true);
    expect(validateAuthEmail("not-an-email")).toBe(false);
    expect(validateAuthPassword("StrongPass123")).toBe(true);
    expect(validateAuthPassword("short1")).toBe(false);
    expect(authLimits.maxCodeAttempts).toBe(5);
  });
});

describe("Google OAuth state", () => {
  it("round-trips a local return path", () => {
    const state = createGoogleState("/profile");
    expect(verifyGoogleState(state)).toEqual({ returnPath: "/profile" });
  });

  it("rejects tampered and malformed state", () => {
    const state = createGoogleState("/profile");
    const [payload, signature] = state.split(".");
    expect(verifyGoogleState(`${payload}.${signature}x`)).toBeUndefined();
    expect(verifyGoogleState("not-a-state")).toBeUndefined();
  });

  it("keeps a finite state lifetime", () => {
    expect(googleOAuthConfig.stateTtlMs).toBe(10 * 60 * 1000);
  });
});
