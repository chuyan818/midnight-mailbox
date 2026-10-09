import crypto from "node:crypto";
import { promisify } from "node:util";
import nodemailer from "nodemailer";
import { and, desc, eq, gte, isNull, or } from "drizzle-orm";
import { emailVerificationCodes, loginEvents, users } from "../../drizzle/schema";
import { getDb, getUserByEmail, getUserById, getUserByOpenId, upsertUser } from "../db";

const scryptAsync = promisify(crypto.scrypt);
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MIN_INTERVAL_MS = 60 * 1000;
const CODE_DAILY_LIMIT = 10;
const MAX_CODE_ATTEMPTS = 5;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateAuthEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateAuthPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

function hashCode(email: string, code: string) {
  return crypto.createHash("sha256").update(`${normalizeEmail(email)}:${code}:${process.env.JWT_SECRET ?? ""}`).digest("hex");
}

function makeCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function smtpEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

async function sendViaGoogleMailScript(email: string, code: string) {
  const url = smtpEnv("GOOGLE_MAIL_SCRIPT_URL");
  const secret = smtpEnv("GOOGLE_MAIL_SCRIPT_SECRET");
  if (!url || !secret) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret,
        to: email,
        subject: "深夜信箱｜邮箱验证码",
        text: `您的深夜信箱验证码是 ${code}，10 分钟内有效。如非本人操作，请忽略此邮件。`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.7"><h2>深夜信箱</h2><p>您的邮箱验证码是：</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p></div>`,
      }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({})) as { success?: boolean; error?: string };
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || `Google Mail Script HTTP ${response.status}`);
    }
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

function createMailer() {
  const host = smtpEnv("SMTP_HOST");
  const port = Number(smtpEnv("SMTP_PORT") || 587);
  const user = smtpEnv("SMTP_USER") || smtpEnv("SMTP_USERNAME") || smtpEnv("SMTP_FROM");
  const pass = smtpEnv("SMTP_PASSWORD");
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: smtpEnv("SMTP_SECURE").toLowerCase() === "true" || port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export async function sendVerificationEmail(email: string, code: string) {
  const from = smtpEnv("SMTP_FROM") || smtpEnv("SMTP_USER");
  if (smtpEnv("GOOGLE_MAIL_SCRIPT_URL") && smtpEnv("GOOGLE_MAIL_SCRIPT_SECRET")) {
    try {
      await sendViaGoogleMailScript(email, code);
      return { delivered: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Auth] Google Mail Script send failed: ${message.slice(0, 240)}`);
      throw new Error("验证码邮件发送失败，请稍后重试");
    }
  }

  const mailer = createMailer();
  if (!mailer || !from) {
    const missing = ["SMTP_HOST", "SMTP_USER/SMTP_FROM", "SMTP_PASSWORD"].filter((name) => {
      if (name === "SMTP_USER/SMTP_FROM") return !smtpEnv("SMTP_USER") && !smtpEnv("SMTP_USERNAME") && !smtpEnv("SMTP_FROM");
      return !smtpEnv(name);
    });
    console.error(`[Auth] SMTP configuration missing: ${missing.join(", ") || "unknown"}`);
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Auth] SMTP is not configured; verification code for ${email}: ${code}`);
      return { delivered: false, developmentCode: code };
    }
    throw new Error("Email delivery is not configured");
  }

  try {
    await mailer.sendMail({
      from,
      to: email,
      subject: "深夜信箱｜邮箱验证码",
      text: `您的深夜信箱验证码是 ${code}，10 分钟内有效。如非本人操作，请忽略此邮件。`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.7"><h2>深夜信箱</h2><p>您的邮箱验证码是：</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p></div>`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Auth] SMTP send failed: ${message.slice(0, 240)}`);
    throw new Error("验证码邮件发送失败，请稍后重试");
  }
  return { delivered: true };
}

export async function issueEmailVerificationCode(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!validateAuthEmail(email)) throw new Error("请输入有效的邮箱地址");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = Date.now();
  const [latest] = await db.select().from(emailVerificationCodes).where(eq(emailVerificationCodes.email, email)).orderBy(desc(emailVerificationCodes.createdAt)).limit(1);
  if (latest && now - latest.createdAt.getTime() < CODE_MIN_INTERVAL_MS) {
    throw new Error("验证码发送过于频繁，请稍后再试");
  }

  const todayStart = new Date(now - 24 * 60 * 60 * 1000);
  const recent = await db.select({ id: emailVerificationCodes.id }).from(emailVerificationCodes).where(and(eq(emailVerificationCodes.email, email), gte(emailVerificationCodes.createdAt, todayStart)));
  if (recent.length >= CODE_DAILY_LIMIT) throw new Error("今天已达到验证码发送上限");

  const code = makeCode();
  await db.insert(emailVerificationCodes).values({
    email,
    codeHash: hashCode(email, code),
    expiresAt: new Date(now + CODE_TTL_MS),
  });
  const delivery = await sendVerificationEmail(email, code);
  return { expiresInSeconds: CODE_TTL_MS / 1000, ...delivery };
}

export async function consumeEmailVerificationCode(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db.select().from(emailVerificationCodes).where(and(eq(emailVerificationCodes.email, email), isNull(emailVerificationCodes.consumedAt))).orderBy(desc(emailVerificationCodes.createdAt)).limit(1);
  if (!record || record.expiresAt.getTime() < Date.now() || record.attempts >= MAX_CODE_ATTEMPTS) return false;

  const valid = crypto.timingSafeEqual(Buffer.from(record.codeHash, "hex"), Buffer.from(hashCode(email, code), "hex"));
  if (!valid) {
    await db.update(emailVerificationCodes).set({ attempts: record.attempts + 1 }).where(eq(emailVerificationCodes.id, record.id));
    return false;
  }
  await db.update(emailVerificationCodes).set({ consumedAt: new Date() }).where(eq(emailVerificationCodes.id, record.id));
  return true;
}

function emailOpenId(email: string) {
  return `email:${crypto.createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 32)}`;
}

export async function registerEmailUser(emailInput: string, password: string, code: string, name?: string) {
  const email = normalizeEmail(emailInput);
  if (!validateAuthEmail(email)) throw new Error("请输入有效的邮箱地址");
  if (!validateAuthPassword(password)) throw new Error("密码至少 8 位，并包含字母和数字");
  if (!(await consumeEmailVerificationCode(email, code))) throw new Error("验证码无效或已过期");

  const existing = await getUserByEmail(email);
  if (existing?.passwordHash) throw new Error("该邮箱已注册，请直接登录");
  const openId = existing?.openId ?? emailOpenId(email);
  await upsertUser({
    openId,
    email,
    name: name?.trim() || existing?.name || email.split("@")[0],
    passwordHash: await hashPassword(password),
    emailVerifiedAt: new Date(),
    loginMethod: existing?.loginMethod ?? "email",
    lastSignedIn: new Date(),
  });
  return (await getUserByOpenId(openId))!;
}

export async function authenticateEmailUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const user = await getUserByEmail(email);
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return undefined;
  return user;
}

function normalizeIp(ipAddress: string) {
  return ipAddress.replace(/^::ffff:/, "").trim().slice(0, 128) || "unknown";
}

export async function checkLoginRateLimit(emailInput: string, ipAddress: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const since = new Date(Date.now() - LOGIN_FAILURE_WINDOW_MS);
  const failures = await db.select({ createdAt: loginEvents.createdAt })
    .from(loginEvents)
    .where(and(
      eq(loginEvents.success, false),
      gte(loginEvents.createdAt, since),
      or(eq(loginEvents.email, normalizeEmail(emailInput)), eq(loginEvents.ipAddress, normalizeIp(ipAddress))),
    ));
  const lockedUntil = failures.length >= MAX_LOGIN_FAILURES
    ? new Date(Date.now() + LOGIN_LOCK_MS)
    : null;
  return { allowed: !lockedUntil, retryAfterSeconds: lockedUntil ? Math.ceil(LOGIN_LOCK_MS / 1000) : 0 };
}

export async function recordLoginEvent(input: {
  userId?: number;
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const email = normalizeEmail(input.email);
  const ipAddress = normalizeIp(input.ipAddress);
  let suspicious = false;
  if (input.success && input.userId) {
    const previous = await db.select({ ipAddress: loginEvents.ipAddress, userAgent: loginEvents.userAgent })
      .from(loginEvents)
      .where(and(eq(loginEvents.userId, input.userId), eq(loginEvents.success, true)))
      .orderBy(desc(loginEvents.createdAt))
      .limit(20);
    suspicious = previous.length > 0 && !previous.some((event) => event.ipAddress === ipAddress && event.userAgent === input.userAgent);
  }
  await db.insert(loginEvents).values({
    userId: input.userId,
    email,
    ipAddress,
    userAgent: input.userAgent?.slice(0, 512),
    success: input.success,
    failureReason: input.failureReason,
  });
  if (input.success && input.userId) {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, input.userId));
  }
  return { suspicious };
}

export async function getRecentLoginEvents(userId: number, limit = 12) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const events = await db.select({
    id: loginEvents.id,
    success: loginEvents.success,
    ipAddress: loginEvents.ipAddress,
    userAgent: loginEvents.userAgent,
    failureReason: loginEvents.failureReason,
    createdAt: loginEvents.createdAt,
  }).from(loginEvents)
    .where(eq(loginEvents.userId, userId))
    .orderBy(desc(loginEvents.createdAt))
    .limit(limit);
  return events.map((event) => ({
    ...event,
    ipAddress: event.ipAddress.includes(".") ? event.ipAddress.replace(/\.\d+$/, ".[hidden]") : event.ipAddress,
  }));
}

export async function changeEmailPassword(userId: number, currentPassword: string, newPassword: string) {
  if (!validateAuthPassword(newPassword)) throw new Error("新密码至少 8 位，并包含字母和数字");
  if (currentPassword === newPassword) throw new Error("新密码不能与当前密码相同");

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const user = await getUserById(userId);
  if (!user?.passwordHash) throw new Error("当前账号未设置邮箱密码");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw new Error("当前密码错误");

  await db.update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { success: true } as const;
}

export const authLimits = {
  codeTtlMs: CODE_TTL_MS,
  codeMinIntervalMs: CODE_MIN_INTERVAL_MS,
  codeDailyLimit: CODE_DAILY_LIMIT,
  maxCodeAttempts: MAX_CODE_ATTEMPTS,
  loginFailureWindowMs: LOGIN_FAILURE_WINDOW_MS,
  maxLoginFailures: MAX_LOGIN_FAILURES,
  loginLockMs: LOGIN_LOCK_MS,
};
