import { describe, expect, it } from "vitest";
import { getBadgeLabel, getBadgeTier } from "./membership-tier";

describe("membership badge tier mapping", () => {
  it("maps persisted monthly and standard plans to standard", () => {
    expect(getBadgeTier("monthly")).toBe("standard");
    expect(getBadgeTier("standard")).toBe("standard");
  });

  it("maps persisted yearly and premium plans to premium", () => {
    expect(getBadgeTier("yearly")).toBe("premium");
    expect(getBadgeTier("premium")).toBe("premium");
  });

  it("falls back safely to the free tier", () => {
    expect(getBadgeTier()).toBe("free");
    expect(getBadgeTier(null)).toBe("free");
    expect(getBadgeTier("unknown")).toBe("free");
    expect(getBadgeLabel("free")).toBe("免费版");
  });
});
