# 真实数据闭环审计报告

日期：2026-10-22

## 结论摘要

当前项目的大部分核心页面已经接入真实 tRPC/数据库流程，但仍有三个生产可见的高优先级断点：

1. `/public-mailbox` 完全使用前端初始化数组，公开信件和星星互动都不会读取或写入数据库。
2. `Upgrade.tsx` 和 `MembershipComparison.tsx` 是遗留演示流程，按钮只跳转到信箱，未发起 PayPal 订阅，也没有读取当前会员状态。
3. `server/membership-limits.ts` 中的回信配额、收藏数量和写信冷却仍返回固定示例值，而且该模块未被生产业务路由调用，实际会员限制和这份配置存在脱节风险。

## P0：必须优先修复

### 1. 公共信箱是前端假数据

文件：`client/src/pages/PublicMailbox.tsx`

证据：

- `letters` 使用 `useState` 初始化了 3 封固定信件；
- 固定内容包括“今天又是一个人在办公室里……”等文字；
- 固定星星数为 234、456、189；
- 点星只通过 `setLetters` 修改本地状态；
- 页面没有调用 `trpc.social.publicLetters.list`、`stars.add` 或 `stars.remove`。

后端已经具备可复用能力：

- `socialCompleteRouter.publicLetters.list`
- `socialCompleteRouter.publicLetters.publish`
- `socialCompleteRouter.publicLetters.unpublish`
- `socialCompleteRouter.stars.add`
- `socialCompleteRouter.stars.remove`
- `socialCompleteRouter.stars.check`

建议下一步：

- 用 `trpc.social.publicLetters.list.useQuery` 替换本地 `letters` 初始数组；
- 将 `recent/popular` 映射为页面的 `latest/mostShared`；
- 将后端 `excerpt`、`emotionTags`、`starCount`、`createdAt` 映射为前端模型；
- 点星调用真实 mutation，并在成功后 invalidate 公共信箱查询；
- 未登录用户只允许浏览，点击星星时跳转登录；
- 后端 `list.total` 当前等于当前页 `results.length`，建议改为数据库 `COUNT(*)`，否则分页总数不准确。

### 2. 独立升级页是假流程

文件：`client/src/pages/Upgrade.tsx`

证据：

- `handleUpgrade` 中真实 tRPC 调用被注释掉；
- `handleDowngrade` 中真实 tRPC 调用也被注释掉；
- 两个操作最终都直接 `navigate('/mailbox')`；
- `MembershipComparison` 的 `currentTier` 被固定传为 `free`；
- 会员价格、权益和收藏数量在组件内静态写死。

注意：当前用户从 `Profile.tsx` 进入的是 `UpgradePromptDialog`，该对话框已经接入 PayPal 流程；但 `Upgrade.tsx` 仍是遗留组件，未来如果增加路由或从其他入口打开，会造成“点击升级但没有支付”的严重问题。

建议下一步：

- 如果不再使用，删除独立升级页和遗留 `MembershipComparison`；
- 如果保留，改为复用 `UpgradePromptDialog` 或抽取统一的 PayPal 订阅组件；
- 会员状态改由 `membership.getInfo` 读取，而不是固定 `free`；
- 禁止前端的 `membership.upgrade` 直接改变会员状态，继续保持服务端仅接受 PayPal 验证后的状态变更。

### 3. 会员限制模块仍是固定示例值

文件：`server/membership-limits.ts`

证据：

- `canSendReply` 固定 `sentToday = 0`；
- `canCollectLetter` 固定 `collected = 0`；
- `getWriteCooldown` 固定模拟“1分钟前写过信”；
- 文件中的注释明确写着“模拟查询数据库”和“示例值”；
- 搜索结果显示该模块只有测试引用，没有被生产路由调用。

这意味着当前会员限制存在两套逻辑：

- 真实写信流程使用 `reserveLetterQuota`，能够原子限制免费用户每日写信数；
- `membership-limits.ts` 仍保留旧的回信、收藏和冷却模型，但没有真实数据来源，也没有接入生产流程。

建议下一步：

- 先确认产品规则：限制的是“写信数”还是“AI 回信数”；
- 将每日使用量、收藏关系和最后写信时间统一落到数据库查询；
- 将检查逻辑接入真实 mutation，而不是只保留独立工具函数；
- 如果产品已经不需要这套旧规则，删除该模块及其仅验证固定值的测试，避免后续误接入。

## P1：真实数据存在，但仍有明显不完整或不一致

### 4. 个人中心的“情绪停留时长”没有数据字段

文件：`client/src/pages/Profile.tsx:399-403`

当前后端明确返回 `emotionalHours: null`，前端显示：`数据库暂无情绪停留时长字段`。

这不是伪造数据，但属于未闭环功能。建议二选一：

- 产品不需要此指标：删除该卡片，避免暴露半成品；
- 产品需要此指标：新增事件/会话模型，定义统计口径后再展示，不能用估算值冒充真实数据。

### 5. 会员价格和权益存在多处硬编码

发现位置包括：

- `Home.tsx`：`¥29`；
- `Upgrade.tsx`：`¥288/年`；
- `MembershipComparison.tsx`：`¥29/月`、`¥288/年`；
- `server/paypal.ts`：默认金额 `29.00`、`288.00`；
- `server/badge-config.ts`：仍写着标准会员 `¥15/月`、高级会员 `¥35/月`；
- 多语言文案中也重复了价格和权益。

目前 PayPal 配置和首页主流程使用的是 29/月、288/年，但 `badge-config.ts` 的 15/月、35/月明显是旧配置，存在展示错价风险。

建议：

- 建立唯一的会员产品配置源；
- 前端通过公开配置接口读取展示价格和权益；
- PayPal 计划 ID、金额、币种和展示文案使用同一份配置；
- 清理 `badge-config.ts` 中过期价格描述。

### 6. 报告页已改为真实数据，但数据口径需要继续统一

文件：`client/src/pages/Report.tsx`、`server/routers.ts`

目前已使用真实的：

- 今日情绪聚合；
- 最近 7 天趋势；
- 最近 30 天关键词。

需要后续确认：

- 情绪分数到底表示强度还是正负价值；
- 报告页、个人中心、后台统计是否使用同一张 `letters`/`emotions` 数据口径；
- 异步分析尚未完成时，前端是否显示“分析中”而不是直接当作无数据。

## P2：合理的静态数据，不应误判为占位

以下静态内容属于产品定义或视觉配置，不是业务假数据：

- `Write.tsx` 的情绪标签和信纸主题；
- `TimeCapsule.tsx` 的分类、心情选项和日期快捷选项；
- `EmotionPlanet.tsx` 的星星布局坐标和颜色；
- `AdminEmotions.tsx` 的图表颜色和时间范围按钮；
- `Home.tsx` 的视觉背景星星；
- 空状态文案，如“暂无操作日志”“没有情绪数据”。

`ComponentShowcase.tsx` 是组件演示页，其中存在明确的 `demo response`，但当前没有在 `App.tsx` 注册生产路由，不属于线上业务数据闭环问题。

## 推荐实施顺序

1. 先修复 `PublicMailbox.tsx`：接通列表、分页、排序、星星查询和 mutation。
2. 清理或重构 `Upgrade.tsx`：杜绝遗留支付假流程，并统一会员价格源。
3. 决定 `membership-limits.ts` 的去留；如果保留，就接入真实使用量表和业务 mutation。
4. 清理会员价格重复配置，修复 `badge-config.ts` 的过期价格。
5. 删除或正式建模 `emotionalHours`，避免个人中心长期显示半成品指标。
6. 为公共信箱、升级流程和会员限制补充真实数据库集成测试。
