/**
 * 会员功能限制逻辑
 * 实现不同会员等级的功能限制和配额管理
 */

import { MembershipTier } from './membership-config';

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  remainingQuota?: number;
}

export interface CooldownCheckResult {
  onCooldown: boolean;
  remainingSeconds: number;
}

/**
 * 检查用户是否可以发送回信
 */
export async function canSendReply(userId: string, tier: MembershipTier): Promise<LimitCheckResult> {
  const dailyLimits: Record<MembershipTier, number> = {
    free: 1,
    standard: 5,
    premium: -1, // -1 表示无限制
  };

  const limit = dailyLimits[tier];

  if (limit === -1) {
    return { allowed: true, remainingQuota: -1 };
  }

  // 模拟查询数据库获取今日已发送的回信数
  // 实际应该从数据库查询
  const sentToday = 0; // 示例值

  if (sentToday >= limit) {
    return {
      allowed: false,
      reason: `您今日的回信配额已用完，明天再来吧`,
      remainingQuota: 0,
    };
  }

  return { allowed: true, remainingQuota: limit - sentToday };
}

/**
 * 检查用户是否可以收藏信件
 */
export async function canCollectLetter(userId: string, tier: MembershipTier): Promise<LimitCheckResult> {
  const canCollect: Record<MembershipTier, boolean> = {
    free: false,
    standard: true,
    premium: true,
  };

  if (!canCollect[tier]) {
    return {
      allowed: false,
      reason: '免费用户无法收藏信件，请升级到标准会员或高级会员',
      remainingQuota: 0,
    };
  }

  const maxCollections: Record<MembershipTier, number> = {
    free: 0,
    standard: 100,
    premium: -1, // 无限制
  };

  const max = maxCollections[tier];

  if (max === -1) {
    return { allowed: true, remainingQuota: -1 };
  }

  // 模拟查询数据库获取已收藏的数量
  const collected = 0; // 示例值

  if (collected >= max) {
    return {
      allowed: false,
      reason: `您的收藏已达到上限（${max}个），请删除一些收藏后重试`,
      remainingQuota: 0,
    };
  }

  return { allowed: true, remainingQuota: max - collected };
}

/**
 * 检查用户写信的冷却时间
 */
export async function getWriteCooldown(userId: string, tier: MembershipTier): Promise<CooldownCheckResult> {
  const cooldownSeconds: Record<MembershipTier, number> = {
    free: 300, // 5分钟
    standard: 0, // 无冷却
    premium: 0, // 无冷却
  };

  const cooldown = cooldownSeconds[tier];

  if (cooldown === 0) {
    return { onCooldown: false, remainingSeconds: 0 };
  }

  // 模拟查询数据库获取最后一次写信的时间
  // 实际应该从数据库查询
  const lastWriteTime = Date.now() - 60000; // 示例：1分钟前
  const elapsedSeconds = Math.floor((Date.now() - lastWriteTime) / 1000);

  if (elapsedSeconds < cooldown) {
    return {
      onCooldown: true,
      remainingSeconds: cooldown - elapsedSeconds,
    };
  }

  return { onCooldown: false, remainingSeconds: 0 };
}

/**
 * 检查用户是否可以创建主题信箱
 */
export async function canCreateThematicMailbox(userId: string, tier: MembershipTier): Promise<LimitCheckResult> {
  const canCreate: Record<MembershipTier, boolean> = {
    free: false,
    standard: false,
    premium: true,
  };

  if (!canCreate[tier]) {
    return {
      allowed: false,
      reason: '只有高级会员才能创建主题信箱',
      remainingQuota: 0,
    };
  }

  return { allowed: true, remainingQuota: -1 };
}

/**
 * 获取会员功能限制信息
 */
export function getMembershipLimits(tier: MembershipTier): Record<string, any> {
  return {
    free: {
      dailyReplies: 1,
      maxCollections: 0,
      canCollect: false,
      canThematicMailbox: false,
      canAIAnalysis: false,
      writeCooldown: 300,
    },
    standard: {
      dailyReplies: 5,
      maxCollections: 100,
      canCollect: true,
      canThematicMailbox: false,
      canAIAnalysis: false,
      writeCooldown: 0,
    },
    premium: {
      dailyReplies: -1,
      maxCollections: -1,
      canCollect: true,
      canThematicMailbox: true,
      canAIAnalysis: true,
      writeCooldown: 0,
    },
  }[tier];
}
