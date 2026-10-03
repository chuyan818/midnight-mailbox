import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { memberships, subscriptionRecords } from "../drizzle/schema";
import { getDb } from "./db";

export type PayPalPaymentStatus = "none" | "pending" | "active" | "failed";

const PAYPAL_API_BASE = process.env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export const PAYPAL_PLAN_ID = process.env.PAYPAL_PLAN_ID || "P-72U41601JC0053143NLAFGMY";
const PAYPAL_PLAN_TYPE = process.env.PAYPAL_PLAN_TYPE === "monthly" ? "monthly" : "yearly";
const PAYPAL_PLAN_AMOUNT = process.env.PAYPAL_PLAN_AMOUNT || "0.00";
const PAYPAL_PLAN_CURRENCY = process.env.PAYPAL_PLAN_CURRENCY || "USD";

function requiredPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal server credentials are not configured");
  }
  return { clientId, clientSecret };
}

async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret } = requiredPayPalConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    throw new Error(`PayPal access token request failed: ${response.status}`);
  }
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal access token is missing");
  return data.access_token;
}

async function paypalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`PayPal API ${response.status}: ${detail.slice(0, 300)}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

interface PayPalSubscriptionDetails {
  id: string;
  status?: string;
  plan_id?: string;
  billing_info?: { next_billing_time?: string };
}

export async function registerPayPalSubscription(userId: number, subscriptionId: string) {
  const normalizedId = subscriptionId.trim();
  if (!/^I-[A-Z0-9]+$/i.test(normalizedId)) {
    throw new Error("Invalid PayPal subscription ID");
  }

  const subscription = await paypalRequest<PayPalSubscriptionDetails>(`/v1/billing/subscriptions/${encodeURIComponent(normalizedId)}`);
  if (subscription.id !== normalizedId || subscription.plan_id !== PAYPAL_PLAN_ID) {
    throw new Error("PayPal subscription does not match the configured plan");
  }
  if (subscription.status === "CANCELLED" || subscription.status === "EXPIRED" || subscription.status === "SUSPENDED") {
    throw new Error("PayPal subscription is not eligible for activation");
  }
  const paymentStatus: PayPalPaymentStatus = subscription.status === "ACTIVE" ? "active" : "pending";

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  const current = existing[0];
  await db.update(memberships).set({
    paypalSubscriptionId: normalizedId,
    paymentStatus,
    ...(paymentStatus === "active"
      ? {
          membershipType: PAYPAL_PLAN_TYPE as "monthly" | "yearly",
          membershipExpiry: getNextBillingDate({ resource: subscription }, current?.membershipExpiry),
        }
      : current?.membershipType === "free" || !current
        ? { membershipType: "free" as const, membershipExpiry: null }
        : {}),
    autoRenew: true,
    cancelledAt: null,
    updatedAt: new Date(),
  }).where(eq(memberships.userId, userId));

  if (existing.length === 0) {
    await db.insert(memberships).values({
      userId,
      membershipType: paymentStatus === "active" ? PAYPAL_PLAN_TYPE : "free",
      membershipExpiry: paymentStatus === "active" ? getNextBillingDate({ resource: subscription }) : null,
      paypalSubscriptionId: normalizedId,
      paymentStatus,
      autoRenew: true,
    });
  }

  const existingRecord = await db.select({ id: subscriptionRecords.id })
    .from(subscriptionRecords)
    .where(eq(subscriptionRecords.paypalSubscriptionId, normalizedId))
    .limit(1);
  if (existingRecord.length === 0) {
    await db.insert(subscriptionRecords).values({
      userId,
      membershipType: PAYPAL_PLAN_TYPE,
      amount: PAYPAL_PLAN_AMOUNT,
      currency: PAYPAL_PLAN_CURRENCY,
      provider: "paypal",
      paypalSubscriptionId: normalizedId,
      status: paymentStatus === "active" ? "completed" : "pending",
    });
  }

  return { subscriptionId: normalizedId, paymentStatus };
}

function getSubscriptionId(event: Record<string, any>): string | undefined {
  return event.resource?.billing_agreement_id || event.resource?.subscription_id || event.resource?.id;
}

function getNextBillingDate(event: Record<string, any>, currentExpiry?: Date | null) {
  const nextBillingTime = event.resource?.billing_info?.next_billing_time;
  if (nextBillingTime) return new Date(nextBillingTime);
  if (currentExpiry && currentExpiry.getTime() > Date.now()) return currentExpiry;
  const expiry = new Date();
  if (PAYPAL_PLAN_TYPE === "monthly") expiry.setMonth(expiry.getMonth() + 1);
  else expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

async function updateMembershipFromPayPalEvent(event: Record<string, any>) {
  const subscriptionId = getSubscriptionId(event);
  if (!subscriptionId) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(memberships).where(eq(memberships.paypalSubscriptionId, subscriptionId)).limit(1);
  const membership = rows[0];
  if (!membership) {
    console.warn(`[PayPal] No pending membership found for ${subscriptionId}`);
    return;
  }

  const eventType = String(event.event_type || "");
  const isActive = eventType === "BILLING.SUBSCRIPTION.ACTIVATED" || eventType === "PAYMENT.SALE.COMPLETED";
  const isFailed = eventType === "BILLING.SUBSCRIPTION.CANCELLED"
    || eventType === "BILLING.SUBSCRIPTION.EXPIRED"
    || eventType === "BILLING.SUBSCRIPTION.SUSPENDED"
    || eventType === "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
    || eventType === "PAYMENT.SALE.DENIED"
    || eventType === "PAYMENT.SALE.REFUNDED"
    || eventType === "PAYMENT.SALE.REVERSED";
  const isCancelled = eventType === "BILLING.SUBSCRIPTION.CANCELLED";
  const transactionId = event.resource?.id && event.resource.id !== subscriptionId ? String(event.resource.id) : undefined;
  if (transactionId && (isActive || isFailed)) {
    const transactionExists = await db.select({ id: subscriptionRecords.id })
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.paypalTransactionId, transactionId))
      .limit(1);
    if (transactionExists.length === 0) {
      await db.insert(subscriptionRecords).values({
        userId: membership.userId,
        membershipType: PAYPAL_PLAN_TYPE,
        amount: String(event.resource?.amount?.total || event.resource?.amount?.value || PAYPAL_PLAN_AMOUNT),
        currency: String(event.resource?.amount?.currency || event.resource?.amount?.currency_code || PAYPAL_PLAN_CURRENCY).slice(0, 3),
        provider: "paypal",
        paypalSubscriptionId: subscriptionId,
        paypalTransactionId: transactionId,
        status: isActive ? "completed" : "failed",
      });
    }
  }

  if (isActive) {
    await db.update(memberships).set({
      membershipType: PAYPAL_PLAN_TYPE,
      membershipExpiry: getNextBillingDate(event, membership.membershipExpiry),
      paymentStatus: "active",
      autoRenew: true,
      cancelledAt: null,
      updatedAt: new Date(),
    }).where(eq(memberships.id, membership.id));
  } else if (isCancelled) {
    await db.update(memberships).set({
      paymentStatus: membership.membershipType === "free" ? "failed" : "active",
      autoRenew: false,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(memberships.id, membership.id));
  } else if (isFailed) {
    await db.update(memberships).set({
      membershipType: "free",
      membershipExpiry: null,
      paymentStatus: "failed",
      autoRenew: false,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(memberships.id, membership.id));
  }

  const historyStatus = isActive
    ? "completed"
    : eventType.includes("CANCELLED")
      ? "cancelled"
      : eventType.includes("EXPIRED")
        ? "expired"
        : "failed";
  if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
    await db.update(subscriptionRecords).set({ status: "completed", updatedAt: new Date() })
      .where(and(eq(subscriptionRecords.paypalSubscriptionId, subscriptionId), eq(subscriptionRecords.status, "pending")));
  } else if (eventType.includes("CANCELLED") || eventType.includes("EXPIRED")) {
    const eventId = event.id ? String(event.id) : undefined;
    if (eventId) {
      const cancellationExists = await db.select({ id: subscriptionRecords.id })
        .from(subscriptionRecords)
        .where(and(
          eq(subscriptionRecords.paypalSubscriptionId, subscriptionId),
          eq(subscriptionRecords.status, historyStatus),
        ))
        .limit(1);
      if (cancellationExists.length === 0) {
        await db.insert(subscriptionRecords).values({
          userId: membership.userId,
          membershipType: PAYPAL_PLAN_TYPE,
          amount: PAYPAL_PLAN_AMOUNT,
          currency: PAYPAL_PLAN_CURRENCY,
          provider: "paypal",
          paypalSubscriptionId: subscriptionId,
          paypalTransactionId: eventId,
          status: historyStatus,
        });
      }
    }
  }
}

export async function cancelPayPalSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  const membership = rows[0];
  if (!membership?.paypalSubscriptionId) throw new Error("No PayPal subscription found");

  await paypalRequest<void>(`/v1/billing/subscriptions/${encodeURIComponent(membership.paypalSubscriptionId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: "Cancelled by customer from Midnight Mailbox" }),
  });
  await db.update(memberships).set({
    autoRenew: false,
    cancelledAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(memberships.id, membership.id));
  const cancellationId = `cancel-${membership.paypalSubscriptionId}-${Date.now()}`;
  await db.insert(subscriptionRecords).values({
    userId,
    membershipType: membership.membershipType,
    amount: PAYPAL_PLAN_AMOUNT,
    currency: PAYPAL_PLAN_CURRENCY,
    provider: "paypal",
    paypalSubscriptionId: membership.paypalSubscriptionId,
    paypalTransactionId: cancellationId,
    status: "cancelled",
  });
  return { success: true };
}

export async function verifyPayPalWebhook(event: Record<string, any>, headers: Record<string, string | undefined>) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID is not configured");
  const verification = await paypalRequest<{ verification_status?: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  return verification.verification_status === "SUCCESS";
}

export async function handlePayPalWebhookEvent(event: Record<string, any>) {
  await updateMembershipFromPayPalEvent(event);
  return { received: true, eventType: event.event_type || "unknown" };
}

export function registerPayPalRoutes(app: Express) {
  app.post("/api/paypal/webhook", async (req: Request, res: Response) => {
    try {
      const event = req.body as Record<string, any>;
      const headers = {
        "paypal-auth-algo": req.header("paypal-auth-algo") || undefined,
        "paypal-cert-url": req.header("paypal-cert-url") || undefined,
        "paypal-transmission-id": req.header("paypal-transmission-id") || undefined,
        "paypal-transmission-sig": req.header("paypal-transmission-sig") || undefined,
        "paypal-transmission-time": req.header("paypal-transmission-time") || undefined,
      };
      if (!(await verifyPayPalWebhook(event, headers))) {
        res.status(400).json({ error: "Invalid PayPal webhook signature" });
        return;
      }
      res.status(200).json(await handlePayPalWebhookEvent(event));
    } catch (error) {
      console.error("[PayPal] Webhook handling failed", error);
      res.status(500).json({ error: "PayPal webhook processing failed" });
    }
  });
}
