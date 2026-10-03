# 深夜信箱（Midnight Mailbox）部署指南

## 📋 目录
1. [系统要求](#系统要求)
2. [环境配置](#环境配置)
3. [本地开发](#本地开发)
4. [生产部署](#生产部署)
5. [支付系统配置](#支付系统配置)
6. [故障排查](#故障排查)

---

## 系统要求

### 必需环境
- **Node.js** >= 18.0.0
- **npm/pnpm** >= 8.0.0
- **MySQL** >= 8.0 或 TiDB
- **Git** >= 2.20

### 推荐配置
- **CPU**: 2核或以上
- **内存**: 2GB或以上
- **存储**: 10GB或以上
- **带宽**: 5Mbps或以上

---

## 环境配置

### 1. 克隆项目
```bash
git clone <repository-url>
cd midnight-mailbox
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境变量配置

创建 `.env.local` 文件（开发环境）或 `.env.production` 文件（生产环境）：

```bash
# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/midnight_mailbox

# OAuth配置（Manus）
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://www.shenye.xin
JWT_SECRET=your_jwt_secret

# LLM配置
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# OpenAI配置（可选，作为备用方案）
OPENAI_API_KEY=your_openai_api_key

# Stripe配置
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# 应用配置
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
VITE_APP_TITLE=深夜信箱
VITE_APP_LOGO=https://your-cdn.com/logo.png

# 分析配置
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

### 4. 数据库初始化

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate

# 或使用webdev_execute_sql执行SQL文件
# 参考 drizzle/ 目录中的SQL文件
```

---

## 本地开发

### 启动开发服务器
```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动

### 构建项目
```bash
pnpm build
```

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test -- server/emotion.test.ts

# 观察模式
pnpm test -- --watch
```

### 代码检查
```bash
# TypeScript检查
pnpm check

# 代码格式化
pnpm format
```

---

## 生产部署

### 1. 构建应用
```bash
pnpm build
```

### 2. 启动生产服务器
```bash
NODE_ENV=production node dist/index.js
```

### 3. 使用PM2进程管理（推荐）

安装PM2：
```bash
npm install -g pm2
```

创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'midnight-mailbox',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

启动应用：
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx反向代理配置

```nginx
upstream midnight_mailbox {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # 代理配置
    location / {
        proxy_pass http://midnight_mailbox;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Webhook端点（不缓存）
    location /api/stripe/webhook {
        proxy_pass http://midnight_mailbox;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 支付系统配置

### Stripe沙箱配置

1. **声明Stripe沙箱**
   - 访问: https://dashboard.stripe.com/claim_sandbox/[YOUR_SANDBOX_URL]
   - 完成身份验证

2. **获取API密钥**
   - 登录Stripe Dashboard
   - 进入Settings → API Keys
   - 复制Secret Key和Publishable Key

3. **配置Webhook**
   - 进入Developers → Webhooks
   - 添加端点: `https://your-domain.com/api/stripe/webhook`
   - 选择事件:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - 复制Signing Secret

4. **测试支付**
   - 使用测试卡号: `4242 4242 4242 4242`
   - 任意未来日期和CVC
   - 验证订阅流程

### 生产环境切换

1. 完成Stripe KYC验证
2. 获取生产环境API密钥
3. 更新环境变量:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```
4. 重新部署应用

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败
```
错误: Failed to connect to database
解决:
- 检查DATABASE_URL格式是否正确
- 确认MySQL服务已启动
- 验证用户名和密码
- 检查防火墙规则
```

#### 2. OAuth登录失败
```
错误: Invalid OAuth configuration
解决:
- 确认VITE_APP_ID正确
- 检查OAUTH_SERVER_URL是否可访问
- 验证回调URL配置
- 检查JWT_SECRET是否设置
```

#### 3. LLM API调用失败
```
错误: LLM service unavailable
解决:
- 检查BUILT_IN_FORGE_API_KEY是否有效
- 验证API端点是否可访问
- 查看系统日志获取详细错误信息
- 如果Manus LLM失败，系统会自动降级到OpenAI
```

#### 4. Stripe Webhook未收到
```
错误: Webhook not received
解决:
- 确认Webhook URL正确
- 检查STRIPE_WEBHOOK_SECRET是否正确
- 验证防火墙允许Stripe IP访问
- 查看Stripe Dashboard的Webhook日志
- 确保应用已启动并可访问
```

#### 5. 性能问题
```
症状: 响应缓慢
解决:
- 检查数据库查询性能
- 启用查询缓存
- 检查内存使用情况
- 考虑增加服务器资源
- 使用CDN加速静态资源
```

### 日志查看

```bash
# 开发环境
pnpm dev

# 生产环境（PM2）
pm2 logs midnight-mailbox

# 查看特定日志
pm2 logs midnight-mailbox --lines 100

# 清空日志
pm2 flush
```

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 检查数据库连接
curl http://localhost:3000/api/db-health
```

---

## 监控和维护

### 定期备份
```bash
# 备份数据库
mysqldump -u user -p database_name > backup.sql

# 恢复数据库
mysql -u user -p database_name < backup.sql
```

### 性能监控
- 使用PM2 Plus进行实时监控
- 设置告警规则
- 定期检查日志

### 安全更新
```bash
# 检查依赖更新
pnpm outdated

# 更新依赖
pnpm update

# 审计安全漏洞
pnpm audit
```

---

## 支持和反馈

如有问题或建议，请：
1. 查看项目文档
2. 检查常见问题
3. 提交Issue或联系技术支持

---

**最后更新**: 2026-03-29
**版本**: 1.0.0
