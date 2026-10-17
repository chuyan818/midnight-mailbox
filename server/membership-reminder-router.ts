import { protectedProcedure, router } from './_core/trpc';
import { z } from 'zod';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from './db';
import { membershipExpiryReminders, memberships } from '../drizzle/schema';
import { generateExpiryReminderNotification, getDaysUntilExpiry } from './membership-expiry-reminder';
import { MembershipTier } from './membership-config';

export const membershipReminderRouter = router({
  getExpiryInfo: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasReminder: false, daysUntilExpiry: null, reminderType: null };

    const [membership] = await db.select().from(memberships).where(eq(memberships.userId, ctx.user.id)).limit(1);
    if (!membership?.membershipExpiry || membership.membershipType === 'free') {
      return { hasReminder: false, daysUntilExpiry: null, reminderType: null };
    }

    const daysUntilExpiry = getDaysUntilExpiry(membership.membershipExpiry);
    const reminderType = daysUntilExpiry <= 0 ? 'expired' : daysUntilExpiry <= 3 ? 'expiry_3days' : daysUntilExpiry <= 7 ? 'expiry_7days' : null;
    return {
      hasReminder: Boolean(reminderType),
      daysUntilExpiry,
      reminderType,
      message: reminderType ? `您的会员将在 ${daysUntilExpiry <= 0 ? '今天' : `${daysUntilExpiry} 天后`}到期，请及时续费` : undefined,
    };
  }),

  sendReminderNotification: protectedProcedure
    .input(z.object({ tier: z.enum(['free', 'standard', 'premium']), expiryDate: z.string().datetime(), reminderDays: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const expiryDate = new Date(input.expiryDate);
      const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
      if (daysUntilExpiry !== input.reminderDays) return { success: false, message: `当前还有 ${daysUntilExpiry} 天到期，不符合提醒条件` };
      return {
        success: true,
        message: '提醒通知已生成',
        notification: generateExpiryReminderNotification(ctx.user.id.toString(), input.tier as MembershipTier, expiryDate, input.reminderDays),
      };
    }),

  markReminderAsRead: protectedProcedure
    .input(z.object({ reminderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, message: 'Database not available' };
      await db.update(membershipExpiryReminders).set({ readAt: new Date() }).where(and(eq(membershipExpiryReminders.id, input.reminderId), eq(membershipExpiryReminders.userId, ctx.user.id)));
      return { success: true, message: '提醒已标记为已读' };
    }),

  getPendingReminders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { reminders: [], total: 0 };
    const reminders = await db.select().from(membershipExpiryReminders).where(and(eq(membershipExpiryReminders.userId, ctx.user.id), isNull(membershipExpiryReminders.readAt))).orderBy(desc(membershipExpiryReminders.createdAt));
    return { reminders, total: reminders.length };
  }),

  getRenewalLink: protectedProcedure
    .input(z.object({ tier: z.enum(['free', 'standard', 'premium']) }))
    .query(({ input }) => ({
      renewalLink: `${process.env.VITE_APP_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://www.shenye.xin'}/membership?tier=${input.tier}&action=renew`,
      message: '点击链接续费您的会员',
    })),
});
