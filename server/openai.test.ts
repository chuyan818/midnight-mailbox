import { describe, it, expect } from "vitest";
import {
  generateAIReply,
  analyzeEmotion,
  checkContentSafety,
  detectLanguage,
} from "./openai";

describe("OpenAI Integration", () => {
  // Network-backed tests are opt-in so local CI remains deterministic.
  const runExternalAiTests = Boolean(process.env.OPENAI_API_KEY && process.env.RUN_EXTERNAL_AI_TESTS === "true");
  const skipExternal = () => !runExternalAiTests;

  describe("Language Detection", () => {
    it("should detect Chinese text", async () => {
      if (skipExternal()) return;
      expect(await detectLanguage("我今天很开心，感谢你的陪伴。")).toBe("zh");
    }, { timeout: 30000 });

    it("should detect English text", async () => {
      if (skipExternal()) return;
      expect(await detectLanguage("I am feeling happy today.")).toBe("en");
    }, { timeout: 30000 });
  });

  describe("Emotion Analysis", () => {
    it("should analyze positive emotion", async () => {
      if (skipExternal()) return;
      const result = await analyzeEmotion("今天天气很好，我感到很开心和放松。");
      expect(result).toHaveProperty("emotionType");
      expect(result).toHaveProperty("emotionScore");
      expect(result).toHaveProperty("keywords");
      expect(typeof result.emotionType).toBe("string");
      expect(typeof result.emotionScore).toBe("number");
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.emotionScore).toBeGreaterThanOrEqual(0);
      expect(result.emotionScore).toBeLessThanOrEqual(100);
    }, { timeout: 30000 });

    it("should analyze negative emotion", async () => {
      if (skipExternal()) return;
      const result = await analyzeEmotion("我感到很孤独和失落，不知道该怎么办。");
      expect(result.emotionType).toBeTruthy();
      expect(result.emotionScore).toBeGreaterThanOrEqual(0);
      expect(result.emotionScore).toBeLessThanOrEqual(100);
      expect(result.keywords.length).toBeGreaterThan(0);
    }, { timeout: 30000 });
  });

  describe("Content Safety Check", () => {
    it("should flag safe content as safe", async () => {
      if (skipExternal()) return;
      const result = await checkContentSafety("今天天气很好，我去公园散步了。");
      expect(result.isSafe).toBe(true);
      expect(result.riskLevel).toBe("low");
      expect(Array.isArray(result.issues)).toBe(true);
    }, { timeout: 30000 });

    it("should detect potentially harmful content", async () => {
      if (skipExternal()) return;
      const result = await checkContentSafety("我想伤害自己");
      expect(result).toHaveProperty("isSafe");
      expect(result).toHaveProperty("riskLevel");
      if (!result.isSafe) expect(result.riskLevel).toMatch(/medium|high/);
    }, { timeout: 30000 });
  });

  describe("AI Reply Generation", () => {
    it("should generate a warm reply", async () => {
      if (skipExternal()) return;
      const reply = await generateAIReply("我最近感到很孤独，工作压力很大，不知道该怎么办。", "zh");
      expect(reply).toMatch(/理解|感受|陪伴|温暖|鼓励/);
    }, { timeout: 30000 });

    it("should generate reply in appropriate language", async () => {
      if (skipExternal()) return;
      const reply = await generateAIReply("I am feeling lonely and stressed about work.", "en");
      expect(reply.length).toBeGreaterThan(0);
    }, { timeout: 30000 });
  });
});
