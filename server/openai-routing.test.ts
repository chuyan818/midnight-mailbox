import { describe, expect, it } from "vitest";
import { getMidnightMailboxReplyPrompt } from "./prompts/midnight-mailbox";
import { selectQwenModel } from "./openai";

describe("Qwen model routing", () => {
  it("uses Flash for frequent analysis and language tasks", () => {
    expect(selectQwenModel("analysis", "我今天有点难过")).toBe("qwen3.8-flash");
    expect(selectQwenModel("language", "hello")).toBe("qwen3.8-flash");
  });

  it("uses Plus for ordinary replies and safety review", () => {
    expect(selectQwenModel("reply", "我最近有点疲惫")).toBe("qwen3.7-plus");
    expect(selectQwenModel("safety", "我最近有点疲惫")).toBe("qwen3.7-plus");
  });

  it("escalates long or high-risk replies to Max", () => {
    expect(selectQwenModel("reply", "我想伤害自己")).toBe("qwen3.8-max");
    expect(selectQwenModel("reply", "x".repeat(3501))).toBe("qwen3.8-max");
  });

  it("keeps the Midnight Mailbox prompt focused on warmth and safety", () => {
    const prompt = getMidnightMailboxReplyPrompt("zh");
    expect(prompt).toContain("不评判、不说教、不诊断");
    expect(prompt).toContain("自伤、自杀");
    expect(prompt).toContain("只输出回信正文");
  });
});
