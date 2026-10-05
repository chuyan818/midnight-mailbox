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
- **PostgreSQL** >= 14（Railway PostgreSQL 18 可用）
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
DATABASE_URL=postgresql://user:password@localhost:5432/midnight_mailbox
# Railway 中，应用服务与 Postgres 必须位于同一 Project 和 Environment，
# 并在应用服务 Variables 中引用 Postgres 服务生成的连接串：
# DATABASE_URL=${{Postgres.DATABASE_URL}}
# 如果应用和数据库不在同一 Project/Environment，postgres.railway.internal
# 无法解析；请使用 Postgres 服务面板显示的公开连接串变量（通常为
# DATABASE_PUBLIC_URL），或将两个服务移动到同一 Project/Environment。
# 不要把实际密码提交到代码仓库。

# OAuth配置（Manus）
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://www.shenye.xin
JWT_SECRET=your_jwt_secret

# LLM配置：阿里云百炼通义千问（OpenAI兼容接口）
QWEN_API_KEY=your_dashscope_api_key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
# 也兼容使用 DASHSCOPE_API_KEY 作为 QWEN_API_KEY 的别名。
# 海外地域可使用：https://dashscope-intl.aliyuncs.com/compatible-mode/v1

# 可选：Manus 内置 LLM（未配置时自动回退到 Qwen）
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im



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
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 或使用webdev_execute_sql执行SQL文件
# 参考 drizzle-pg/ 目录中的 PostgreSQL SQL 文件
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
NODE_ENV=production node dist/server.js
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
    script: './dist/server.js',
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
    location /api/paypal/webhook {
        proxy_pass http://midnight_mailbox;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 支付系统配置

### PayPal 配置

1. 在 PayPal Developer Dashboard 创建 Sandbox 或 Live 应用。
2. 创建订阅 Plan，并配置以下环境变量：
   ```bash
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_PLAN_ID=your_paypal_plan_id
   PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
   ```
3. Webhook 地址：`https://your-domain.com/api/paypal/webhook`。
4. 订阅成功、取消和付款失败均由 Webhook 同步到会员状态和交易历史。

### 生产环境切换

将 `PAYPAL_ENV` 改为 `live`，替换 Live Client ID、Secret、Plan ID 和 Webhook ID，然后重新部署应用。

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败
```
错误: Failed to connect to database
解决:
- 检查DATABASE_URL格式是否正确
- 确认PostgreSQL服务已启动
- 验证用户名和密码
- 检查防火墙规则
```

#### 1.1 `getaddrinfo ENOTFOUND postgres.railway.internal`
```
原因：应用拿到了 Railway 私有网络地址，但当前应用容器不在该 Postgres
服务所属的同一 Project/Environment，或两个服务尚未建立连接。

修复步骤：
1. 打开 Railway 应用服务，确认 Project 和 Environment 与 Postgres 服务完全一致。
2. 在应用服务 Variables 中删除手写的 DATABASE_URL。
3. 通过 Add Variable Reference 选择 Postgres 服务的 DATABASE_URL，结果应为：
   DATABASE_URL=${{Postgres.DATABASE_URL}}
4. 如果应用必须跨 Project/Environment 连接数据库，改用 Postgres 服务面板提供的
   公开连接串（通常是 DATABASE_PUBLIC_URL），不要使用 postgres.railway.internal。
5. 重新部署应用；启动日志应先出现 `pnpm db:migrate` 成功，再启动 `dist/server.js`。
```

不要把本地电脑的 `127.0.0.1` 或 `localhost` 写入 Railway 的 DATABASE_URL，
因为它们指向 Railway 应用容器自身，而不是你的本地 PostgreSQL。

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

#### 4. PayPal Webhook未收到
```
错误: Webhook not received
解决:
- 确认 /api/paypal/webhook 地址正确
- 检查 PAYPAL_WEBHOOK_ID 是否正确
- 确认 PAYPAL_ENV 与 PayPal 应用环境一致
- 查看 PayPal Developer Dashboard 的 Webhook 日志
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
