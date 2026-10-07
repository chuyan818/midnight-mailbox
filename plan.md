# 深夜信箱：永久网站实施计划

## 目标与范围

将现有 `chuyan818/midnight-mailbox` React + Express + tRPC + Drizzle/PostgreSQL 应用接入 Manus 托管网站项目，保持现有 Railway 生产站可用，并让 Manus Preview 与发布环境具备同等的真实后端能力。保留并验证 Google OAuth、邮箱验证码注册、AI 温暖回信、情绪分析、会员与 PayPal、时间胶囊、公共信箱、情绪星球、管理后台和移动端分享能力。

本次 AI 变更使用阿里云百炼通义千问的 OpenAI 兼容接口：普通回信走 `qwen3.7-plus`，情绪分析和语言识别走 `qwen3.8-flash`，长信件或明确高风险表达的回信升级到 `qwen3.8-max`，安全审核走 `qwen3.7-plus`；未配置或调用失败时回退到现有 Manus/OpenAI 兼容路径。API Key 仅作为服务端运行时 Secret，不进入浏览器构建产物。

## 设计方向

- **Design Movement：** 深夜书信与低饱和星夜（Nocturnal Epistolary），把产品做成安静、可信、可停留的数字信箱，而不是高刺激的社交信息流。
- **Core Principles：** 情绪先于功能；克制而清晰；私密数据有边界；每一步都给用户可逆的选择。
- **Color Philosophy：** 深靛蓝作为夜色与安全感，暖米白作为纸张与阅读底色，琥珀金只用于被看见的行动和希望，不用高饱和色制造焦虑。
- **Layout Paradigm：** 以“信纸纵向阅读流”为核心，公共内容采用错落的信笺层叠，个人中心和管理后台使用清晰的侧栏工作台；避免把所有内容压缩成等宽卡片网格。
- **Signature Elements：** 邮戳/信封角标、细线星轨、纸张边缘与轻微颗粒质感；分享海报沿用信纸比例和二维码留白。
- **Interaction Philosophy：** 写信、发送、打开胶囊和分享都先给即时反馈，再进行异步处理；表单错误靠近输入框解释，危险内容引导现实世界求助而非制造依赖。
- **Animation：** 页面切换使用 180–260ms 的淡入和轻微上移；信件展开像纸张落下，星轨以低频呼吸动画存在；尊重 `prefers-reduced-motion`，不使用持续闪烁。
- **Typography System：** 中文正文使用系统无衬线与可读字重，标题使用温和的高对比衬线/宋体风格；英文标题使用 Fraunces 或 Georgia 类衬线，正文使用 Inter/system sans；正文行高 1.7 左右。
- **Brand Essence：** 给不想在白天解释自己的人，一个能被认真读完的深夜信箱；气质是安静、温柔、可靠。
- **Brand Voice：** 标题不喊口号，CTA 不催促。示例：“把今晚的心事，交给一盏不催你的灯。”“写下就好，不必先想清楚。”
- **Wordmark & Logo：** “深夜信箱”字标旁使用一枚半开信封与单颗星点组成的邮戳标记，星点嵌入信封折角，不使用默认文字 Logo。
- **Signature Brand Color：** `#E9B86A` 暖琥珀邮戳色，用于主要行动、焦点和分享海报识别。

## 实施结构

- `client/src/`：保留现有 React 路由、主题系统、写信编辑器、信件详情、分享海报、时间胶囊、个人中心和管理后台。
- `server/_core/`：Express 启动、健康检查、tRPC、OAuth 与静态资源服务。
- `server/routers/` 与 `server/routers.ts`：业务 API、权限和管理员 API。
- `server/prompts/` 与 `server/openai.ts`：千问模型路由、深夜信箱温暖回信 System Prompt 和安全边界。
- `server/db.ts`、`drizzle/`、`drizzle-pg/`：PostgreSQL 数据访问与可重复迁移。
- `public/manus-routes.json`：声明所有页面路由，不包含 API、静态资源和系统路径。
- `Dockerfile`：安装、构建和运行生产容器；运行时读取 `DATABASE_URL`、SMTP、OAuth、PayPal 和 Qwen Secret。

## 托管与发布

1. 使用现有托管项目的 canonical `main`，先同步最新 GitHub 主分支代码和本次千问变更。
2. 保持 `features.server: true`；由于现有应用依赖 Railway PostgreSQL，托管项目不启用托管 MySQL，使用受保护的外部 `MIDNIGHT_DATABASE_URL`，避免把现有生产数据迁移到另一套空数据库。应用仍兼容本地或 Railway 的 `DATABASE_URL` 回退。
3. 注册 TypeScript post-edit 诊断；修复真实源文件诊断后再启动 Preview。
4. 配置容器部署和 `/api/health` 未认证健康路径，确保 `PORT` 可被平台覆盖并监听 `0.0.0.0`。
5. 配置 API/server 路由优先于前端静态 SPA 路由，发布后验证健康接口、首页、登录/注册、写信和信件详情。
6. 使用受保护的 Secret 输入配置 Qwen、SMTP、Google OAuth、PayPal、JWT 和外部数据库连接；不在计划、日志或前端输出中记录值。
7. 运行 `pnpm check`、相关 Vitest 和 `pnpm build`，提交 canonical checkpoint，再执行一次显式发布；发布成功后以实际永久 URL 为准。

## 必须保留的行为

- Google OAuth 登录完成后进入 `/profile`，退出登录回到登录页。
- 邮箱验证码注册在 SMTP 配置后可完整发送、校验并创建账户。
- 写信后异步生成情绪分析与 AI 回信，失败时保留可读的降级回复。
- 分享面板支持 X、微信、LINE、KakaoTalk、Instagram、WhatsApp、Facebook，提供平台引导、海报预览、二维码和 Web Share 文件分享。
- 时间胶囊使用真实 tRPC 创建、删除、打开接口，打开日期不可早于明天，支持分类、心情、筛选、排序和统计图表。
