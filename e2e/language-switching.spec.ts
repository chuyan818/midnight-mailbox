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
