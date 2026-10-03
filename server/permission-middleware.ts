/**
 * 权限检查中间件
 * 用于在tRPC过程中检查用户的会员权限
 */

import { TRPCError } from '@trpc/server';
import { TrpcContext } from './_core/context';
import { getUserMembership } from './db';

/**
 * 会员权限配置
 */
export const membershipPermissions = {
  free: {
    maxLettersPerDay: 1,
    maxCollections: 10,
    canAccessThematicMailbox: false,
    canAccessPremiumSupport: false,
    canAccessAIAnalysis: false,
    writeLetterCooldown: 300000, // 5 minutes
  },
  monthly: {
    maxLettersPerDay: 5,
    maxCollections: 100,
    canAccessThematicMailbox: true,
    canAccessPremiumSupport: false,
    canAccessAIAnalysis: false,
    writeLetterCooldown: 0,
  },
  yearly: {
    maxLettersPerDay: Infinity,
    maxCollections: Infinity,
    canAccessThematicMailbox: true,
    canAccessPremiumSupport: true,
    canAccessAIAnalysis: true,
    writeLetterCooldown: 0,
  },
};

/**
 * 检查用户是否有权限执行某个操作
 */
export async function checkPermission(
  ctx: TrpcContext,
  action: 'send_letter' | 'collect_letter' | 'access_thematic_mailbox' | 'access_premium_support' | 'access_ai_analysis',
  options?: {
    letterId?: number;
    collectionCount?: number;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  // 检查用户是否已认证
  if (!ctx.user) {
    return {
      allowed: false,
      reason: '请先登录',
    };
  }

  // 始终从数据库读取会员状态，不能相信客户端传入的等级或本地状态。
  const membership = await getUserMembership(ctx.user.id);
  const membershipType = membership?.membershipExpiry && new Date(membership.membershipExpiry) <= new Date()
    ? 'free'
    : (membership?.membershipType || 'free');
  const permissions = membershipPermissions[membershipType as keyof typeof membershipPermissions];

  if (!permissions) {
    return {
      allowed: false,
      reason: '无效的会员类型',
    };
  }

  // 根据操作类型检查权限
  switch (action) {
    case 'send_letter': {
      // 检查每日发送限制
      if (permissions.maxLettersPerDay === Infinity) {
        return { allowed: true };
      }

      // 这里应该查询数据库获取用户今天已发送的信件数
      // 为了演示，我们假设已发送的数量
      const sentToday = 0; // 应该从数据库查询

      if (sentToday >= permissions.maxLettersPerDay) {
        return {
          allowed: false,
          reason: `您已达到今日发送限制（${permissions.maxLettersPerDay}封/天），请明天再试`,
        };
      }

      // 检查冷却时间
      if (permissions.writeLetterCooldown > 0) {
        // 这里应该检查用户最后一次发送信件的时间
        // 为了演示，我们假设没有冷却时间限制
        return { allowed: true };
      }

      return { allowed: true };
    }

    case 'collect_letter': {
      // 检查收藏限制
      if (permissions.maxCollections === Infinity) {
        return { allowed: true };
      }

      const collectionCount = options?.collectionCount || 0;
      if (collectionCount >= permissions.maxCollections) {
        return {
          allowed: false,
          reason: `您已达到收藏限制（${permissions.maxCollections}个），请升级会员或删除一些收藏`,
        };
      }

      return { allowed: true };
    }

    case 'access_thematic_mailbox': {
      if (!permissions.canAccessThematicMailbox) {
        return {
          allowed: false,
          reason: '此功能仅限标准会员及以上使用，请升级会员',
        };
      }
      return { allowed: true };
    }

    case 'access_premium_support': {
      if (!permissions.canAccessPremiumSupport) {
        return {
          allowed: false,
          reason: '优先客服支持仅限年会员使用，请升级到年会员',
        };
      }
      return { allowed: true };
    }

    case 'access_ai_analysis': {
      if (!permissions.canAccessAIAnalysis) {
        return {
          allowed: false,
          reason: 'AI深度分析仅限年会员使用，请升级到年会员',
        };
      }
      return { allowed: true };
    }

    default:
      return { allowed: true };
  }
}

/**
 * 权限检查中间件 - 用于tRPC过程
 */
export function createPermissionMiddleware(
  action: 'send_letter' | 'collect_letter' | 'access_thematic_mailbox' | 'access_premium_support' | 'access_ai_analysis'
) {
  return async (opts: any) => {
    const { ctx, next } = opts;

    const permission = await checkPermission(ctx, action);

    if (!permission.allowed) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: permission.reason || '权限不足',
      });
    }

    return next({ ctx });
  };
}

/**
 * 获取用户的权限信息
 */
export function getUserPermissions(membershipType: string) {
  return membershipPermissions[membershipType as keyof typeof membershipPermissions] || membershipPermissions.free;
}

/**
 * 获取用户的权限摘要
 */
export function getPermissionSummary(membershipType: string) {
  const permissions = getUserPermissions(membershipType);

  return {
    maxLettersPerDay: permissions.maxLettersPerDay === Infinity ? '无限' : permissions.maxLettersPerDay,
    maxCollections: permissions.maxCollections === Infinity ? '无限' : permissions.maxCollections,
    canAccessThematicMailbox: permissions.canAccessThematicMailbox,
    canAccessPremiumSupport: permissions.canAccessPremiumSupport,
    canAccessAIAnalysis: permissions.canAccessAIAnalysis,
    writeLetterCooldown: permissions.writeLetterCooldown === 0 ? '无' : `${permissions.writeLetterCooldown}毫秒`,
  };
}
