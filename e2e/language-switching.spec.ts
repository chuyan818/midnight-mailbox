import { expect, test } from "@playwright/test";

const languages = [
  { code: "zh", brand: "深夜信箱", start: "开始写信", writeLogin: "请先登录", register: "创建你的账号", placeholder: "在这里写下你的心事...", shareTitle: "分享这封信", shareText: "我在深夜信箱里写下了我的心事，AI给了我温暖的回复。你也来试试吧！", wechat: "微信分享", weibo: "分享到微博", qq: "分享到QQ", copy: "复制链接", close: "关闭", send: "发送信件" },
  { code: "en", brand: "Midnight Mailbox", start: "Start writing", writeLogin: "Please log in", register: "Create your account", placeholder: "Write what is on your mind...", shareTitle: "Share this letter", shareText: "I wrote my feelings in Midnight Mailbox and received a warm AI reply. Try it too!", wechat: "Share to WeChat", weibo: "Share to Weibo", qq: "Share to QQ", copy: "Copy link", close: "Close", send: "Send letter" },
  { code: "ja", brand: "深夜信箱", start: "書き始める", writeLogin: "ログインしてください", register: "アカウントを作成", placeholder: "ここに心のことを書いてください...", shareTitle: "この手紙をシェア", shareText: "深夜信箱に心のことを書いたら、AIが温かい返事をくれました。あなたも試してみませんか？", wechat: "WeChatでシェア", weibo: "Weiboでシェア", qq: "QQでシェア", copy: "リンクをコピー", close: "閉じる", send: "手紙を送る" },
  { code: "ko", brand: "심야 우편함", start: "편지 쓰기", writeLogin: "먼저 로그인해 주세요", register: "계정 만들기", placeholder: "여기에 마음을 적어 보세요...", shareTitle: "이 편지 공유하기", shareText: "심야 우편함에 마음을 적었더니 AI가 따뜻한 답장을 보내 주었어요. 당신도 해 보세요!", wechat: "WeChat으로 공유", weibo: "Weibo로 공유", qq: "QQ로 공유", copy: "링크 복사", close: "닫기", send: "편지 보내기" },
] as const;
const languageLabel = (code: string) => code === "zh" ? "中文" : code === "en" ? "English" : code === "ja" ? "日本語" : "한국어";
const emailPlaceholder = (code: string) => code === "zh" ? "请输入邮箱" : code === "en" ? "Enter your email" : code === "ja" ? "メールアドレスを入力" : "이메일을 입력해 주세요";

for (const language of languages) {
  test(`switches the full public experience to ${language.code}`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Select language" }).click();
    await page.getByRole("button", { name: new RegExp(languageLabel(language.code)) }).click();
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
});

test("login and registration pages render translated labels", async ({ page }) => {
  for (const language of languages) {
    await page.goto("/user-login");
    await page.getByRole("button", { name: "Select language" }).click();
    await page.getByRole("button", { name: new RegExp(languageLabel(language.code)) }).click();
    await expect(page.getByRole("heading", { name: language.brand }).first()).toBeVisible();
    await expect(page.getByPlaceholder(emailPlaceholder(language.code))).toBeVisible();
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: language.register })).toBeVisible();
  }
});

async function loginAsTestUser(page: import("@playwright/test").Page) {
  await page.addInitScript(() => localStorage.setItem("language", "zh"));
  await page.goto("/user-login");
  await page.getByPlaceholder("请输入邮箱").fill(process.env.E2E_TEST_EMAIL ?? "test@midnight-mailbox.test");
  await page.getByPlaceholder("请输入密码").fill(process.env.E2E_TEST_PASSWORD ?? "MidnightTest2026!");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(page.getByRole("button", { name: "个人中心" })).toBeVisible();
}

test("authenticated users can choose and restore a localized animated theme", async ({ page }) => {
  await loginAsTestUser(page);
  await page.goto("/write");
  await page.getByRole("button", { name: "星空漫漫" }).first().click();
  await expect(page.getByText("星星闪烁，流星划过夜空")).toBeVisible();
  await page.getByRole("button", { name: /樱花来信/ }).first().click();
  await page.getByRole("button", { name: /樱花来信/ }).first().click();
  await expect(page.getByText("樱花花瓣缓缓飘落，柔光流动")).toBeVisible();
  await expect(page.locator(".theme-cherry-blossom").first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("midnight-mailbox-selected-theme"))).toBe("cherry-blossom");
  await page.reload();
  await expect(page.locator(".theme-cherry-blossom").first()).toBeVisible();
});

test("share dialog stays readable in all four languages", async ({ page }) => {
  await loginAsTestUser(page);
  await page.route("**/api/trpc/letter.create*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { id: "e2e-share-letter" } } } }]) });
  });
  for (const [index, language] of languages.entries()) {
    await page.goto("/write");
    if (index > 0) {
      await page.getByRole("button", { name: "Select language" }).click();
      await page.getByRole("button", { name: new RegExp(languageLabel(language.code)) }).click();
    }
    await page.getByPlaceholder(language.placeholder).fill(`E2E share copy ${language.code}`);
    await page.getByRole("button", { name: language.send }).click();
    const dialog = page.getByRole("dialog", { name: language.shareTitle });
    await expect(dialog).toBeVisible({ timeout: 8000 });
    await expect(dialog.getByText(language.shareText)).toBeVisible();
    for (const label of [language.wechat, language.weibo, language.qq, language.copy, language.close]) {
      await expect(dialog.getByRole("button", { name: label })).toBeVisible();
    }
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight)).toBe(true);
  }
});
