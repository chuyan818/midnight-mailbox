# 深夜信箱 - 用户交互流程指南

## 概述

本文档描述了深夜信箱各个功能板块之间的交互流程和数据流动。通过理解这些流程，可以确保用户在不同页面之间的无缝切换和数据的正确传递。

## 核心交互流程

### 1. 首页 (Home) → 写信页面 (Write)

**流程说明：**
- 用户在首页点击"开始写信"按钮
- 导航到 `/write` 路由
- 如果用户未登录，应重定向到登录页面

**涉及的文件：**
- `client/src/pages/Home.tsx` - 首页，包含导航按钮
- `client/src/pages/Write.tsx` - 写信页面
- `client/src/App.tsx` - 路由配置

**需要实现的链接：**
```typescript
// 在Home.tsx中
const handleStartWriting = () => {
  if (!isAuthenticated) {
    navigate('/login');
  } else {
    navigate('/write');
  }
};
```

### 2. 写信页面 (Write) → AI回信页面 (Letter)

**流程说明：**
- 用户在写信页面输入内容并选择信纸
- 点击发送按钮
- 后端处理请求，调用LLM生成回信
- 返回信件ID，导航到 `/letter/:id`
- 显示AI生成的回信内容

**数据流动：**
```
用户输入 → 发送请求 → 后端处理 → LLM生成回信 → 保存到数据库 → 返回信件ID → 导航到Letter页面
```

**涉及的文件：**
- `client/src/pages/Write.tsx` - 写信页面
- `client/src/pages/Letter.tsx` - 回信展示页面
- `server/routers.ts` - 后端API路由
- `server/db.ts` - 数据库操作

**需要实现的链接：**
```typescript
// 在Write.tsx中
const handleSendLetter = async (content: string, paperType: string) => {
  try {
    const result = await trpc.letters.create.useMutation({
      content,
      paperType,
    });
    
    // 导航到回信页面
    navigate(`/letter/${result.id}`);
  } catch (error) {
    toast.error('发送失败');
  }
};
```

### 3. AI回信页面 (Letter) → 情绪报告页面 (Report)

**流程说明：**
- 用户查看AI回信内容
- 点击"查看情绪报告"按钮
- 导航到 `/report` 路由
- 显示该信件相关的情绪分析数据

**数据流动：**
```
Letter页面 → 获取当前信件ID → 查询关联的情绪数据 → Report页面展示
```

**涉及的文件：**
- `client/src/pages/Letter.tsx` - 回信展示页面
- `client/src/pages/Report.tsx` - 情绪报告页面
- `server/routers.ts` - 后端API路由

**需要实现的链接：**
```typescript
// 在Letter.tsx中
const handleViewReport = () => {
  // 可以通过URL参数传递信件ID
  navigate(`/report?letterId=${letterId}`);
};
```

### 4. 情绪报告页面 (Report) → 我的信箱 (Mailbox)

**流程说明：**
- 用户查看情绪报告
- 点击"返回信箱"按钮
- 导航到 `/mailbox` 路由
- 显示用户的所有信件列表

**涉及的文件：**
- `client/src/pages/Report.tsx` - 情绪报告页面
- `client/src/pages/Mailbox.tsx` - 我的信箱页面

**需要实现的链接：**
```typescript
// 在Report.tsx中
const handleBackToMailbox = () => {
  navigate('/mailbox');
};
```

### 5. 我的信箱 (Mailbox) → 个人中心 (Profile)

**流程说明：**
- 用户在信箱页面点击个人头像或"个人中心"按钮
- 导航到 `/profile` 路由
- 显示用户的会员信息、账户设置等

**涉及的文件：**
- `client/src/pages/Mailbox.tsx` - 我的信箱页面
- `client/src/pages/Profile.tsx` - 个人中心页面

### 6. 个人中心 (Profile) → 优先客服支持 (PremiumSupport)

**流程说明：**
- 高级会员在个人中心点击"优先客服"按钮
- 导航到 `/premium-support` 路由
- 显示客服支持信息和联系表单

**涉及的文件：**
- `client/src/pages/Profile.tsx` - 个人中心页面
- `client/src/pages/PremiumSupport.tsx` - 优先客服支持页面

**需要实现的链接：**
```typescript
// 在Profile.tsx中
{currentType !== "free" && (
  <Button onClick={() => navigate("/premium-support")}>
    <Zap className="w-4 h-4 mr-2" />
    优先客服
  </Button>
)}
```

### 7. 会员权限检查与功能限制

**流程说明：**
- 用户尝试执行某个操作（如发送信件、收藏信件）
- 系统检查用户的会员等级
- 根据会员权限决定是否允许操作
- 如果不允许，显示升级提示

**涉及的文件：**
- `server/membership-limits.ts` - 会员功能限制逻辑
- `server/routers.ts` - 后端API路由
- `client/src/pages/Write.tsx` - 写信页面
- `client/src/pages/Mailbox.tsx` - 我的信箱页面

**需要实现的链接：**
```typescript
// 在Write.tsx中
const handleSendLetter = async (content: string) => {
  // 检查会员权限
  const canSend = await trpc.membership.canSendReply.useQuery();
  
  if (!canSend.allowed) {
    toast.error(canSend.reason);
    navigate('/profile?tab=upgrade');
    return;
  }
  
  // 继续发送信件
  await sendLetter(content);
};
```

## 页面导航关系图

```
Home (首页)
├── /write → Write (写信)
│   ├── /letter/:id → Letter (回信)
│   │   ├── /report → Report (报告)
│   │   │   └── /mailbox → Mailbox (信箱)
│   │   └── /mailbox → Mailbox (信箱)
│   └── /mailbox → Mailbox (信箱)
│
├── /login → Login (登录)
├── /register → Register (注册)
├── /profile → Profile (个人中心)
│   ├── /premium-support → PremiumSupport (客服)
│   └── /membership → 升级会员
│
├── /mailbox → Mailbox (我的信箱)
├── /public-mailbox → PublicMailbox (公共信箱)
├── /daily-quote → DailyQuote (每日一句)
├── /time-capsule → TimeCapsule (时间胶囊)
└── /emotion-planet → EmotionPlanet (情绪星球)
```

## 状态管理和数据流

### 全局状态

**用户认证状态：**
- 存储在 `useAuth()` hook中
- 包含：用户ID、邮箱、名称、会员等级等
- 在路由保护中使用

**会员信息：**
- 存储在用户数据中
- 用于权限检查和功能限制
- 在Profile页面中展示

**当前信件信息：**
- 在Letter页面中维护
- 用于关联情绪数据
- 用于导航到Report页面

### 数据查询流程

```
用户操作
  ↓
调用tRPC过程
  ↓
后端验证权限
  ↓
执行业务逻辑
  ↓
保存到数据库
  ↓
返回结果到前端
  ↓
更新UI状态
  ↓
导航到下一页面
```

## 实现清单

### 第一步：导航链接实现
- [ ] Home → Write 链接
- [ ] Write → Letter 链接
- [ ] Letter → Report 链接
- [ ] Report → Mailbox 链接
- [ ] Mailbox → Profile 链接
- [ ] Profile → PremiumSupport 链接

### 第二步：权限检查集成
- [ ] 在Write页面检查发送权限
- [ ] 在Mailbox页面检查收藏权限
- [ ] 在Profile页面检查会员权限
- [ ] 在PremiumSupport页面检查高级会员权限

### 第三步：数据流动实现
- [ ] Letter页面获取信件详情
- [ ] Report页面获取情绪数据
- [ ] Mailbox页面获取信件列表
- [ ] Profile页面获取会员信息

### 第四步：错误处理
- [ ] 处理未登录用户的导航
- [ ] 处理权限不足的情况
- [ ] 处理API请求失败
- [ ] 处理数据不存在的情况

### 第五步：测试
- [ ] 完整用户流程测试
- [ ] 权限检查测试
- [ ] 数据流动测试
- [ ] 错误处理测试

## 关键实现要点

### 1. 路由保护

```typescript
// 需要在路由级别添加认证检查
const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Component {...rest} /> : <Navigate to="/login" />;
};
```

### 2. 数据传递

```typescript
// 通过URL参数传递数据
navigate(`/letter/${letterId}`);

// 通过查询参数传递选项
navigate(`/report?letterId=${letterId}&type=emotion`);
```

### 3. 权限检查

```typescript
// 在操作前检查权限
const result = await checkMembershipPermission(action);
if (!result.allowed) {
  showUpgradePrompt();
  return;
}
```

### 4. 加载状态管理

```typescript
// 在数据加载时显示加载状态
const { data, isLoading } = trpc.letters.getById.useQuery(letterId);

if (isLoading) return <LoadingSpinner />;
if (!data) return <ErrorMessage />;

return <LetterContent data={data} />;
```

## 后续优化方向

1. **状态缓存** - 使用React Query缓存常用数据
2. **预加载** - 在用户可能导航到某个页面时预加载数据
3. **动画过渡** - 添加页面切换动画
4. **深度链接** - 支持直接访问特定页面
5. **历史记录** - 记录用户的浏览历史
6. **快捷键** - 添加键盘快捷键导航
