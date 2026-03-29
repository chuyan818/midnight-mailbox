/**
 * 测试模式支付处理
 * 用于开发和测试，模拟Stripe支付流程
 */

import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { subscriptionRecords, memberships } from '../drizzle/schema';

export interface TestCheckoutSession {
  sessionId: string;
  url: string;
  isTestMode: true;
}

export interface TestPaymentResult {
  success: boolean;
  message: string;
  sessionId?: string;
}

/**
 * 创建测试Checkout Session
 */
export async function createTestCheckoutSession(
  userId: number,
  planType: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
): Promise<TestCheckoutSession> {
  // 生成模拟的session ID
  const sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 构建测试支付URL（包含成功回调参数）
  const testUrl = `${successUrl}?session_id=${sessionId}&test_mode=true&plan=${planType}`;
  
  return {
    sessionId,
    url: testUrl,
    isTestMode: true,
  };
}

/**
 * 处理测试支付成功
 */
export async function handleTestPaymentSuccess(
  userId: number,
  planType: 'monthly' | 'yearly',
  sessionId: string
): Promise<TestPaymentResult> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // 计算会员过期时间
    const now = new Date();
    let expiryDate = new Date(now);
    
    if (planType === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // 更新或创建会员记录
    const existingMembership = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);

    const membershipTypeValue = planType === 'monthly' ? 'monthly' : 'yearly';

    if (existingMembership.length > 0) {
      // 更新现有会员
      await db
        .update(memberships)
        .set({
          membershipType: membershipTypeValue as any,
          membershipExpiry: expiryDate,
          stripeCustomerId: `test_customer_${userId}`,
          stripeSubscriptionId: `test_subscription_${sessionId}`,
          updatedAt: new Date(),
        })
        .where(eq(memberships.userId, userId));
    } else {
      // 创建新会员
      await db.insert(memberships).values({
        userId,
        membershipType: membershipTypeValue as any,
        membershipExpiry: expiryDate,
        stripeCustomerId: `test_customer_${userId}`,
        stripeSubscriptionId: `test_subscription_${sessionId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }

    // 记录订阅记录
    const amount = planType === 'monthly' ? '29.00' : '288.00';
    await db.insert(subscriptionRecords).values({
      userId,
      membershipType: membershipTypeValue,
      amount: amount as any,
      currency: 'CNY',
      status: 'completed',
      stripePaymentIntentId: `test_payment_${sessionId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    return {
      success: true,
      message: `成功升级为${planType === 'monthly' ? '月' : '年'}会员（测试模式）`,
      sessionId,
    };
  } catch (error: any) {
    console.error('[Test Payment] Error handling payment success:', error);
    return {
      success: false,
      message: error.message || '处理支付失败',
    };
  }
}

/**
 * 处理测试支付取消
 */
export async function handleTestPaymentCancel(
  sessionId: string
): Promise<TestPaymentResult> {
  return {
    success: true,
    message: '支付已取消（测试模式）',
    sessionId,
  };
}

/**
 * 模拟支付流程（用于测试）
 */
export async function simulateTestPayment(
  userId: number,
  planType: 'monthly' | 'yearly'
): Promise<TestPaymentResult> {
  // 模拟支付延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 模拟支付成功（90%概率）
  if (Math.random() > 0.1) {
    return handleTestPaymentSuccess(userId, planType, `test_session_${Date.now()}`);
  } else {
    return {
      success: false,
      message: '模拟支付失败（测试模式）',
    };
  }
}
