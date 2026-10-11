export type RiskLevel = "low" | "medium" | "high";
export type RiskCategory =
  | "self_harm"
  | "suicide"
  | "harm_to_others"
  | "immediate_danger"
  | "unknown";

export interface DeterministicRisk {
  riskLevel: RiskLevel;
  riskCategory: RiskCategory;
  requiresHumanReview: boolean;
  matchedSignals: number;
}

const HIGH_RISK_RULES: Array<{ category: RiskCategory; pattern: RegExp }> = [
  { category: "immediate_danger", pattern: /(现在|此刻|马上|已经).{0,12}(自杀|自残|轻生|伤人|杀人)/i },
  { category: "suicide", pattern: /(自杀|轻生|不想活了|结束生命|结束自己|想死|去死)/i },
  { category: "self_harm", pattern: /(自残|伤害自己|割腕|吞药|跳楼|无法保证安全)/i },
  { category: "harm_to_others", pattern: /(杀人|伤害他人|报复杀|我要砍|我要打死)/i },
  { category: "suicide", pattern: /(suicide|kill myself|want to die|end my life)/i },
  { category: "self_harm", pattern: /(self[- ]harm|hurt myself|cut myself)/i },
  { category: "harm_to_others", pattern: /(kill someone|hurt someone|harm others)/i },
];

const MEDIUM_RISK_PATTERNS = [
  /(活着没有意义|撑不下去|不想面对明天|消失就好了|绝望)/i,
  /(极度崩溃|失控|马上要爆炸|控制不住自己)/i,
];

export function detectDeterministicRisk(text: string): DeterministicRisk {
  const highMatches = HIGH_RISK_RULES.filter(rule => rule.pattern.test(text));
  const mediumMatches = MEDIUM_RISK_PATTERNS.filter(pattern => pattern.test(text));

  if (highMatches.length > 0) {
    return {
      riskLevel: "high",
      riskCategory: highMatches[0].category,
      requiresHumanReview: true,
      matchedSignals: highMatches.length,
    };
  }

  if (mediumMatches.length > 0) {
    return {
      riskLevel: "medium",
      riskCategory: "unknown",
      requiresHumanReview: true,
      matchedSignals: mediumMatches.length,
    };
  }

  return {
    riskLevel: "low",
    riskCategory: "unknown",
    requiresHumanReview: false,
    matchedSignals: 0,
  };
}

export function mergeRiskSignals(
  deterministic: DeterministicRisk,
  model: Partial<Pick<DeterministicRisk, "riskLevel" | "riskCategory" | "requiresHumanReview">> = {}
): DeterministicRisk {
  const rank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
  const modelLevel = model.riskLevel || "low";
  const riskLevel = rank[deterministic.riskLevel] >= rank[modelLevel]
    ? deterministic.riskLevel
    : modelLevel;

  return {
    riskLevel,
    riskCategory:
      deterministic.riskCategory !== "unknown"
        ? deterministic.riskCategory
        : model.riskCategory || "unknown",
    requiresHumanReview:
      deterministic.requiresHumanReview || Boolean(model.requiresHumanReview) || riskLevel !== "low",
    matchedSignals: deterministic.matchedSignals,
  };
}

export const CRISIS_RESOURCES = {
  primary: {
    label: "全国统一心理援助热线",
    number: process.env.CRISIS_HOTLINE_PRIMARY || "12356",
    note: "服务时长和接通情况以当地官方安排为准",
  },
  emergency: [
    { label: "急救", number: process.env.CRISIS_HOTLINE_EMERGENCY || "120" },
    { label: "警方", number: process.env.CRISIS_HOTLINE_POLICE || "110" },
  ],
} as const;
