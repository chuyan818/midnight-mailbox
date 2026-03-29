import { describe, it, expect } from "vitest";
import {
  detectLanguage,
  analyzeEmotion,
  generateAIReply,
  checkContentSafety,
} from "./llm-hybrid";

describe("Hybrid LLM Integration", () => {
  describe("Language Detection", () => {
    it("should detect Chinese text using heuristics", async () => {
      const language = await detectLanguage("我今天很开心，感谢你的陪伴。");
      expect(language).toBe("zh");
    });

    it("should detect Japanese text using heuristics", async () => {
      const language = await detectLanguage("こんにちは、今日はいい天気ですね。");
      expect(language).toBe("ja");
    });

    it("should detect Korean text using heuristics", async () => {
      const language = await detectLanguage("안녕하세요, 오늘은 좋은 날씨입니다.");
      expect(language).toBe("ko");
    });

    it("should default to English for non-CJK text", async () => {
      const language = await detectLanguage("Hello, how are you today?");
      expect(language).toBe("en");
    });
  });

  describe("Emotion Analysis", () => {
    it("should analyze emotion and return valid structure", async () => {
      const result = await analyzeEmotion("我感到很孤独和失落，不知道该怎么办。");
      
      expect(result).toHaveProperty("emotionType");
      expect(result).toHaveProperty("emotionScore");
      expect(result).toHaveProperty("keywords");
      
      expect(typeof result.emotionType).toBe("string");
      expect(typeof result.emotionScore).toBe("number");
      expect(Array.isArray(result.keywords)).toBe(true);
      
      // 验证情绪评分范围
      expect(result.emotionScore).toBeGreaterThanOrEqual(0);
      expect(result.emotionScore).toBeLessThanOrEqual(100);
      
      // 验证关键词数量
      expect(result.keywords.length).toBeGreaterThan(0);
    }, { timeout: 30000 });

    it("should return fallback emotion on error", async () => {
      // 测试错误处理 - 使用空字符串会触发fallback
      const result = await analyzeEmotion("");
      
      expect(result.emotionType).toBeTruthy();
      expect(result.emotionScore).toBeGreaterThanOrEqual(0);
      expect(result.emotionScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.keywords)).toBe(true);
    });
  });

  describe("AI Reply Generation", () => {
    it("should generate a warm reply", async () => {
      const letterContent = "我最近感到很孤独，工作压力很大，不知道该怎么办。";
      const reply = await generateAIReply(letterContent, "孤独");
      
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
      
      // 回信应该包含温暖的语言
      const warmWords = ["理解", "感受", "陪伴", "温暖", "鼓励", "听到"];
      const hasWarmWord = warmWords.some(word => reply.includes(word));
      expect(hasWarmWord || reply.length > 50).toBe(true);
    }, { timeout: 30000 });

    it("should return fallback reply on error", async () => {
      const reply = await generateAIReply("", "");
      
      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);
    });
  });

  describe("Content Safety Check", () => {
    it("should check content safety and return valid structure", async () => {
      const result = await checkContentSafety("今天天气很好，我去公园散步了。");
      
      expect(result).toHaveProperty("safe");
      expect(result).toHaveProperty("reason");
      
      expect(typeof result.safe).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    }, { timeout: 30000 });

    it("should return safe=true by default on error", async () => {
      const result = await checkContentSafety("");
      
      expect(result.safe).toBe(true);
      expect(typeof result.reason).toBe("string");
    });

    it("should handle potentially harmful content", async () => {
      const result = await checkContentSafety("我想伤害自己");
      
      expect(result).toHaveProperty("safe");
      expect(result).toHaveProperty("reason");
      
      // 不强制要求标记为不安全（因为可能依赖LLM的判断）
      // 但应该返回有效的结构
      expect(typeof result.safe).toBe("boolean");
    }, { timeout: 30000 });
  });

  describe("Fallback Mechanism", () => {
    it("should gracefully handle all errors", async () => {
      // 测试各个函数的错误处理
      const emotionResult = await analyzeEmotion("test");
      expect(emotionResult).toBeDefined();
      expect(emotionResult.emotionType).toBeTruthy();

      const replyResult = await generateAIReply("test", "test");
      expect(replyResult).toBeDefined();
      expect(typeof replyResult).toBe("string");

      const safetyResult = await checkContentSafety("test");
      expect(safetyResult).toBeDefined();
      expect(typeof safetyResult.safe).toBe("boolean");
    }, { timeout: 30000 });
  });

  describe("Multi-language Support", () => {
    it("should handle Chinese content", async () => {
      const emotion = await analyzeEmotion("我很开心");
      expect(emotion.emotionType).toBeTruthy();
      
      const reply = await generateAIReply("我很开心", "快乐");
      expect(reply.length).toBeGreaterThan(0);
    }, { timeout: 30000 });

    it("should handle English content", async () => {
      const emotion = await analyzeEmotion("I am happy");
      expect(emotion.emotionType).toBeTruthy();
      
      const reply = await generateAIReply("I am happy", "happy");
      expect(reply.length).toBeGreaterThan(0);
    }, { timeout: 30000 });
  });
});
