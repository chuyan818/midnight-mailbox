import { describe, expect, it } from "vitest";
import { getPremiumSupportBenefits, getPremiumSupportResponseTime } from "./services/customer-support";

describe("customer support service", () => {
  it("exposes the promised premium support channels and SLA", () => {
    const responseTime = getPremiumSupportResponseTime();
    expect(responseTime.responseTime).toBe("24小时内");
    expect(responseTime.channels).toContain("站内工单");
    expect(responseTime.channels).toContain("邮件支持");
  });

  it("keeps the premium benefits aligned with the ticket workflow", () => {
    const benefits = getPremiumSupportBenefits();
    expect(benefits.title).toBe("优先客服支持");
    expect(benefits.benefits).toContain("24小时内优先响应");
    expect(benefits.benefits).toContain("站内工单与邮件支持");
  });
});
