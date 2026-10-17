/**
 * 会员到期提醒系统
 * 实现会员到期前的提醒通知功能
 */

import { MembershipTier } from './membership-config';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from './db';
import { membershipExpiryReminders, memberships } from '../drizzle/schema';

export const MEMBERSHIP_EXPIRY_REMINDER_SCHEDULE = {
  cron: '0 0 * * *',
  timezone: 'UTC',
  description: 'Daily membership expiry reminder check',
} as const;

export type ReminderRunner = () => Promise<{ total: number; sent: number; failed: number }>;

export interface ExpiryReminder {
  id: string;
  userId: string;
  tier: MembershipTier;
  expiryDate: Date;
  reminderDays: number; // 提前多少天提醒
  sent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

export interface ReminderNotification {
  id: string;
  userId: string;
  type: 'expiry_7days' | 'expiry_3days' | 'expiry_today';
  title: string;
  content: string;
  tier: MembershipTier;
  expiryDate: Date;
  createdAt: Date;
  read: boolean;
}

/**
 * 检查会员是否需要发送到期提醒
 */
export function shouldSendExpiryReminder(expiryDate: Date, reminderDays: number): boolean {
  const now = new Date();
  // The caller can create the target date immediately before this function
  // runs. Using floor would turn an exact N-day interval into N-1 days as
  // soon as a few milliseconds elapse.
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry === reminderDays;
}

/**
 * 获取会员到期前的天数
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntilExpiry);
}

/**
 * 生成到期提醒通知
 */
export function generateExpiryReminderNotification(
  userId: string,
  tier: MembershipTier,
  expiryDate: Date,
  reminderDays: number
): ReminderNotification {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  
  let type: 'expiry_7days' | 'expiry_3days' | 'expiry_today';
  let title: string;
  let content: string;

  if (daysUntilExpiry === 7) {
    type = 'expiry_7days';
    title = '会员即将到期';
    content = `您的${getTierName(tier)}将在7天后到期，请及时续费以继续享受会员权益。`;
  } else if (daysUntilExpiry === 3) {
    type = 'expiry_3days';
    title = '会员即将到期';
    content = `您的${getTierName(tier)}将在3天后到期，请及时续费以继续享受会员权益。`;
  } else {
    type = 'expiry_today';
    title = '会员即将到期';
    content = `您的${getTierName(tier)}将在今天到期，请立即续费以继续享受会员权益。`;
  }

  return {
    id: `reminder-${userId}-${Date.now()}`,
    userId,
    type,
    title,
    content,
    tier,
    expiryDate,
    createdAt: new Date(),
    read: false,
  };
}

/**
 * 获取会员等级名称
 */
function getTierName(tier: MembershipTier): string {
  const names: Record<MembershipTier, string> = {
    free: '免费账户',
    standard: '标准会员',
    premium: '高级会员',
  };
  return names[tier];
}

/**
 * 获取续费链接
 */
export function getRenewalLink(tier: MembershipTier): string {
  const baseUrl = process.env.VITE_APP_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://www.shenye.xin';
  return `${baseUrl}/membership?tier=${tier}&action=renew`;
}

/**
 * 生成续费提醒邮件内容
 */
export function generateExpiryReminderEmail(
  userName: string,
  tier: MembershipTier,
  expiryDate: Date,
  daysUntilExpiry: number
): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const tierName = getTierName(tier);
  const renewalLink = getRenewalLink(tier);

  const subject = `【深夜信箱】${tierName}即将到期提醒`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0B0F2F;">亲爱的 ${userName}，</h2>
      
      <p style="color: #333; line-height: 1.6;">
        感谢您一直以来对深夜信箱的支持。我们想提醒您，您的<strong>${tierName}</strong>将在 <strong>${daysUntilExpiry} 天</strong>后到期。
      </p>

      <p style="color: #333; line-height: 1.6;">
        到期日期：<strong>${expiryDate.toLocaleDateString('zh-CN')}</strong>
      </p>

      <p style="color: #333; line-height: 1.6;">
        为了不中断您的服务，请及时续费。续费后，您将继续享受以下权益：
      </p>

      <ul style="color: #333; line-height: 1.8;">
        ${tier === 'standard' ? `
          <li>每天5封温暖的AI回信</li>
          <li>全部信纸主题和特殊效果</li>
          <li>周报和月报深度分析</li>
          <li>优先投递服务</li>
          <li>收藏功能（最多100个）</li>
        ` : ''}
        ${tier === 'premium' ? `
          <li>无限数量的AI回信</li>
          <li>专属高级信纸主题</li>
          <li>AI深度心理学分析报告</li>
          <li>主题信箱创建和管理</li>
          <li>端到端加密存储</li>
          <li>24小时优先客服支持</li>
          <li>无限收藏功能</li>
        ` : ''}
      </ul>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${renewalLink}" style="
          display: inline-block;
          padding: 12px 30px;
          background-color: #FFD580;
          color: #0B0F2F;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
        ">
          立即续费
        </a>
      </p>

      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
        如有任何问题，请联系我们的客服团队。
      </p>
    </div>
  `;

  const textContent = `
亲爱的 ${userName}，

感谢您一直以来对深夜信箱的支持。我们想提醒您，您的${tierName}将在 ${daysUntilExpiry} 天后到期。

到期日期：${expiryDate.toLocaleDateString('zh-CN')}

为了不中断您的服务，请及时续费。续费链接：${renewalLink}

如有任何问题，请联系我们的客服团队。
  `;

  return { subject, htmlContent, textContent };
}

/**
 * 定时任务：检查并发送到期提醒
 * 应该由后端定时任务（如 cron job）定期调用
 */
export async function checkAndSendExpiryReminders(): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) return { total: 0, sent: 0, failed: 0 };

  const activeMemberships = await db
    .select()
    .from(memberships)
    .where(eq(memberships.membershipType, 'yearly'));
  const candidates = activeMemberships.filter((membership) => membership.membershipExpiry);
  let sent = 0;
  let failed = 0;

  for (const membership of candidates) {
    const daysUntilExpiry = getDaysUntilExpiry(membership.membershipExpiry!);
    const reminderType = daysUntilExpiry === 7
      ? 'expiry_7days'
      : daysUntilExpiry === 3
        ? 'expiry_3days'
        : daysUntilExpiry === 0
          ? 'expiry_today'
          : null;
    if (!reminderType) continue;

    try {
      const [existing] = await db
        .select({ id: membershipExpiryReminders.id })
        .from(membershipExpiryReminders)
        .where(and(
          eq(membershipExpiryReminders.membershipId, membership.id),
          eq(membershipExpiryReminders.reminderType, reminderType),
          eq(membershipExpiryReminders.expiryDate, membership.membershipExpiry!),
        ))
        .limit(1);
      if (existing) continue;

      await db.insert(membershipExpiryReminders).values({
        userId: membership.userId,
        membershipId: membership.id,
        reminderType,
        expiryDate: membership.membershipExpiry!,
        sentAt: new Date(),
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error('[MembershipExpiryReminder] failed for membership', membership.id, error);
    }
  }

  return { total: candidates.length, sent, failed };
}

/** Entry point used by the platform heartbeat/cron task. */
export async function runScheduledExpiryReminder(
  runner: ReminderRunner = checkAndSendExpiryReminders,
): Promise<{ total: number; sent: number; failed: number }> {
  try {
    return await runner();
  } catch (error) {
    console.error('[MembershipExpiryReminder] scheduled run failed', error);
    return { total: 0, sent: 0, failed: 1 };
  }
}
