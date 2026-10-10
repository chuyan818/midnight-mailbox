import { expect, test } from "@playwright/test";

test.describe("邮箱注册到登录完整流程", () => {
  test("发送验证码、提交注册并使用同一账号登录", async ({ page }) => {
    const email = "midnight-e2e@example.com";
    const password = "MidnightE2E123";
    let registerPayload: Record<string, unknown> | undefined;
    let loginPayload: Record<string, unknown> | undefined;

    await page.route("**/api/auth/email/send-code", async (route) => {
      expect(route.request().method()).toBe("POST");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, expiresInSeconds: 600 }),
      });
    });

    await page.route("**/api/auth/email/register", async (route) => {
      registerPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: { id: 1001, email, name: "Midnight E2E", loginMethod: "email", role: "user" },
        }),
      });
    });

    await page.goto("/register");
    await page.locator('input[type="email"]').fill(email);

    const codeInput = page.locator('input[type="text"]').first();
    const sendCodeButton = codeInput.locator("xpath=..").getByRole("button");
    await sendCodeButton.click();
    await expect(sendCodeButton).toBeDisabled();

    await codeInput.fill("123456");
    await expect(page.getByText(/验证码格式正确|Verification code format is valid|認証コードの形式は正しい|인증 코드 형식이 올바릅니다/)).toBeVisible();

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);
    await page.locator("#terms").check();
    await page.getByRole("button", { name: /创建账号|Create account|アカウントを作成|계정 만들기/ }).click();

    await expect.poll(() => registerPayload).toEqual({ email, password, code: "123456" });
    await expect(page.getByRole("button", { name: /注册成功|Registration successful|登録しました|가입 완료/ })).toBeVisible();

    await page.route("**/api/auth/email/login", async (route) => {
      loginPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: { id: 1001, email, name: "Midnight E2E", loginMethod: "email", role: "user" },
          suspiciousLogin: false,
        }),
      });
    });

    await page.goto("/user-login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /登录|Log in|ログイン|로그인/ }).click();

    await expect.poll(() => loginPayload).toEqual({ email, password });
    await expect(page.getByRole("button", { name: /登录成功|Logged in|ログインしました|로그인 성공/ })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
