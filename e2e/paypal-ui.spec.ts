import { expect, test } from "@playwright/test";

test.describe("PayPal 支付 UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("language", "en"));
  });

  test("支付失败页提供清晰提示和重试入口", async ({ page }) => {
    await page.goto("/payment-result?status=failed");
    await expect(page.getByTestId("payment-result-failed")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Payment not completed" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Try payment again/ })).toBeVisible();
    await expect(page.getByText("Stripe", { exact: true })).toHaveCount(0);
  });

  test("支付成功回调在 Webhook 确认前显示处理中状态", async ({ page }) => {
    await page.goto("/payment-result?status=success");
    await expect(page.getByTestId("payment-result-pending")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Payment processing" })).toBeVisible();
    await expect(page.getByText("PayPal", { exact: true }).first()).toBeVisible();
  });
});
