import { expect, test } from "@playwright/test";

const sandboxEnabled = process.env.PAYPAL_SANDBOX_E2E === "true";

test.describe("PayPal Sandbox subscription flow", () => {
  test.skip(!sandboxEnabled, "Set PAYPAL_SANDBOX_E2E=true and E2E_STORAGE_STATE to run the real PayPal Sandbox flow");

  test("shows processing, then refreshes to the webhook result", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByTestId("membership-payment-card")).toBeVisible();

    const paypalFrame = page.frameLocator('iframe[title*="PayPal"], iframe[name*="paypal"]');
    const subscribeButton = paypalFrame.getByRole("button").first();
    await expect(subscribeButton).toBeVisible({ timeout: 30_000 });

    await subscribeButton.click();
    await expect(page.getByTestId("paypal-loading")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("payment-status-pending")).toBeVisible({ timeout: 30_000 });

    await expect.poll(async () => {
      const active = await page.getByTestId("payment-status-active").count();
      const failed = await page.getByTestId("payment-status-failed").count();
      return active + failed;
    }, { timeout: 180_000, intervals: [3_000, 5_000] }).toBe(1);

    const active = await page.getByTestId("payment-status-active").count();
    if (active) {
      await expect(page).toHaveURL(/\/profile\?payment=success/);
      await expect(page.getByText(/membership benefits|会员权益|メンバー特典|멤버십 혜택/i)).toBeVisible();
    } else {
      await expect(page.getByTestId("payment-status-failed")).toBeVisible();
    }
  });
});
