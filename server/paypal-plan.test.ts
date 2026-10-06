import { describe, expect, it } from "vitest";
import { PAYPAL_PLAN_IDS, getPayPalPlanAmount, getPayPalPlanType } from "./paypal";

describe("PayPal monthly/yearly plan mapping", () => {
  it("keeps the configured yearly plan identifiable", () => {
    expect(PAYPAL_PLAN_IDS.yearly).toBeTruthy();
    expect(getPayPalPlanType(PAYPAL_PLAN_IDS.yearly)).toBe("yearly");
  });

  it("does not accept an unknown PayPal plan", () => {
    expect(getPayPalPlanType("P-UNKNOWN-PLAN")).toBeUndefined();
  });

  it("uses separate default amounts for monthly and yearly plans", () => {
    const monthly = getPayPalPlanAmount("monthly");
    const yearly = getPayPalPlanAmount("yearly");
    expect(Number(monthly)).toBeGreaterThan(0);
    expect(Number(yearly)).toBeGreaterThan(0);
    expect(monthly).not.toBe(yearly);
  });
});
