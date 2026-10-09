# 使用 Google Apps Script 发送邮箱验证码

这个方案继续使用你的 Gmail 发信，但不连接 Railway 的 SMTP 465/587 端口，而是通过 HTTPS 调用 Google Apps Script，再由 Apps Script 的 `GmailApp` 发信。

## 1. 创建 Apps Script

1. 登录要作为发件人的 Google 账号，打开 [script.google.com](https://script.google.com/)。
2. 新建一个独立项目，例如 `Midnight Mail Sender`。
3. 删除默认代码，把本项目的 [`Code.gs`](../scripts/google-mail/Code.gs) 全部复制进去。
4. 将代码第一行的 `REPLACE_WITH_A_LONG_RANDOM_SECRET` 替换为一段随机长字符串，例如使用密码管理器生成 32 位以上随机值。
5. 点击左侧“项目设置”，确认项目时区可设为 `Asia/Shanghai`；这不是发信功能的必要条件。

## 2. 首次授权并部署

1. 在 Apps Script 编辑器中选择函数 `doPost`，点击“运行”。
2. Google 会要求授权，选择你的 Gmail 账号并允许脚本代表你发送邮件。
3. 点击“部署” → “新部署”。
4. 类型选择“Web 应用”。
5. “执行身份”选择“我”。
6. “谁可以访问”选择“任何人”。脚本仍会用请求体中的 secret 拒绝未授权请求。
7. 点击“部署”，复制生成的 Web App URL。URL 通常以 `/exec` 结尾。

> 不要把 Web App URL 或 secret 发到聊天。URL 可以出现在 Railway 的环境变量中，secret 只应存放在 Railway 和 Apps Script 代码中。

## 3. 在 Railway 设置变量

打开 `midnight-mailbox → Variables`，新增或修改：

| 变量 | 值 |
| --- | --- |
| `GOOGLE_MAIL_SCRIPT_URL` | Apps Script 部署生成的 `/exec` URL |
| `GOOGLE_MAIL_SCRIPT_SECRET` | 你在 `Code.gs` 中设置的同一段随机字符串 |

保存后点击 **Deploy**。配置这两个变量后，后端会优先使用 Google Apps Script；SMTP 变量会保留为备用，不会被优先调用。

## 4. 验证

打开生产站的注册页，输入自己的测试邮箱，点击“发送验证码”。成功时会出现倒计时并收到 Gmail 验证码邮件。

如果失败：

- Apps Script 的“执行记录”中查看 `doPost` 是否被调用；
- 确认部署版本是最新版本，而不是测试部署；
- 确认 Railway 的 URL 使用 `/exec`，不是 `/dev`；
- 确认 `GOOGLE_MAIL_SCRIPT_SECRET` 与 `Code.gs` 完全一致；
- 确认 Apps Script 使用的 Google 账号仍可正常发信，且没有达到 Gmail 每日发送限额。

## 安全说明

- 不要在 Apps Script 日志中打印 `payload.secret`、验证码或收件人列表。
- 不要把 secret 写入前端代码、GitHub、截图或聊天消息。
- 如果 secret 泄露，立即在 `Code.gs` 中更换并同步更新 Railway 变量。
- Apps Script 受 Gmail 账户每日发送限额约束；深夜信箱的低频验证码发送通常适合该方案，但不适合大量营销邮件。
