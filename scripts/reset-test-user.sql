-- 安全重置测试用户密码并标记邮箱已验证
--
-- 注意：应用使用 Node.js crypto.scrypt 生成 passwordHash，PostgreSQL
-- crypt() 生成的 bcrypt/crypt 哈希与应用格式不兼容。
-- 请先用项目的 Node.js 生成器得到 scrypt$... 哈希，再执行本脚本。
--
-- 用法：
--   pnpm exec tsx -e 'import crypto from "node:crypto"; import { promisify } from "node:util"; const s=promisify(crypto.scrypt); const salt=crypto.randomBytes(16).toString("hex"); s("MidnightTest2026!",salt,64).then(h=>console.log(`scrypt$${salt}$${h.toString("hex")}`));'
--
--   psql "$DATABASE_URL" \
--     -v test_email='test@midnight-mailbox.test' \
--     -v password_hash='scrypt$REPLACE_WITH_GENERATED_SALT$REPLACE_WITH_GENERATED_HASH' \
--     -f scripts/reset-test-user.sql
--
-- 生产环境不要使用公开的测试密码或测试邮箱。

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  matched_users integer;
  supplied_hash text := :'password_hash';
BEGIN
  SELECT count(*)
    INTO matched_users
    FROM "users"
   WHERE lower("email") = lower(:'test_email');

  IF matched_users <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one test user, found %', matched_users;
  END IF;

  IF supplied_hash !~ '^scrypt\\$[0-9a-f]{32}\\$[0-9a-f]{128}$' THEN
    RAISE EXCEPTION 'password_hash must use the application format scrypt$<32-char-salt>$<128-char-hex-hash>';
  END IF;

  UPDATE "users"
     SET "passwordHash" = supplied_hash,
         "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW()),
         "loginMethod" = COALESCE("loginMethod", 'email'),
         "updatedAt" = NOW()
   WHERE lower("email") = lower(:'test_email');
END $$;

-- 仅输出非敏感确认信息，不输出密码哈希。
SELECT "id", "email", ("passwordHash" IS NOT NULL) AS "hasPassword", ("emailVerifiedAt" IS NOT NULL) AS "emailVerified"
  FROM "users"
 WHERE lower("email") = lower(:'test_email');

COMMIT;
