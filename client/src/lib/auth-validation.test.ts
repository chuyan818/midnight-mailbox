import { describe, expect, it } from "vitest";
import {
  getPasswordStrength,
  isValidEmail,
  isValidLoginPassword,
  isValidRegistrationPassword,
  isVerificationCodeValid,
} from "./auth-validation";

describe("registration and login validation", () => {
  it("validates email addresses consistently", () => {
    expect(isValidEmail("writer@example.com")).toBe(true);
    expect(isValidEmail(" writer@example.com ")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("enforces registration password and strength rules", () => {
    expect(isValidRegistrationPassword("abc123")).toBe(true);
    expect(isValidRegistrationPassword("abcdef")).toBe(false);
    expect(getPasswordStrength("")).toBe("none");
    expect(getPasswordStrength("abc")).toBe("weak");
    expect(getPasswordStrength("Abc123!@")).toBe("strong");
  });

  it("keeps login and verification code checks deterministic", () => {
    expect(isValidLoginPassword("123456")).toBe(true);
    expect(isValidLoginPassword("12345")).toBe(false);
    expect(isVerificationCodeValid("123456")).toBe(true);
    expect(isVerificationCodeValid("12ab")).toBe(false);
  });
});
