import { afterEach, describe, expect, it } from "vitest";
import { getUserMembership, upsertMembership } from "./db";
import { handlePayPalWebhookEvent } from "./paypal";

const userId = 987654;
const subscriptionId = "I-SANDBOXTEST123";

describe("PayPal subscription webhook state transitions", () => {
  afterEach(async () => {
    await upsertMembership(userId, {
      membershipType: "free",
      membershipExpiry: null,
      paypalSubscriptionId: null,
      paymentStatus: "none",
    });
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
});
