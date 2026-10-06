import { expect, test, type Page } from "@playwright/test";

const hasAuthState = Boolean(process.env.E2E_STORAGE_STATE);

const baseUser = {
  user: { id: 1001, email: "e2e@example.com", name: "E2E Tester", loginMethod: "email", role: "user", hasPassword: true },
};

async function mockProfile(page: Page, membership: Record<string, unknown>, trendData: Array<Record<string, unknown>> = []) {
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();
    if (url.includes("user.getProfile")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { data: { json: { ...baseUser, membership } } } }),
      });
      return;
    }
    if (url.includes("emotion.getTodayScore")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { data: { json: { type: "平静", score: 64, count: 1 } } } }) });
      return;
    }
    if (url.includes("emotion.getTrendData")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ result: { data: { json: trendData } } }) });
      return;
    }
    await route.continue();
  });
}

test.describe("会员报告权限与趋势图", () => {
  test.skip(!hasAuthState, "需要设置 E2E_STORAGE_STATE 使用已登录测试账号运行");

  test("免费用户看到升级提示且不会加载7天趋势图", async ({ page }) => {
    await mockProfile(page, { membershipType: "free", paymentStatus: "none", membershipExpiry: null });
    await page.goto("/report");
    await expect(page.getByTestId("report-upgrade-prompt")).toBeVisible();
    await expect(page.getByTestId("emotion-trend-chart")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "升级会员" })).toBeVisible();
  });

  test("已激活会员看到7天情绪趋势折线图", async ({ page }) => {
    await mockProfile(page, {
      membershipType: "monthly",
      paymentStatus: "active",
      membershipExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, [
      { date: "2026-10-01", score: 42, type: "孤独" },
      { date: "2026-10-02", score: 57, type: "压力" },
      { date: "2026-10-03", score: 71, type: "平静" },
    ]);
    await page.goto("/report");
    await expect(page.getByTestId("emotion-trend-chart")).toBeVisible();
    await expect(page.getByTestId("report-upgrade-prompt")).toHaveCount(0);
  });

  test("过期会员重新回落到升级提示", async ({ page }) => {
    await mockProfile(page, {
      membershipType: "yearly",
      paymentStatus: "active",
      membershipExpiry: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }, [{ date: "2026-10-01", score: 72, type: "平静" }]);
    await page.goto("/report");
    await expect(page.getByTestId("report-upgrade-prompt")).toBeVisible();
    await expect(page.getByTestId("emotion-trend-chart")).toHaveCount(0);
  });
});
