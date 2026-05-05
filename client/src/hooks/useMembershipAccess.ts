/**
 * 会员权限检查Hook
 * 用于在前端检查用户是否有权访问特定功能
 */

export type MembershipTier = 'free' | 'premium';

export interface MembershipFeatures {
  dailyLetterLimit: number;
  aiReplyEnabled: boolean;
  emotionReportType: 'simple' | 'complete';
  emotionTrendDays: number;
  unlimitedWrite: boolean;
  collectionLimit: number;
  themeUnlock: boolean;
  prioritySupport: boolean;
}

export const MEMBERSHIP_FEATURES: Record<MembershipTier, MembershipFeatures> = {
  free: {
    dailyLetterLimit: 1,
    aiReplyEnabled: true,
    emotionReportType: 'simple',
    emotionTrendDays: 0,
    unlimitedWrite: false,
    collectionLimit: 10,
    themeUnlock: false,
    prioritySupport: false,
  },
  premium: {
    dailyLetterLimit: Infinity,
    aiReplyEnabled: true,
    emotionReportType: 'complete',
    emotionTrendDays: 7,
    unlimitedWrite: true,
    collectionLimit: Infinity,
    themeUnlock: true,
    prioritySupport: true,
  },
};

/**
 * 会员权限检查Hook
 * @param userMembershipType 用户的会员类型（'free' 或 'premium'）
 */
export function useMembershipAccess(userMembershipType: MembershipTier = 'free') {
  const membershipTier = userMembershipType;
  const features = MEMBERSHIP_FEATURES[membershipTier];

  // 检查是否可以写信
  const canWrite = (): boolean => {
    return features.unlimitedWrite;
  };

  // 检查是否可以查看完整情绪报告
  const canViewCompleteReport = (): boolean => {
    return features.emotionReportType === 'complete';
  };

  // 检查是否可以查看7天情绪趋势
  const canViewEmotionTrend = (): boolean => {
    return features.emotionTrendDays >= 7;
  };

  // 检查是否可以解锁主题
  const canUnlockTheme = (): boolean => {
    return features.themeUnlock;
  };

  // 检查是否有优先客服支持
  const hasPrioritySupport = (): boolean => {
    return features.prioritySupport;
  };

  // 检查是否达到每日写信限制
  const hasReachedDailyLimit = (letterCount: number): boolean => {
    return letterCount >= features.dailyLetterLimit;
  };

  // 检查是否达到收藏限制
  const hasReachedCollectionLimit = (collectionCount: number): boolean => {
    return collectionCount >= features.collectionLimit;
  };

  return {
    membershipTier,
    features,
    canWrite,
    canViewCompleteReport,
    canViewEmotionTrend,
    canUnlockTheme,
    hasPrioritySupport,
    hasReachedDailyLimit,
    hasReachedCollectionLimit,
  };
}
