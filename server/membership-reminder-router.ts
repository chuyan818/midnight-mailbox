/**
 * 会员到期提醒路由
 * 处理会员到期前的提醒通知
 */

import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { generateExpiryReminderNotification, getDaysUntilExpiry } from './membership-expiry-reminder';
import { MembershipTier } from './membership-config';

/**
 * 会员到期提醒路由
 */
export const membershipReminderRouter = router({
  /**
   * 获取会员到期提醒信息
   */
  getExpiryInfo: protectedProcedure.query(async ({ ctx }) => {
    // 这里应该从数据库查询用户的会员信息
    // 示例实现：
    const userId = ctx.user.id;
    
    // 模拟数据库查询
    const membershipData = {
      tier: 'premium' as MembershipTier,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后到期
    };

    if (!membershipData || membershipData.tier === 'free') {
      return {
        hasReminder: false,
        daysUntilExpiry: null,
        reminderType: null,
      };
    }

    const daysUntilExpiry = getDaysUntilExpiry(membershipData.expiryDate);

    if (daysUntilExpiry <= 0) {
      return {
        hasReminder: true,
        daysUntilExpiry: 0,
        reminderType: 'expired',
        message: '您的会员已到期，请续费以继续享受会员权益',
      };
    }

    if (daysUntilExpiry <= 3) {
      return {
        hasReminder: true,
        daysUntilExpiry,
        reminderType: 'expiry_3days',
        message: `您的会员将在 ${daysUntilExpiry} 天后到期，请及时续费`,
      };
    }

    if (daysUntilExpiry <= 7) {
      return {
        hasReminder: true,
        daysUntilExpiry,
        reminderType: 'expiry_7days',
        message: `您的会员将在 ${daysUntilExpiry} 天后到期，请及时续费`,
      };
    }

    return {
      hasReminder: false,
      daysUntilExpiry,
      reminderType: null,
    };
  }),

  /**
   * 发送会员到期提醒通知
   */
  sendReminderNotification: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['free', 'standard', 'premium']),
        expiryDate: z.string().datetime(),
        reminderDays: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const expiryDate = new Date(input.expiryDate);

      // 检查是否需要发送提醒
      const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

      if (daysUntilExpiry !== input.reminderDays) {
        return {
          success: false,
          message: `当前还有 ${daysUntilExpiry} 天到期，不符合提醒条件`,
        };
      }

      // 生成提醒通知
      const notification = generateExpiryReminderNotification(
        userId.toString(),
        input.tier,
        expiryDate,
        input.reminderDays
      );

      // 这里应该保存通知到数据库并发送
      // 实际实现应该：
      // 1. 保存通知到数据库
      // 2. 发送站内信
      // 3. 发送邮件通知
      // 4. 记录发送状态

      return {
        success: true,
        message: '提醒通知已发送',
        notification,
      };
    }),

  /**
   * 标记提醒为已读
   */
  markReminderAsRead: protectedProcedure
    .input(
      z.object({
        reminderId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // 这里应该更新数据库中的提醒状态
      // 实际实现应该从数据库查询并更新

      return {
        success: true,
        message: '提醒已标记为已读',
      };
    }),

  /**
   * 获取所有待处理的提醒
   */
  getPendingReminders: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // 这里应该从数据库查询用户的所有待处理提醒
    // 实际实现应该：
    // 1. 查询所有未读的会员到期提醒
    // 2. 按时间排序
    // 3. 返回给前端

    return {
      reminders: [],
      total: 0,
    };
  }),

  /**
   * 获取会员续费链接
   */
  getRenewalLink: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['free', 'standard', 'premium']),
      })
    )
    .query(({ input }) => {
      const baseUrl = process.env.VITE_APP_URL || 'https://midnight-mailbox.com';
      const renewalLink = `${baseUrl}/membership?tier=${input.tier}&action=renew`;

      return {
        renewalLink,
        message: '点击链接续费您的会员',
      };
    }),
});
