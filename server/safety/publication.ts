import { redactForPublic, type RedactionResult } from "./pii";

export interface PublicationDecision {
  allowed: boolean;
  requiresHumanReview: boolean;
  reason: string;
  redaction: RedactionResult;
}

export function evaluatePublication(input: {
  content: string;
  publicConsent: boolean;
  riskLevel?: string | null;
  requiresHumanReview?: boolean | null;
}): PublicationDecision {
  const redaction = redactForPublic(input.content);
  const highRisk = input.riskLevel === "high" || input.requiresHumanReview === true;
  const requiresHumanReview = highRisk || redaction.requiresHumanReview;

  if (!input.publicConsent) {
    return { allowed: false, requiresHumanReview: false, reason: "用户未明确同意公开", redaction };
  }
  if (highRisk) {
    return { allowed: false, requiresHumanReview: true, reason: "信件存在安全审核标记", redaction };
  }
  if (redaction.requiresHumanReview) {
    return { allowed: false, requiresHumanReview: true, reason: "检测到可能具备识别性的关系或地点信息", redaction };
  }

  return {
    allowed: true,
    requiresHumanReview: false,
    reason: redaction.changed ? "已完成隐私脱敏" : "已通过公开前安全检查",
    redaction,
  };
}
