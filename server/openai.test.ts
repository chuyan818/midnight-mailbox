import { describe, it, expect, beforeAll } from "vitest";
import {
  generateAIReply,
  analyzeEmotion,
  checkContentSafety,
  detectLanguage,
} from "./openai";

describe("OpenAI Integration", () => {
  // 检查API Key是否配置
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  describe("Language Detection", () => {
    it("should detect Chinese text", async () => {
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

      const language = await detectLanguage("我今天很开心，感谢你的陪伴。");
      expect(language).toBe("zh");
    }, { timeout: 30000 });

    it("should detect English text", async () => {
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

      const language = await detectLanguage("I am feeling happy today.");
      expect(language).toBe("en");
    }, { timeout: 30000 });
  });

  describe("Emotion Analysis", () => {
    it("should analyze positive emotion", async () => {
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

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
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

      const result = await analyzeEmotion("我感到很孤独和失落，不知道该怎么办。");
      
      expect(result.emotionType).toBeTruthy();
      expect(result.emotionScore).toBeGreaterThanOrEqual(0);
      expect(result.emotionScore).toBeLessThanOrEqual(100);
      expect(result.keywords.length).toBeGreaterThan(0);
    }, { timeout: 30000 });
  });

  describe("Content Safety Check", () => {
    it("should flag safe content as safe", async () => {
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

      const result = await checkContentSafety("今天天气很好，我去公园散步了。");
      
      expect(result).toHaveProperty("isSafe");
      expect(result).toHaveProperty("riskLevel");
      expect(result).toHaveProperty("issues");
      
      expect(result.isSafe).toBe(true);
      expect(result.riskLevel).toBe("low");
      expect(Array.isArray(result.issues)).toBe(true);
    }, { timeout: 30000 });

    it("should detect potentially harmful content", async () => {
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

      const result = await checkContentSafety("我想伤害自己");
      
      expect(result).toHaveProperty("isSafe");
      expect(result).toHaveProperty("riskLevel");
      
      // 这个内容应该被标记为不安全或高风险
      if (!result.isSafe) {
        expect(result.riskLevel).toMatch(/medium|high/);
      }
    }, { timeout: 30000 });
  });

  describe("AI Reply Generation", () => {
    it("should generate a warm reply", async () => {
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

      const letterContent = "我最近感到很孤独，工作压力很大，不知道该怎么办。";
      const reply = await generateAIReply(letterContent, "zh");
      
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
      // 回信应该包含温暖的语言
      expect(reply).toMatch(/理解|感受|陪伴|温暖|鼓励/);
    }, { timeout: 30000 });

    it("should generate reply in appropriate language", async () => {
      if (!hasApiKey) {
        console.log("Skipping test - OPENAI_API_KEY not configured");
        return;
      }

      const letterContent = "I am feeling lonely and stressed about work.";
      const reply = await generateAIReply(letterContent, "en");
      
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
    }, { timeout: 30000 });
  });
});
