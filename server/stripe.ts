/**
 * Stripe支付系统集成 - 修复版本
 * 正确分离 stripeCustomerId、stripeSubscriptionId、stripePaymentIntentId
 */

import Stripe from 'stripe';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { subscriptionRecords, memberships } from '../drizzle/schema';

// 初始化Stripe客户端
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Stripe产品ID配置
// 注意：需要在Stripe Dashboard中创建产品和价格，然后设置环境变量
export const STRIPE_PRODUCTS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1QYGZpLBm06stkfk1234abcd',
    name: 'Midnight Mailbox Monthly',
    amount: 2900, // ¥29.00
    currency: 'cny',
    interval: 'month',
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_1QYGZpLBm06stkfk5678efgh',
    name: 'Midnight Mailbox Yearly',
    amount: 28800, // ¥288.00
    currency: 'cny',
    interval: 'year',
  },
};

/**
 * 创建Checkout Session
 */
export async function createCheckoutSession(
  userId: number,
  planType: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // 获取用户信息
    const { users } = await import('../drizzle/schema');
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userResult.length === 0) throw new Error('User not found');

    const user = userResult[0];
    const plan = STRIPE_PRODUCTS[planType];

    // 查找或创建Stripe客户
    let customerId: string;
    const existingRecord = await db
      .select()
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.userId, userId))
      .limit(1);

    if (existingRecord.length > 0 && existingRecord[0].stripeCustomerId) {
      customerId = existingRecord[0].stripeCustomerId;
    } else {
      // 创建新的Stripe客户
      const customer = await stripe.customers.create({
        email: user.email || `user-${userId}@midnightmailbox.local`,
        name: user.name || `User ${userId}`,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;

      // 保存到数据库
      if (existingRecord.length === 0) {
        await db.insert(subscriptionRecords).values({
          userId,
          membershipType: planType,
          amount: (plan.amount / 100).toString(),
          currency: plan.currency,
          stripeCustomerId: customerId,
          status: 'pending',
        });
      } else {
        // 更新现有记录
        await db
          .update(subscriptionRecords)
          .set({ stripeCustomerId: customerId })
          .where(eq(subscriptionRecords.userId, userId));
      }
    }

    // 创建Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        planType,
      },
    });

    if (!session.url) throw new Error('Failed to create checkout session');

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

/**
 * 处理Checkout Session完成事件
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const userId = parseInt(session.metadata?.userId || '0');
    if (!userId) throw new Error('Invalid userId in session metadata');

    const planType = session.metadata?.planType as 'monthly' | 'yearly';
    if (!planType) throw new Error('Invalid planType in session metadata');

    // 获取订阅信息
    if (!session.subscription) throw new Error('No subscription in session');

    const subscription = (await stripe.subscriptions.retrieve(
      session.subscription as string
    )) as any;

    // 计算会员过期时间
    const expiryDate = new Date(subscription.current_period_end * 1000);

    // 更新订阅记录
    const existingRecord = await db
      .select()
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.userId, userId))
      .limit(1);

    if (existingRecord.length > 0) {
      await db
        .update(subscriptionRecords)
        .set({
          membershipType: planType,
          stripeSubscriptionId: subscription.id,
          stripePaymentIntentId: session.payment_intent as string,
          status: 'active',
          amount: (subscription.items.data[0]?.price.unit_amount || 0 / 100).toString(),
        })
        .where(eq(subscriptionRecords.userId, userId));
    } else {
      await db.insert(subscriptionRecords).values({
        userId,
        membershipType: planType,
        stripeSubscriptionId: subscription.id,
        stripePaymentIntentId: session.payment_intent as string,
        amount: (subscription.items.data[0]?.price.unit_amount || 0 / 100).toString(),
        currency: subscription.currency || 'cny',
        status: 'active',
      });
    }

    // 更新会员信息
    const { memberships: membershipTable } = await import('../drizzle/schema');
    const existingMembership = await db
      .select()
      .from(membershipTable)
      .where(eq(membershipTable.userId, userId))
      .limit(1);

    if (existingMembership.length > 0) {
      await db
        .update(membershipTable)
        .set({
          membershipType: planType,
          membershipExpiry: expiryDate,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
        })
        .where(eq(membershipTable.userId, userId));
    } else {
      await db.insert(membershipTable).values({
        userId,
        membershipType: planType,
        membershipExpiry: expiryDate,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
      });
    }

    console.log(`✅ Checkout completed for user ${userId}: ${planType} plan`);
  } catch (error) {
    console.error('Failed to handle checkout session completed:', error);
    throw error;
  }
}

/**
 * 处理订阅更新事件
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // 查找订阅记录
    const record = await db
      .select()
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.stripeSubscriptionId, subscription.id))
      .limit(1);

    if (record.length === 0) {
      console.warn(`Subscription not found: ${subscription.id}`);
      return;
    }

    // 更新订阅状态
    await db
      .update(subscriptionRecords)
      .set({
        status: subscription.status,
      })
      .where(eq(subscriptionRecords.stripeSubscriptionId, subscription.id));

    console.log(`✅ Subscription updated: ${subscription.id} - ${subscription.status}`);
  } catch (error) {
    console.error('Failed to handle subscription updated:', error);
    throw error;
  }
}

/**
 * 处理订阅取消事件
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // 查找订阅记录
    const record = await db
      .select()
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.stripeSubscriptionId, subscription.id))
      .limit(1);

    if (record.length === 0) {
      console.warn(`Subscription not found: ${subscription.id}`);
      return;
    }

    const userId = record[0].userId;

    // 更新订阅状态
    await db
      .update(subscriptionRecords)
      .set({
        status: 'canceled',
      })
      .where(eq(subscriptionRecords.stripeSubscriptionId, subscription.id));

    // 降级用户为免费版
    const { memberships: membershipTable } = await import('../drizzle/schema');
    await db
      .update(membershipTable)
      .set({
        membershipType: 'free',
        membershipExpiry: null,
      })
      .where(eq(membershipTable.userId, userId));

    console.log(`✅ Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error('Failed to handle subscription deleted:', error);
    throw error;
  }
}

/**
 * 验证Webhook签名
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

/**
 * 处理Webhook事件
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object);
        break;

      case 'invoice.payment_failed':
        console.log('Invoice payment failed:', event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Failed to handle webhook event:', error);
    throw error;
  }
}

/**
 * 取消订阅
 */
export async function cancelSubscription(userId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // 查找活跃订阅
    const record = await db
      .select()
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.userId, userId))
      .limit(1);

    if (record.length === 0 || !record[0].stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // 取消Stripe订阅
    await stripe.subscriptions.cancel(record[0].stripeSubscriptionId);

    console.log(`✅ Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
}

/**
 * 获取订阅信息
 */
export async function getSubscriptionInfo(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const record = await db
      .select()
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.userId, userId))
      .limit(1);

    if (record.length === 0) {
      return null;
    }

    return {
      subscriptionId: record[0].stripeSubscriptionId,
      status: record[0].status,
      membershipType: record[0].membershipType,
      amount: record[0].amount,
      currency: record[0].currency,
    };
  } catch (error) {
    console.error('Failed to get subscription info:', error);
    throw error;
  }
}
