import { describe, expect, it } from "vitest";
import { detectDeterministicRisk } from "./risk";
import { redactForPublic } from "./pii";
import { evaluatePublication } from "./publication";

describe("safety defaults", () => {
  it("marks explicit self-harm language as highest-risk human review", () => {
    const result = detectDeterministicRisk("我现在无法保证安全，想要自残，也不想活了");
    expect(result.riskLevel).toBe("high");
    expect(result.requiresHumanReview).toBe(true);
  });

  it("does not escalate ordinary sadness", () => {
    const result = detectDeterministicRisk("今天有些失落，但我想慢慢把事情写下来");
    expect(result.riskLevel).toBe("low");
    expect(result.requiresHumanReview).toBe(false);
  });

  it("redacts direct contact identifiers before public sharing", () => {
    const result = redactForPublic("请联系 me@example.com 或 13812345678，地址是上海市某路 10 号");
    expect(result.redacted).not.toContain("me@example.com");
    expect(result.redacted).not.toContain("13812345678");
    expect(result.fields).toEqual(expect.arrayContaining(["email", "phone", "address"]));
  });

  it("blocks public sharing without explicit consent or for risk review", () => {
    expect(evaluatePublication({ content: "一段文字", publicConsent: false }).allowed).toBe(false);
    const risky = evaluatePublication({ content: "一段文字", publicConsent: true, riskLevel: "high", requiresHumanReview: true });
    expect(risky.allowed).toBe(false);
    expect(risky.requiresHumanReview).toBe(true);
  });
});
