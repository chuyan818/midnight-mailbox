/**
 * 会员权限配置系统
 * 定义三层会员结构：免费用户、标准会员、高级会员
 */

export type MembershipTier = 'free' | 'standard' | 'premium';

export interface MembershipTierConfig {
  id: MembershipTier;
  name: string;
  price: number; // 月价格，单位：元
  description: string;
  features: string[];
}

/**
 * 会员等级配置
 */
export const MEMBERSHIP_TIERS: Record<MembershipTier, MembershipTierConfig> = {
  free: {
    id: 'free',
    name: '免费用户',
    price: 0,
    description: '免费用户可享受基础功能',
    features: [
      'basic_letters',
      'basic_papers',
      'simple_report',
    ],
  },
  standard: {
    id: 'standard',
    name: '标准会员',
    price: 15,
    description: '标准会员享受更多功能和优先服务',
    features: [
      'basic_letters',
      'collect_letters',
      'all_papers',
      'complete_report',
      'priority_delivery',
      'night_special_letters',
    ],
  },
  premium: {
    id: 'premium',
    name: '高级会员',
    price: 35,
    description: '高级会员享受全部功能和深度个性化服务',
    features: [
      'basic_letters',
      'collect_letters',
      'all_papers',
      'complete_report',
      'priority_delivery',
      'night_special_letters',
      'thematic_mailbox',
      'ai_deep_analysis',
      'private_encryption',
      'exclusive_papers',
      'priority_support',
    ],
  },
};

/**
 * 获取会员等级
 */
export function getMembershipTier(tier: string): MembershipTier {
  if (tier === 'free' || tier === 'standard' || tier === 'premium') {
    return tier;
  }
  return 'free';
}

/**
 * 获取会员价格
 */
export function getMembershipPrice(tier: MembershipTier): number {
  return MEMBERSHIP_TIERS[tier].price;
}

/**
 * 获取会员功能列表
 */
export function getMembershipFeatures(tier: MembershipTier): string[] {
  return MEMBERSHIP_TIERS[tier].features;
}

/**
 * 检查会员是否有某个功能
 */
export function hasMembershipFeature(tier: MembershipTier, feature: string): boolean {
  return MEMBERSHIP_TIERS[tier].features.includes(feature);
}

/**
 * 获取会员等级配置
 */
export function getMembershipConfig(tier: MembershipTier): MembershipTierConfig {
  return MEMBERSHIP_TIERS[tier];
}
