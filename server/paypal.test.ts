import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { memberships, subscriptionRecords } from "../drizzle/schema";
import { getDb, getUserMembership, getUserSubscriptionRecords, upsertMembership } from "./db";
import { cancelPayPalSubscription, handlePayPalWebhookEvent } from "./paypal";

const userId = 987654;
const subscriptionId = "I-SANDBOXTEST123";
const originalClientId = process.env.PAYPAL_CLIENT_ID;
const originalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

describe("PayPal subscription webhook state transitions", () => {
  afterEach(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(subscriptionRecords).where(eq(subscriptionRecords.userId, userId));
      await db.delete(memberships).where(eq(memberships.userId, userId));
    }
    await upsertMembership(userId, {
      membershipType: "free",
      membershipExpiry: null,
      paypalSubscriptionId: null,
      paymentStatus: "none",
    });
    vi.unstubAllGlobals();
    if (originalClientId === undefined) delete process.env.PAYPAL_CLIENT_ID;
    else process.env.PAYPAL_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.PAYPAL_CLIENT_SECRET;
    else process.env.PAYPAL_CLIENT_SECRET = originalClientSecret;
  });

  it("activates membership only after a verified activation event is handled", async () => {
    await upsertMembership(userId, {
      membershipType: "free",
      membershipExpiry: null,
      paypalSubscriptionId: subscriptionId,
      paymentStatus: "pending",
    });

    await handlePayPalWebhookEvent({
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: subscriptionId,
        billing_info: { next_billing_time: "2030-01-01T00:00:00Z" },
      },
    });

    const membership = await getUserMembership(userId);
    expect(membership?.paymentStatus).toBe("active");
    expect(membership?.membershipType).toBe("yearly");
    expect(membership?.membershipExpiry?.toISOString()).toBe("2030-01-01T00:00:00.000Z");
  });

  it("returns a failed payment to the free tier", async () => {
    await upsertMembership(userId, {
      membershipType: "yearly",
      membershipExpiry: new Date("2030-01-01T00:00:00Z"),
      paypalSubscriptionId: subscriptionId,
      paymentStatus: "active",
    });

    await handlePayPalWebhookEvent({
      event_type: "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
      resource: { billing_agreement_id: subscriptionId },
    });

    const membership = await getUserMembership(userId);
    expect(membership?.paymentStatus).toBe("failed");
    expect(membership?.membershipType).toBe("free");
    expect(membership?.membershipExpiry).toBeNull();
  });

  it("adds a separate completed record for a recurring PayPal payment", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await upsertMembership(userId, {
      membershipType: "yearly",
      membershipExpiry: new Date("2030-01-01T00:00:00Z"),
      paypalSubscriptionId: subscriptionId,
      paymentStatus: "active",
    });
    await db.insert(subscriptionRecords).values({
      userId,
      membershipType: "yearly",
      amount: "99.00",
      currency: "USD",
      provider: "paypal",
      paypalSubscriptionId: subscriptionId,
      status: "completed",
    });

    await handlePayPalWebhookEvent({
      event_type: "PAYMENT.SALE.COMPLETED",
      resource: {
        id: "PAY-RENEWAL-123",
        billing_agreement_id: subscriptionId,
        amount: { total: "99.00", currency: "USD" },
      },
    });

    const records = await getUserSubscriptionRecords(userId);
    expect(records.some((record) => record.paypalTransactionId === "PAY-RENEWAL-123" && record.status === "completed")).toBe(true);
  });

  it("turns off auto-renew without removing active benefits after cancellation", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await upsertMembership(userId, {
      membershipType: "yearly",
      membershipExpiry: new Date("2030-01-01T00:00:00Z"),
      paypalSubscriptionId: subscriptionId,
      paymentStatus: "active",
      autoRenew: true,
    });
    process.env.PAYPAL_CLIENT_ID = "test-client-id";
    process.env.PAYPAL_CLIENT_SECRET = "test-client-secret";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "test-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })));

    await cancelPayPalSubscription(userId);

    const membership = await getUserMembership(userId);
    const records = await getUserSubscriptionRecords(userId);
    expect(membership?.membershipType).toBe("yearly");
    expect(membership?.paymentStatus).toBe("active");
    expect(membership?.autoRenew).toBe(false);
    expect(membership?.membershipExpiry?.toISOString()).toBe("2030-01-01T00:00:00.000Z");
    expect(records.some((record) => record.status === "cancelled")).toBe(true);
    expect(vi.mocked(fetch).mock.calls[1]?.[0]).toContain(`/v1/billing/subscriptions/${subscriptionId}/cancel`);
  });
});
