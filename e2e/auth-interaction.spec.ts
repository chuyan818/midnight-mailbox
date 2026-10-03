import { expect, test } from "@playwright/test";

test.describe("首页与登录页交互", () => {
  test("未登录用户点击首页开始写信会顺畅进入登录页", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Midnight Mailbox" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Start writing" }).first().click();

    await expect(page).toHaveURL(/\/user-login$/);
    await expect(page.getByRole("heading", { name: "Midnight Mailbox" }).first()).toBeVisible();
    await expect(page.getByPlaceholder("Enter your email")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
  });

  test("登录空表单和非法输入会即时显示校验提示", async ({ page }) => {
    await page.goto("/user-login");
    const loginButton = page.getByRole("button", { name: "Log in", exact: true });

    await loginButton.click();
    await expect(page.getByText("Please enter a valid email", { exact: true })).toBeVisible();
    await expect(page.getByText("Enter your password", { exact: true })).toBeVisible();

    await page.getByPlaceholder("Enter your email").fill("not-an-email");
    await page.getByPlaceholder("Enter your password").fill("123");
    await loginButton.click();
    await expect(page.getByText("Please enter a valid email", { exact: true })).toBeVisible();
    await expect(page.getByText("Password must be at least 6 characters", { exact: true })).toBeVisible();
  });

  test("登录失败后按钮恢复可用，密码显隐切换不丢失输入", async ({ page }) => {
    await page.route("**/api/auth/email/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid credentials" }),
      });
    });
    await page.goto("/user-login");

    const password = page.getByPlaceholder("Enter your password");
    const passwordToggle = password.locator("..").getByRole("button");
    await page.getByPlaceholder("Enter your email").fill("test@example.com");
    await password.fill("correct-looking-password");
    await passwordToggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("correct-looking-password");

    await passwordToggle.click();
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid credentials");
    await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeEnabled();
  });
});
