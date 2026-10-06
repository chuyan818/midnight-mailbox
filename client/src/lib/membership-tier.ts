export type BadgeTier = "free" | "standard" | "premium";

/**
 * Convert persisted membership values into the three display tiers used by
 * the membership badge. The database currently stores monthly/yearly plans.
 */
export function getBadgeTier(membershipType?: string | null): BadgeTier {
  if (membershipType === "monthly" || membershipType === "standard") {
    return "standard";
  }
  if (membershipType === "yearly" || membershipType === "premium") {
    return "premium";
  }
  return "free";
}

export function getBadgeLabel(tier: BadgeTier): string {
  if (tier === "premium") return "高级会员";
  if (tier === "standard") return "标准会员";
  return "免费版";
}
