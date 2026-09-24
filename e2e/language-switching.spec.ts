import { expect, test } from "@playwright/test";

const languages = [
  { code: "zh", brand: "深夜信箱", start: "开始写信", writeLogin: "请先登录" },
  { code: "en", brand: "Midnight Mailbox", start: "Start writing", writeLogin: "Please log in" },
  { code: "ja", brand: "深夜信箱", start: "書き始める", writeLogin: "ログインしてください" },
  { code: "ko", brand: "심야 우편함", start: "편지 쓰기", writeLogin: "먼저 로그인해 주세요" },
] as const;

for (const language of languages) {
  test(`switches the full public experience to ${language.code}`, async ({ page }) => {
    await page.goto("/");
    const selector = page.getByRole("button", { name: "Select language" });
    await selector.click();
    await page.getByRole("button", { name: new RegExp(language.code === "zh" ? "中文" : language.code === "en" ? "English" : language.code === "ja" ? "日本語" : "한국어") }).click();

    await expect(page.getByRole("heading", { name: language.brand }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: language.start }).first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", language.code);

    await page.goto("/write");
    await expect(page.getByRole("heading", { name: language.writeLogin })).toBeVisible();
  });
}

test("persists the selected language after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select language" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("language"))).toBe("en");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Midnight Mailbox" }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("language"))).toBe("en");
});

test("authenticated users can choose a localized animated theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("language", "zh"));
  await page.goto("/user-login");
  await page.getByPlaceholder("请输入邮箱").fill(process.env.E2E_TEST_EMAIL ?? "test@midnight-mailbox.test");
  await page.getByPlaceholder("请输入密码").fill(process.env.E2E_TEST_PASSWORD ?? "MidnightTest2026!");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "个人中心" })).toBeVisible();

  await page.goto("/write");
  await expect(page.getByRole("heading", { name: "写信主题" })).toBeVisible();
  await page.getByRole("button", { name: "星空漫漫" }).first().click();
  await expect(page.getByText("星星闪烁，流星划过夜空")).toBeVisible();
  await page.getByRole("button", { name: /樱花来信/ }).first().click();
  await page.getByRole("button", { name: /樱花来信/ }).first().click();
  await expect(page.getByText("樱花花瓣缓缓飘落，柔光流动")).toBeVisible();
  await expect(page.locator(".theme-cherry-blossom").first()).toBeVisible();
});
