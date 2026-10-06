import { describe, expect, it } from "vitest";
import { canAccessAdmin } from "./admin-access";

describe("admin access", () => {
  it("allows only admin-role users", () => {
    expect(canAccessAdmin({ role: "admin" })).toBe(true);
    expect(canAccessAdmin({ role: "user" })).toBe(false);
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });
});
