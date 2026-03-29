# 深夜信箱 - Stripe支付系统设计文档

## 1. 支付系统架构

### 1.1 支付流程

```
用户选择会员类型 → 创建Checkout Session → 跳转到Stripe支付页面 → 支付完成 → Webhook回调 → 更新会员状态
```

### 1.2 核心组件

| 组件 | 职责 |
|------|------|
| **前端支付页面** | 显示会员选项，触发支付流程 |
| **后端Checkout API** | 创建Stripe Checkout Session |
| **Webhook处理器** | 接收Stripe事件，更新数据库 |
| **会员管理** | 维护会员状态和有效期 |

## 2. 会员套餐设计

### 2.1 套餐对比

| 功能 | 免费版 | 月会员 | 年会员 |
|------|--------|--------|--------|
| **每日写信限制** | 1封 | 无限 | 无限 |
| **情绪报告** | 基础版 | 完整版 | 完整版 |
| **关键词分析** | 有 | 有 | 有 |
| **AI回信** | 有 | 有 | 有 |
| **价格** | 免费 | ¥29/月 | ¥288/年 |
| **续费** | - | 自动续费 | 自动续费 |

### 2.2 Stripe产品配置

```javascript
// 月会员
Product: "Midnight Mailbox Monthly"
Price: 2900 (¥29.00)
Recurring: monthly
Currency: cny

// 年会员
Product: "Midnight Mailbox Yearly"
Price: 28800 (¥288.00)
Recurring: yearly
Currency: cny
```

## 3. 数据库表设计

### 3.1 订阅记录表 (subscription_records)

```sql
CREATE TABLE subscription_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  stripeCustomerId VARCHAR(255) UNIQUE,
  stripeSubscriptionId VARCHAR(255) UNIQUE,
  stripePriceId VARCHAR(255),
  status VARCHAR(50), -- active, past_due, canceled, unpaid
  currentPeriodStart TIMESTAMP,
  currentPeriodEnd TIMESTAMP,
  canceledAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (stripeCustomerId),
  INDEX (stripeSubscriptionId)
);
```

### 3.2 支付事件日志表 (payment_events)

```sql
CREATE TABLE payment_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  eventType VARCHAR(100), -- charge.succeeded, invoice.payment_succeeded, customer.subscription.updated, etc
  stripeEventId VARCHAR(255) UNIQUE,
  stripeObjectId VARCHAR(255),
  amount INT, -- 金额（分）
  currency VARCHAR(10),
  status VARCHAR(50),
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (stripeEventId),
  INDEX (eventType)
);
```

## 4. API设计

### 4.1 创建Checkout Session

**端点**: `POST /api/trpc/subscription.createCheckoutSession`

**请求参数**:
```typescript
{
  type: "monthly" | "yearly"
}
```

**响应**:
```typescript
{
  sessionId: string,
  url: string // 跳转到Stripe Checkout的URL
}
```

**业务逻辑**:
1. 获取当前用户信息
2. 检查用户是否已有活跃订阅
3. 获取对应的Stripe Price ID
4. 创建Checkout Session
5. 返回session ID和checkout URL

### 4.2 Webhook处理

**端点**: `POST /api/webhook/stripe`

**支持的事件**:
- `checkout.session.completed` - 支付完成
- `customer.subscription.updated` - 订阅更新
- `customer.subscription.deleted` - 订阅取消
- `invoice.payment_succeeded` - 发票支付成功
- `invoice.payment_failed` - 发票支付失败

**处理流程**:
1. 验证Webhook签名
2. 获取事件类型
3. 根据事件类型更新数据库
4. 返回200确认接收

### 4.3 获取订阅信息

**端点**: `GET /api/trpc/subscription.getInfo`

**响应**:
```typescript
{
  subscriptionId: string,
  status: "active" | "past_due" | "canceled" | "unpaid",
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  canceledAt: Date | null,
  priceId: string,
  planType: "monthly" | "yearly"
}
```

### 4.4 取消订阅

**端点**: `POST /api/trpc/subscription.cancel`

**响应**:
```typescript
{
  success: boolean,
  message: string
}
```

**业务逻辑**:
1. 获取用户的活跃订阅
2. 调用Stripe API取消订阅
3. 更新数据库状态
4. 将用户降级为免费版

## 5. 前端支付页面设计

### 5.1 支付选项展示

```typescript
// 会员套餐卡片
interface MembershipCard {
  type: "monthly" | "yearly",
  name: string,
  price: number,
  features: string[],
  isPopular: boolean,
  onSubscribe: () => void
}
```

### 5.2 支付流程

1. **选择套餐** - 用户点击"升级"按钮
2. **创建Session** - 调用 `subscription.createCheckoutSession`
3. **跳转支付** - 重定向到Stripe Checkout
4. **支付完成** - Stripe返回到success_url
5. **更新状态** - 前端查询会员信息，更新UI

### 5.3 支付状态处理

```typescript
// 支付成功
if (sessionId === urlParams.get('session_id')) {
  // 等待Webhook更新数据库（通常1-2秒）
  // 轮询获取会员信息
  const membership = await trpc.membership.getInfo.useQuery();
  if (membership.membershipType !== 'free') {
    // 显示成功提示
    toast.success('升级成功！');
  }
}

// 支付取消
if (urlParams.get('canceled') === 'true') {
  toast.info('支付已取消');
}
```

## 6. 安全考虑

### 6.1 Webhook安全

- ✅ 验证Webhook签名（使用Stripe密钥）
- ✅ 验证事件时间戳（防止重放攻击）
- ✅ 幂等性处理（相同事件多次处理不会重复计费）
- ✅ 记录所有支付事件用于审计

### 6.2 会员权限验证

- ✅ 每次API调用都检查会员状态
- ✅ 检查会员有效期
- ✅ 验证用户身份

### 6.3 数据保护

- ✅ 不存储信用卡信息（由Stripe处理）
- ✅ 使用HTTPS加密传输
- ✅ 敏感信息加密存储

## 7. 错误处理

### 7.1 常见错误场景

| 场景 | 处理方式 |
|------|---------|
| 网络超时 | 重试3次，间隔2秒 |
| Stripe API错误 | 记录日志，返回友好错误提示 |
| Webhook失败 | 重试机制（Stripe自动处理） |
| 支付失败 | 显示失败原因，提示重试 |

### 7.2 错误日志

```typescript
{
  timestamp: Date,
  userId: number,
  eventType: string,
  error: string,
  stripeError?: object,
  context: object
}
```

## 8. 测试计划

### 8.1 单元测试

- [ ] 创建Checkout Session
- [ ] Webhook事件处理
- [ ] 会员状态更新
- [ ] 订阅取消

### 8.2 集成测试

- [ ] 完整支付流程（使用Stripe测试卡）
- [ ] Webhook回调验证
- [ ] 数据库状态一致性

### 8.3 Stripe测试卡

```
成功: 4242 4242 4242 4242
失败: 4000 0000 0000 0002
需要认证: 4000 0025 0000 3155
```

## 9. 部署检查清单

- [ ] Stripe账户配置完成
- [ ] API密钥已配置到环境变量
- [ ] Webhook端点已配置
- [ ] 数据库迁移已执行
- [ ] 支付页面已测试
- [ ] 错误处理已验证
- [ ] 监控告警已设置

## 10. 后续优化

### 10.1 短期优化

- 支持多种支付方式（微信、支付宝）
- 发票管理功能
- 支付失败自动重试

### 10.2 长期优化

- 优惠券系统
- 团队订阅
- 企业级支付方案
- 支付分析仪表板
