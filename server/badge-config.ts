/**
 * 会员徽章配置系统
 * 为不同等级的会员设计专属徽章和身份标识
 */

import { MembershipTier } from './membership-config';

export interface MembershipBadge {
  id: string;
  tier: MembershipTier;
  name: string;
  description: string;
  icon: string; // SVG或图标名称
  color: string; // 徽章颜色
  backgroundColor: string; // 背景颜色
  borderColor: string; // 边框颜色
  tooltip: string; // 悬停提示
  displayLevel: 'small' | 'medium' | 'large'; // 显示尺寸
}

/**
 * 会员徽章配置
 */
export const MEMBERSHIP_BADGES: Record<MembershipTier, MembershipBadge> = {
  free: {
    id: 'badge-free',
    tier: 'free',
    name: '普通用户',
    description: '免费用户',
    icon: '👤',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    tooltip: '普通用户 - 每天可发送1封回信',
    displayLevel: 'small',
  },
  standard: {
    id: 'badge-standard',
    tier: 'standard',
    name: '标准会员',
    description: '标准会员 ¥15/月',
    icon: '⭐',
    color: '#f59e0b',
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
    tooltip: '标准会员 - 每天可发送5封回信，享受优先投递服务',
    displayLevel: 'medium',
  },
  premium: {
    id: 'badge-premium',
    tier: 'premium',
    name: '高级会员',
    description: '高级会员 ¥35/月',
    icon: '👑',
    color: '#ec4899',
    backgroundColor: '#fdf2f8',
    borderColor: '#fbcfe8',
    tooltip: '高级会员 - 无限回信，享受AI深度分析和优先客服支持',
    displayLevel: 'large',
  },
};

/**
 * 获取会员徽章配置
 */
export function getMembershipBadge(tier: MembershipTier): MembershipBadge {
  return MEMBERSHIP_BADGES[tier];
}

/**
 * 获取徽章的CSS类名
 */
export function getBadgeClassName(tier: MembershipTier): string {
  const badge = MEMBERSHIP_BADGES[tier];
  return `badge-${tier}-${badge.displayLevel}`;
}

/**
 * 获取徽章的样式对象
 */
export function getBadgeStyle(tier: MembershipTier): React.CSSProperties {
  const badge = MEMBERSHIP_BADGES[tier];
  return {
    backgroundColor: badge.backgroundColor,
    color: badge.color,
    borderColor: badge.borderColor,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '12px',
    padding: badge.displayLevel === 'small' ? '4px 8px' : badge.displayLevel === 'medium' ? '6px 12px' : '8px 16px',
    fontSize: badge.displayLevel === 'small' ? '12px' : badge.displayLevel === 'medium' ? '14px' : '16px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  };
}

/**
 * 会员权益说明
 */
export interface MembershipBenefit {
  id: string;
  tier: MembershipTier;
  title: string;
  description: string;
  icon: string;
  category: 'feature' | 'service' | 'support';
}

/**
 * 会员权益配置
 */
export const MEMBERSHIP_BENEFITS: Record<MembershipTier, MembershipBenefit[]> = {
  free: [
    {
      id: 'benefit-free-1',
      tier: 'free',
      title: '每日回信',
      description: '每天可获得1封温暖的AI回信',
      icon: '💌',
      category: 'feature',
    },
    {
      id: 'benefit-free-2',
      tier: 'free',
      title: '基础信纸',
      description: '使用5种基础信纸主题',
      icon: '📝',
      category: 'feature',
    },
    {
      id: 'benefit-free-3',
      tier: 'free',
      title: '情绪报告',
      description: '查看每日情绪分析和趋势',
      icon: '📊',
      category: 'feature',
    },
  ],
  standard: [
    {
      id: 'benefit-standard-1',
      tier: 'standard',
      title: '每日回信',
      description: '每天可获得5封温暖的AI回信',
      icon: '💌',
      category: 'feature',
    },
    {
      id: 'benefit-standard-2',
      tier: 'standard',
      title: '全部信纸',
      description: '解锁所有信纸主题和特殊效果',
      icon: '📝',
      category: 'feature',
    },
    {
      id: 'benefit-standard-3',
      tier: 'standard',
      title: '完整报告',
      description: '周报和月报，深度情绪分析',
      icon: '📊',
      category: 'feature',
    },
    {
      id: 'benefit-standard-4',
      tier: 'standard',
      title: '优先投递',
      description: '信件优先展示在公共信箱',
      icon: '🚀',
      category: 'service',
    },
    {
      id: 'benefit-standard-5',
      tier: 'standard',
      title: '收藏功能',
      description: '可收藏100封喜爱的信件',
      icon: '❤️',
      category: 'feature',
    },
  ],
  premium: [
    {
      id: 'benefit-premium-1',
      tier: 'premium',
      title: '无限回信',
      description: '每天可获得无限数量的AI回信',
      icon: '💌',
      category: 'feature',
    },
    {
      id: 'benefit-premium-2',
      tier: 'premium',
      title: '专属信纸',
      description: '独享高级和限定版信纸主题',
      icon: '📝',
      category: 'feature',
    },
    {
      id: 'benefit-premium-3',
      tier: 'premium',
      title: 'AI深度分析',
      description: '获得个性化的心理学分析报告',
      icon: '🧠',
      category: 'feature',
    },
    {
      id: 'benefit-premium-4',
      tier: 'premium',
      title: '主题信箱',
      description: '创建和管理多个主题信箱',
      icon: '📮',
      category: 'feature',
    },
    {
      id: 'benefit-premium-5',
      tier: 'premium',
      title: '私密加密',
      description: '信件支持端到端加密存储',
      icon: '🔐',
      category: 'feature',
    },
    {
      id: 'benefit-premium-6',
      tier: 'premium',
      title: '优先客服',
      description: '享受24小时优先客服支持',
      icon: '👥',
      category: 'support',
    },
    {
      id: 'benefit-premium-7',
      tier: 'premium',
      title: '无限收藏',
      description: '无限收藏喜爱的信件和回信',
      icon: '❤️',
      category: 'feature',
    },
  ],
};

/**
 * 获取会员权益列表
 */
export function getMembershipBenefits(tier: MembershipTier): MembershipBenefit[] {
  return MEMBERSHIP_BENEFITS[tier];
}

/**
 * 获取特定类别的权益
 */
export function getBenefitsByCategory(
  tier: MembershipTier,
  category: 'feature' | 'service' | 'support'
): MembershipBenefit[] {
  return MEMBERSHIP_BENEFITS[tier].filter((b) => b.category === category);
}
