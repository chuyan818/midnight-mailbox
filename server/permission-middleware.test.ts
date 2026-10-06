/**
 * 权限检查中间件测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { membershipPermissions, getUserPermissions, getPermissionSummary } from './permission-middleware';

describe('权限检查中间件', () => {
  describe('会员权限配置', () => {
    it('免费会员权限配置正确', () => {
      const freePerms = membershipPermissions.free;
      
      expect(freePerms.maxLettersPerDay).toBe(1);
      expect(freePerms.maxCollections).toBe(10);
      expect(freePerms.canAccessThematicMailbox).toBe(false);
      expect(freePerms.canAccessPremiumSupport).toBe(false);
      expect(freePerms.canAccessAIAnalysis).toBe(false);
      expect(freePerms.writeLetterCooldown).toBe(300000);
    });

    it('月会员权限配置正确', () => {
      const monthlyPerms = membershipPermissions.monthly;
      
      expect(monthlyPerms.maxLettersPerDay).toBe(Infinity);
      expect(monthlyPerms.maxCollections).toBe(Infinity);
      expect(monthlyPerms.canAccessThematicMailbox).toBe(true);
      expect(monthlyPerms.canAccessPremiumSupport).toBe(true);
      expect(monthlyPerms.canAccessAIAnalysis).toBe(true);
      expect(monthlyPerms.writeLetterCooldown).toBe(0);
    });

    it('年会员权限配置正确', () => {
      const yearlyPerms = membershipPermissions.yearly;
      
      expect(yearlyPerms.maxLettersPerDay).toBe(Infinity);
      expect(yearlyPerms.maxCollections).toBe(Infinity);
      expect(yearlyPerms.canAccessThematicMailbox).toBe(true);
      expect(yearlyPerms.canAccessPremiumSupport).toBe(true);
      expect(yearlyPerms.canAccessAIAnalysis).toBe(true);
      expect(yearlyPerms.writeLetterCooldown).toBe(0);
    });
  });

  describe('获取用户权限', () => {
    it('应能获取免费会员权限', () => {
      const perms = getUserPermissions('free');
      
      expect(perms.maxLettersPerDay).toBe(1);
      expect(perms.maxCollections).toBe(10);
    });

    it('应能获取标准会员权限', () => {
      const perms = getUserPermissions('monthly');
      
      expect(perms.maxLettersPerDay).toBe(Infinity);
      expect(perms.maxCollections).toBe(Infinity);
    });

    it('应能获取年会员权限', () => {
      const perms = getUserPermissions('yearly');
      
      expect(perms.maxLettersPerDay).toBe(Infinity);
      expect(perms.maxCollections).toBe(Infinity);
    });

    it('无效的会员类型应返回免费权限', () => {
      const perms = getUserPermissions('invalid');
      
      expect(perms.maxLettersPerDay).toBe(1);
      expect(perms.maxCollections).toBe(10);
    });
  });

  describe('权限摘要', () => {
    it('免费会员摘要正确', () => {
      const summary = getPermissionSummary('free');
      
      expect(summary.maxLettersPerDay).toBe(1);
      expect(summary.maxCollections).toBe(10);
      expect(summary.canAccessThematicMailbox).toBe(false);
      expect(summary.canAccessPremiumSupport).toBe(false);
      expect(summary.writeLetterCooldown).toBe('300000毫秒');
    });

    it('月会员摘要正确', () => {
      const summary = getPermissionSummary('monthly');
      
      expect(summary.maxLettersPerDay).toBe('无限');
      expect(summary.maxCollections).toBe('无限');
      expect(summary.canAccessThematicMailbox).toBe(true);
      expect(summary.canAccessPremiumSupport).toBe(true);
      expect(summary.writeLetterCooldown).toBe('无');
    });

    it('年会员摘要正确', () => {
      const summary = getPermissionSummary('yearly');
      
      expect(summary.maxLettersPerDay).toBe('无限');
      expect(summary.maxCollections).toBe('无限');
      expect(summary.canAccessThematicMailbox).toBe(true);
      expect(summary.canAccessPremiumSupport).toBe(true);
      expect(summary.canAccessAIAnalysis).toBe(true);
      expect(summary.writeLetterCooldown).toBe('无');
    });
  });

  describe('权限比较', () => {
    it('免费会员权限应少于标准会员', () => {
      const freePerms = membershipPermissions.free;
      const monthlyPerms = membershipPermissions.monthly;
      
      expect(freePerms.maxLettersPerDay).toBeLessThan(monthlyPerms.maxLettersPerDay);
      expect(freePerms.maxCollections).toBeLessThan(monthlyPerms.maxCollections);
      expect(freePerms.canAccessThematicMailbox).toBe(false);
      expect(monthlyPerms.canAccessThematicMailbox).toBe(true);
    });

    it('月会员与年会员均为无限会员权限', () => {
      const monthlyPerms = membershipPermissions.monthly;
      const yearlyPerms = membershipPermissions.yearly;
      
      expect(monthlyPerms.maxLettersPerDay).toBe(Infinity);
      expect(monthlyPerms.maxCollections).toBe(Infinity);
      expect(monthlyPerms.canAccessPremiumSupport).toBe(true);
      expect(yearlyPerms.canAccessPremiumSupport).toBe(true);
    });

    it('年会员应有最高权限', () => {
      const yearlyPerms = membershipPermissions.yearly;
      
      expect(yearlyPerms.maxLettersPerDay).toBe(Infinity);
      expect(yearlyPerms.maxCollections).toBe(Infinity);
      expect(yearlyPerms.canAccessThematicMailbox).toBe(true);
      expect(yearlyPerms.canAccessPremiumSupport).toBe(true);
      expect(yearlyPerms.canAccessAIAnalysis).toBe(true);
      expect(yearlyPerms.writeLetterCooldown).toBe(0);
    });
  });

  describe('功能限制', () => {
    it('免费会员每天只能发送1封信', () => {
      const perms = membershipPermissions.free;
      
      expect(perms.maxLettersPerDay).toBe(1);
    });

    it('月会员可无限发送信', () => {
      const perms = membershipPermissions.monthly;
      
      expect(perms.maxLettersPerDay).toBe(Infinity);
    });

    it('年会员可无限发送信', () => {
      const perms = membershipPermissions.yearly;
      
      expect(perms.maxLettersPerDay).toBe(Infinity);
    });

    it('免费会员最多收藏10个', () => {
      const perms = membershipPermissions.free;
      
      expect(perms.maxCollections).toBe(10);
    });

    it('月会员可无限收藏', () => {
      const perms = membershipPermissions.monthly;
      
      expect(perms.maxCollections).toBe(Infinity);
    });

    it('年会员可无限收藏', () => {
      const perms = membershipPermissions.yearly;
      
      expect(perms.maxCollections).toBe(Infinity);
    });

    it('免费会员写信有冷却时间', () => {
      const perms = membershipPermissions.free;
      
      expect(perms.writeLetterCooldown).toBeGreaterThan(0);
    });

    it('标准和年会员写信无冷却时间', () => {
      const monthlyPerms = membershipPermissions.monthly;
      const yearlyPerms = membershipPermissions.yearly;
      
      expect(monthlyPerms.writeLetterCooldown).toBe(0);
      expect(yearlyPerms.writeLetterCooldown).toBe(0);
    });
  });

  describe('功能访问权限', () => {
    it('主题信箱仅限标准会员及以上', () => {
      const freePerms = membershipPermissions.free;
      const monthlyPerms = membershipPermissions.monthly;
      const yearlyPerms = membershipPermissions.yearly;
      
      expect(freePerms.canAccessThematicMailbox).toBe(false);
      expect(monthlyPerms.canAccessThematicMailbox).toBe(true);
      expect(yearlyPerms.canAccessThematicMailbox).toBe(true);
    });

    it('优先客服支持仅限年会员', () => {
      const freePerms = membershipPermissions.free;
      const monthlyPerms = membershipPermissions.monthly;
      const yearlyPerms = membershipPermissions.yearly;
      
      expect(freePerms.canAccessPremiumSupport).toBe(false);
      expect(monthlyPerms.canAccessPremiumSupport).toBe(true);
      expect(yearlyPerms.canAccessPremiumSupport).toBe(true);
    });

    it('AI深度分析仅限年会员', () => {
      const freePerms = membershipPermissions.free;
      const monthlyPerms = membershipPermissions.monthly;
      const yearlyPerms = membershipPermissions.yearly;
      
      expect(freePerms.canAccessAIAnalysis).toBe(false);
      expect(monthlyPerms.canAccessAIAnalysis).toBe(true);
      expect(yearlyPerms.canAccessAIAnalysis).toBe(true);
    });
  });
});
