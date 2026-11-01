/**
 * 会员功能测试
 * 测试会员徽章、到期提醒和优先客服支持功能
 */

import { describe, it, expect, vi } from 'vitest';
import { MEMBERSHIP_BADGES, getMembershipBadge, getMembershipBenefits } from './badge-config';
import { MembershipTier } from './membership-config';
import {
  generateExpiryReminderNotification,
  getDaysUntilExpiry,
  shouldSendExpiryReminder,
} from './membership-expiry-reminder';

describe('Membership Badges', () => {
  it('should have badge config for all tiers', () => {
    const tiers: MembershipTier[] = ['free', 'standard', 'premium'];
    tiers.forEach((tier) => {
      expect(MEMBERSHIP_BADGES[tier]).toBeDefined();
      expect(MEMBERSHIP_BADGES[tier].name).toBeDefined();
      expect(MEMBERSHIP_BADGES[tier].icon).toBeDefined();
      expect(MEMBERSHIP_BADGES[tier].color).toBeDefined();
    });
  });

  it('should get correct badge for free tier', () => {
    const badge = getMembershipBadge('free');
    expect(badge.tier).toBe('free');
    expect(badge.name).toBe('普通用户');
    expect(badge.icon).toBe('👤');
  });

  it('should get correct badge for standard tier', () => {
    const badge = getMembershipBadge('standard');
    expect(badge.tier).toBe('standard');
    expect(badge.name).toBe('标准会员');
    expect(badge.icon).toBe('⭐');
  });

  it('should get correct badge for premium tier', () => {
    const badge = getMembershipBadge('premium');
    expect(badge.tier).toBe('premium');
    expect(badge.name).toBe('高级会员');
    expect(badge.icon).toBe('👑');
  });

  it('should have benefits for each tier', () => {
    const tiers: MembershipTier[] = ['free', 'standard', 'premium'];
    tiers.forEach((tier) => {
      const benefits = getMembershipBenefits(tier);
      expect(Array.isArray(benefits)).toBe(true);
      expect(benefits.length).toBeGreaterThan(0);
    });
  });

  it('should have more benefits for higher tiers', () => {
    const freeBenefits = getMembershipBenefits('free');
    const standardBenefits = getMembershipBenefits('standard');
    const premiumBenefits = getMembershipBenefits('premium');

    expect(freeBenefits.length).toBeLessThan(standardBenefits.length);
    expect(standardBenefits.length).toBeLessThan(premiumBenefits.length);
  });
});

describe('Membership Expiry Reminder', () => {
  it('should calculate days until expiry correctly', () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days later
    const daysUntilExpiry = getDaysUntilExpiry(futureDate);
    expect(daysUntilExpiry).toBe(5);
  });

  it('should return 0 for expired date', () => {
    const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    const daysUntilExpiry = getDaysUntilExpiry(pastDate);
    expect(daysUntilExpiry).toBe(0);
  });

  it('should detect when reminder should be sent for 7 days', () => {
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const shouldSend = shouldSendExpiryReminder(expiryDate, 7);
    expect(shouldSend).toBe(true);
  });

  it('should detect when reminder should be sent for 3 days', () => {
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const shouldSend = shouldSendExpiryReminder(expiryDate, 3);
    expect(shouldSend).toBe(true);
  });

  it('should generate correct expiry reminder notification', () => {
    const userId = 'user-123';
    const tier: MembershipTier = 'premium';
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

    const notification = generateExpiryReminderNotification(userId, tier, expiryDate, 7);

    expect(notification.userId).toBe(userId);
    expect(notification.tier).toBe(tier);
    expect(notification.type).toBe('expiry_7days');
    expect(notification.title).toBe('会员即将到期');
    expect(notification.content).toContain('高级会员');
    expect(notification.content).toContain('7天');
  });

  it('should generate 3-day expiry reminder notification', () => {
    const userId = 'user-123';
    const tier: MembershipTier = 'standard';
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

    const notification = generateExpiryReminderNotification(userId, tier, expiryDate, 3);

    expect(notification.type).toBe('expiry_3days');
    expect(notification.content).toContain('3天');
  });
});

describe('Premium Support Benefits', () => {
  it('should have priority support for premium tier', () => {
    const premiumBenefits = getMembershipBenefits('premium');
    const supportBenefit = premiumBenefits.find((b) => b.id === 'benefit-premium-6');
    expect(supportBenefit).toBeDefined();
    expect(supportBenefit?.title).toBe('优先客服');
    expect(supportBenefit?.category).toBe('support');
  });

  it('should not have priority support for free tier', () => {
    const freeBenefits = getMembershipBenefits('free');
    const supportBenefit = freeBenefits.find((b) => b.category === 'support');
    expect(supportBenefit).toBeUndefined();
  });

  it('should not have priority support for standard tier', () => {
    const standardBenefits = getMembershipBenefits('standard');
    const supportBenefit = standardBenefits.find((b) => b.category === 'support');
    expect(supportBenefit).toBeUndefined();
  });
});
