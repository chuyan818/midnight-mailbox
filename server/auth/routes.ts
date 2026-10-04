import type { Express, Request, Response } from "express";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import {
  authenticateEmailUser,
  checkLoginRateLimit,
  issueEmailVerificationCode,
  recordLoginEvent,
  registerEmailUser,
  validateAuthEmail,
  validateAuthPassword,
} from "./email-auth";
import { getUserByEmail } from "../db";
import {
  authenticateGoogleCallback,
  getGoogleAuthorizationUrl,
  isGoogleOAuthConfigured,
  verifyGoogleState,
} from "./google-auth";

const sendCodeSchema = z.object({ email: z.string().trim().email() });
const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  code: z.string().regex(/^\d{6}$/),
  name: z.string().trim().max(80).optional(),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

function publicUser(user: { id: number; email: string | null; name: string | null; loginMethod: string | null; role: "user" | "admin" }) {
  return { id: user.id, email: user.email, name: user.name, loginMethod: user.loginMethod, role: user.role };
}

async function establishSession(req: Request, res: Response, user: { openId: string; name: string | null }) {
  const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
  res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
}

function sendValidationError(res: Response, error: unknown) {
  const message = error instanceof z.ZodError ? "请求参数不正确" : error instanceof Error ? error.message : "请求失败";
  res.status(400).json({ success: false, error: message });
}

export function registerEmailAuthRoutes(app: Express) {
  app.post("/api/auth/email/send-code", async (req, res) => {
    const parsed = sendCodeSchema.safeParse(req.body);
    if (!parsed.success || !validateAuthEmail(parsed.data.email)) {
      res.status(400).json({ success: false, error: "请输入有效的邮箱地址" });
      return;
    }
    try {
      const result = await issueEmailVerificationCode(parsed.data.email);
      res.json({ success: true, expiresInSeconds: result.expiresInSeconds, developmentCode: result.developmentCode });
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.post("/api/auth/email/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success || !validateAuthPassword(parsed.data.password)) {
      res.status(400).json({ success: false, error: "邮箱、验证码或密码格式不正确" });
      return;
    }
    try {
      const user = await registerEmailUser(parsed.data.email, parsed.data.password, parsed.data.code, parsed.data.name);
      await establishSession(req, res, user);
      res.status(201).json({ success: true, user: publicUser(user) });
    } catch (error) {
      sendValidationError(res, error);
    }
  });

  app.post("/api/auth/email/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "邮箱或密码格式不正确" });
      return;
    }
    try {
      const forwardedFor = req.headers["x-forwarded-for"];
      const ipAddress = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : req.ip ?? "unknown";
      const userAgent = req.get("user-agent") ?? undefined;
      const rateLimit = await checkLoginRateLimit(parsed.data.email, ipAddress);
      if (!rateLimit.allowed) {
        res.status(429).json({ success: false, error: `登录失败次数过多，请 ${Math.ceil(rateLimit.retryAfterSeconds / 60)} 分钟后再试`, retryAfterSeconds: rateLimit.retryAfterSeconds });
        return;
      }
      const account = await getUserByEmail(parsed.data.email);
      const user = await authenticateEmailUser(parsed.data.email, parsed.data.password);
      if (!user) {
        await recordLoginEvent({ userId: account?.id, email: parsed.data.email, ipAddress, userAgent, success: false, failureReason: "invalid_credentials" });
        res.status(401).json({ success: false, error: "邮箱或密码错误" });
        return;
      }
      const audit = await recordLoginEvent({ userId: user.id, email: parsed.data.email, ipAddress, userAgent, success: true });
      await establishSession(req, res, user);
      res.json({ success: true, user: publicUser(user), suspiciousLogin: audit.suspicious });
    } catch (error) {
      console.error("[Auth] Email login failed", error);
      res.status(500).json({ success: false, error: "登录暂时不可用" });
    }
  });

  app.get("/api/auth/google/start", (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      res.status(503).json({ success: false, error: "Google OAuth 尚未配置" });
      return;
    }
    try {
      res.redirect(302, getGoogleAuthorizationUrl(req));
    } catch (error) {
      console.error("[Auth] Google start failed", error);
      res.status(500).json({ success: false, error: "Google 登录暂时不可用" });
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const stateData = verifyGoogleState(state);
    if (!code || !stateData) {
      res.redirect(302, "/login?error=oauth_state_invalid");
      return;
    }
    try {
      const user = await authenticateGoogleCallback(code);
      await establishSession(req, res, user);
      res.redirect(302, stateData.returnPath);
    } catch (error) {
      console.error("[Auth] Google callback failed", error);
      res.redirect(302, "/login?error=oauth_failed");
    }
  });
}
