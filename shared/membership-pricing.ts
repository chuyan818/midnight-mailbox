export const MEMBERSHIP_PRICING = {
  monthly: {
    amount: 29,
    amountText: "29.00",
    periodMonths: 1,
  },
  yearly: {
    amount: 288,
    amountText: "288.00",
    periodMonths: 12,
  },
  currency: "USD",
} as const;

export type MembershipBillingCycle = "monthly" | "yearly";

export function getMembershipAmount(cycle: MembershipBillingCycle): string {
  return MEMBERSHIP_PRICING[cycle].amountText;
}
