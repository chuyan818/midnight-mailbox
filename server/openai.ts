/**
 * OpenAI 兼容模型集成模块。
 * 默认使用阿里云百炼通义千问，并按任务分层路由：
 * - qwen3.7-plus：温暖回信主模型
 * - qwen3.8-flash：情绪分析、语言识别等高频轻任务
 * - qwen3.8-max：长信件或复杂情绪的深度回信
 */
import OpenAI from "openai";
import { getMidnightMailboxReplyPrompt } from "./prompts/midnight-mailbox";

export type QwenTask = "reply" | "analysis" | "safety" | "language" | "deep";

const qwenApiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
const apiKey = qwenApiKey || process.env.OPENAI_API_KEY;
const baseURL =
  process.env.QWEN_BASE_URL ||
  "https://dashscope.aliyuncs.com/compatible-mode/v1";
const qwenRoutingEnabled = process.env.QWEN_ROUTING_ENABLED !== "false";
const defaultModel = process.env.QWEN_MODEL || "qwen3.7-plus";

const MODEL_DEFAULTS: Record<QwenTask, string> = {
  reply: defaultModel,
  analysis: process.env.QWEN_MODEL_ANALYSIS || "qwen3.8-flash",
  safety: process.env.QWEN_MODEL_SAFETY || "qwen3.7-plus",
  language: process.env.QWEN_MODEL_LANGUAGE || "qwen3.8-flash",
  deep: process.env.QWEN_MODEL_DEEP || "qwen3.8-max",
};

let openai: OpenAI | null = null;

export function hasQwenConfig(): boolean {
  return qwenRoutingEnabled && Boolean(qwenApiKey && qwenApiKey.length > 20);
}

/** 根据任务和文本复杂度选择模型。仅返回模型 ID，不暴露密钥。 */
export function selectQwenModel(task: QwenTask, content = ""): string {
  if (task === "reply") {
    const longLetter = content.length > 3500;
    const complexEmotion =
      /(自杀|自残|轻生|不想活|伤害自己|无法保证安全|suicide|self-harm|kill myself)/i.test(
        content
      );
    if (longLetter || complexEmotion) return MODEL_DEFAULTS.deep;
  }
  return MODEL_DEFAULTS[task];
}

export function getQwenRoutingConfig() {
  return {
    enabled: qwenRoutingEnabled,
    configured: hasQwenConfig(),
    models: { ...MODEL_DEFAULTS },
  };
}

function getClient(): OpenAI {
  if (!apiKey)
    throw new Error("QWEN_API_KEY (or DASHSCOPE_API_KEY) is not configured");
  if (!openai) openai = new OpenAI({ apiKey, baseURL });
  return openai;
}

/** 生成“夜航人”温暖回信。 */
export async function generateAIReply(
  letterContent: string,
  language = "zh",
  emotionType?: string
): Promise<string> {
  const context = emotionType ? `\n\n系统已识别的主要情绪：${emotionType}` : "";
  const response = await getClient().chat.completions.create({
    model: selectQwenModel("reply", letterContent),
    messages: [
      { role: "system", content: getMidnightMailboxReplyPrompt(language) },
      { role: "user", content: `用户的来信：\n\n${letterContent}${context}` },
    ],
    temperature: 0.72,
    max_tokens: 700,
  });
  const reply = response.choices[0]?.message?.content?.trim() || "";
  if (!reply) throw new Error("Empty response from Qwen");
  return reply;
}

/** 分析信件情绪。 */
export async function analyzeEmotion(
  letterContent: string,
  language = "zh"
): Promise<{ emotionType: string; emotionScore: number; keywords: string[] }> {
  const languageMap: Record<string, string> = {
    zh: "中文",
    en: "英文",
    ja: "日文",
    ko: "韩文",
  };
  const lang = languageMap[language] || "中文";
  const response = await getClient().chat.completions.create({
    model: selectQwenModel("analysis", letterContent),
    messages: [
      {
        role: "system",
        content: `你是深夜信箱的情绪标注器。只分析文字中明确表达或强烈暗示的情绪，不做心理诊断，不夸大风险。用${lang}返回 JSON：{"emotionType":"快乐|悲伤|焦虑|愤怒|孤独|迷茫|压力|思念","emotionScore":0到100的整数,"keywords":["3到6个关键词"]}。只返回 JSON。`,
      },
      { role: "user", content: `请分析这封信：\n\n${letterContent}` },
    ],
    temperature: 0.25,
    max_tokens: 300,
    response_format: { type: "json_object" },
  });
  const result = JSON.parse(response.choices[0]?.message?.content || "{}");
  return {
    emotionType: result.emotionType || "迷茫",
    emotionScore: Math.min(100, Math.max(0, Number(result.emotionScore) || 50)),
    keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 6) : [],
  };
}

/** 安全审核使用 Plus，避免轻量模型漏掉高风险表达。 */
export async function checkContentSafety(
  letterContent: string
): Promise<{
  isSafe: boolean;
  riskLevel: "low" | "medium" | "high";
  issues: string[];
}> {
  const response = await getClient().chat.completions.create({
    model: selectQwenModel("safety", letterContent),
    messages: [
      {
        role: "system",
        content:
          '你是深夜信箱的安全审核器。检查自伤/自杀意念、伤害他人、极端仇恨和非法活动风险。不要复述危险方法。只返回 JSON：{"isSafe":true或false,"riskLevel":"low|medium|high","issues":["简短原因"]}。情绪低落本身不等于高风险；只有出现明确危险迹象时才提高风险等级。',
      },
      { role: "user", content: `请检查这封信：\n\n${letterContent}` },
    ],
    temperature: 0.1,
    max_tokens: 240,
    response_format: { type: "json_object" },
  });
  const result = JSON.parse(response.choices[0]?.message?.content || "{}");
  const riskLevel =
    result.riskLevel === "high" || result.riskLevel === "medium"
      ? result.riskLevel
      : "low";
  return {
    isSafe: result.isSafe !== false && riskLevel === "low",
    riskLevel,
    issues: Array.isArray(result.issues) ? result.issues.slice(0, 4) : [],
  };
}

/** 语言识别是轻任务，使用 Flash；上层的确定性规则优先。 */
export async function detectLanguage(text: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: selectQwenModel("language", text),
    messages: [
      {
        role: "system",
        content:
          "只返回语言代码：zh（中文）、en（英文）、ja（日文）或ko（韩文）。不要解释。",
      },
      { role: "user", content: text },
    ],
    temperature: 0,
    max_tokens: 8,
  });
  const code =
    response.choices[0]?.message?.content?.trim().toLowerCase() || "zh";
  return ["zh", "en", "ja", "ko"].includes(code) ? code : "zh";
}
