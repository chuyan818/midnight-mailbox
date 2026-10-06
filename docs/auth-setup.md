# 邮箱注册与 Google 登录配置

后端已经提供真实邮箱认证和 Google OAuth 回调。生产环境必须配置邮件服务和 Google OAuth 凭据；缺少配置时，接口会明确返回配置错误，不会伪造登录成功。

## SMTP 邮件发送

设置以下服务端环境变量：

```text
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mailbox@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=深夜信箱 <mailbox@example.com>
```

注册页调用 `POST /api/auth/email/send-code` 发送验证码。验证码使用随机六位数字，数据库仅保存哈希值，验证码 10 分钟过期、单邮箱 60 秒内不能重复发送、24 小时最多发送 10 次，连续 5 次错误后失效。

## Google OAuth

在 Google Cloud Console 创建 Web application OAuth Client，并将当前站点的回调地址加入 Authorized redirect URIs。设置：

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.example/api/auth/google/callback
```

Google 登录入口是 `GET /api/auth/google/start`，回调是 `GET /api/auth/google/callback`。服务端校验签名 state、10 分钟有效期、授权码交换、Google userinfo 的 verified email，并以 HttpOnly 会话 Cookie 登录现有用户或创建新用户。

## API

| Endpoint | Method | 用途 |
|---|---:|---|
| `/api/auth/email/send-code` | POST | 请求邮箱验证码，body 为 `{ "email": "..." }` |
| `/api/auth/email/register` | POST | 注册并建立会话，body 为 `{ "email": "...", "password": "...", "code": "123456", "name?": "..." }` |
| `/api/auth/email/login` | POST | 邮箱密码登录，body 为 `{ "email": "...", "password": "..." }` |
| `/api/auth/google/start` | GET | 跳转 Google 授权页 |
| `/api/auth/google/callback` | GET | Google OAuth 回调并建立会话 |

密码使用 Node.js `scrypt` 加盐哈希，不保存明文密码。邮箱注册和 Google 登录共用现有会话 Cookie 与 `auth.me` 认证上下文。

## 未配置时的行为

开发环境在未配置 SMTP 时会在服务端日志输出验证码并返回 `developmentCode`，仅用于本地联调；生产环境会拒绝发送。Google OAuth 未配置时 `/api/auth/google/start` 返回 HTTP 503，前端不会再显示虚假的登录成功。
