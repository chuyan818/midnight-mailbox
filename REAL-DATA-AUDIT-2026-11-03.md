# 真实数据闭环盘点（2026-11-03）

## A. 仍存在的占位或硬编码模块

### 已处理

1. 已从 `client/src/pages/Profile.tsx`、`server/db.ts` 及多语言配置中移除未实现的“情绪停留时长”指标；没有继续保留伪造的统计值。
2. `client/src/lib/page-translations.ts` 中的情绪文案仍有旧的固定孤独翻译键，当前 Profile 不再使用该指标；后续可继续改为动态模板。
3. 已从 `client/src/components/Map.tsx` 移除 `DEMO_MAP_ID`，未来启用地图时再配置真实 Map ID。

### 已删除的遗留代码

4. 已删除未挂载的 `client/src/pages/ComponentShowcase.tsx`，包括其中的模拟 AI 响应。
5. 已删除未挂载的 `server/routers/public-mailbox-v2.ts`，避免 PostgreSQL 项目误用 MySQL 查询函数。
6. 已删除未被引用的 `server/routers/social-integration.ts`。

## B. 合理的固定值，不属于伪造业务数据

- `server/llm-hybrid.ts` 中的 50/58/78 情绪 fallback 分数：仅在模型不可用时使用，属于降级策略。
- `server/membership-config.ts`、`shared/membership-pricing.ts` 中的会员权益和价格：属于配置常量，当前 PayPal 金额已复用统一价格源。
- 空列表文案、加载文案、在线人数 TTL、点赞增减 SQL：属于正常 UI/业务默认行为。
- `setTimeout` 出现在复制提示、动画、网络超时等地方，不等于模拟业务；已确认 `SecuritySettings.tsx` 不再使用 `setTimeout` 模拟验证或保存。

## C. 安全设置完整流程测试

新增 `server/security-settings.test.ts`，使用模拟数据库但真实调用 tRPC router、真实 scrypt 哈希和真实验证函数，覆盖：

1. 未配置时 `security.get` 返回 `configured: false`。
2. 首次保存问题和答案。
3. 答案不以明文存储，并能用 scrypt 校验。
4. 正确/错误答案验证。
5. 使用错误旧答案修改时返回 `UNAUTHORIZED`。
6. 使用正确旧答案修改成功，旧答案立即失效，新答案生效。
7. 使用错误密码重置时返回 `UNAUTHORIZED`。
8. 使用当前密码重置成功，安全问题和哈希都清空。
9. 未登录访问 `get`、`verify`、`reset` 均被保护过程拒绝。

测试结果：

```text
server/security-settings.test.ts: 2 passed
相关认证/社交/前端交互测试: 71 passed
pnpm check: passed
```

未使用生产账号执行修改或重置，因此没有改变任何线上用户安全设置。线上未登录 `security.get` 已验证返回 HTTP 401；带测试标记的每日一句也已验证不再返回。
