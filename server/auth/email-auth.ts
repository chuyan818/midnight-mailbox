import crypto from "node:crypto";
import { promisify } from "node:util";
import nodemailer from "nodemailer";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { emailVerificationCodes } from "../../drizzle/schema";
import { getDb, getUserByEmail, getUserByOpenId, upsertUser } from "../db";

const scryptAsync = promisify(crypto.scrypt);
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MIN_INTERVAL_MS = 60 * 1000;
const CODE_DAILY_LIMIT = 10;
const MAX_CODE_ATTEMPTS = 5;

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

function createMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(email: string, code: string) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const mailer = createMailer();
  if (!mailer || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Auth] SMTP is not configured; verification code for ${email}: ${code}`);
      return { delivered: false, developmentCode: code };
    }
    throw new Error("Email delivery is not configured");
  }

  await mailer.sendMail({
    from,
    to: email,
    subject: "深夜信箱｜邮箱验证码",
    text: `您的深夜信箱验证码是 ${code}，10 分钟内有效。如非本人操作，请忽略此邮件。`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.7"><h2>深夜信箱</h2><p>您的邮箱验证码是：</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p>验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p></div>`,
  });
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

export const authLimits = {
  codeTtlMs: CODE_TTL_MS,
  codeMinIntervalMs: CODE_MIN_INTERVAL_MS,
  codeDailyLimit: CODE_DAILY_LIMIT,
  maxCodeAttempts: MAX_CODE_ATTEMPTS,
};
