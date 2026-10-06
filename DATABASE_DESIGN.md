# 深夜信箱（Midnight Mailbox）数据库设计文档 v1.0

## 一、数据库概述

### 1.1 数据库选择
- **数据库系统**：MySQL 8.0
- **连接方式**：Drizzle ORM
- **字符集**：utf8mb4（支持emoji和多语言）
- **排序规则**：utf8mb4_unicode_ci

### 1.2 设计原则
1. **规范化**：遵循第三范式（3NF），避免数据冗余
2. **性能**：合理使用索引，优化查询性能
3. **可扩展性**：预留扩展空间，支持未来功能
4. **数据完整性**：使用外键约束，确保数据一致性
5. **审计追踪**：记录创建时间和更新时间

---

## 二、核心表设计

### 2.1 用户表（users）

**表名**：`users`

**用途**：存储用户基本信息和认证数据

**字段设计**：

| 字段名 | 数据类型 | 长度 | 非空 | 唯一 | 索引 | 默认值 | 说明 |
|--------|---------|------|------|------|------|--------|------|
| id | INT | - | ✓ | ✓ | ✓ | AUTO_INCREMENT | 用户ID，主键 |
| openId | VARCHAR | 64 | ✓ | ✓ | ✓ | - | Manus OAuth ID，唯一标识 |
| name | VARCHAR | 255 | ✗ | ✗ | - | NULL | 用户昵称 |
| email | VARCHAR | 320 | ✗ | ✗ | ✓ | NULL | 用户邮箱 |
| loginMethod | VARCHAR | 64 | ✗ | ✗ | - | NULL | 登录方式（email/wechat/qq等） |
| role | ENUM | - | ✓ | ✗ | - | 'user' | 用户角色（user/admin） |
| createdAt | TIMESTAMP | - | ✓ | ✗ | ✓ | CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | - | ✓ | ✗ | - | CURRENT_TIMESTAMP | 更新时间 |
| lastSignedIn | TIMESTAMP | - | ✓ | ✗ | - | CURRENT_TIMESTAMP | 最后登录时间 |

**SQL定义**：
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_email (email),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2.2 信件表（letters）

**表名**：`letters`

**用途**：存储用户写的信件内容、情绪分析结果和AI回信

**字段设计**：

| 字段名 | 数据类型 | 长度 | 非空 | 唯一 | 索引 | 默认值 | 说明 |
|--------|---------|------|------|------|------|--------|------|
| id | INT | - | ✓ | ✓ | ✓ | AUTO_INCREMENT | 信件ID，主键 |
| userId | INT | - | ✓ | ✗ | ✓ | - | 用户ID，外键 |
| content | LONGTEXT | - | ✓ | ✗ | - | - | 信件内容（最多5000字） |
| backgroundType | VARCHAR | 50 | ✗ | ✗ | - | NULL | 信纸背景类型 |
| emotionScore | INT | - | ✗ | ✗ | ✓ | NULL | 情绪评分（0-100） |
| emotionType | VARCHAR | 50 | ✗ | ✗ | ✓ | NULL | 主要情绪类型 |
| keywords | JSON | - | ✗ | ✗ | - | NULL | 关键词数组 |
| reply | LONGTEXT | - | ✗ | ✗ | - | NULL | AI回信内容 |
| replyGeneratedAt | TIMESTAMP | - | ✗ | ✗ | - | NULL | 回信生成时间 |
| safetyFlag | BOOLEAN | - | ✓ | ✗ | ✓ | FALSE | 安全标记（是否检测到危险内容） |
| createdAt | TIMESTAMP | - | ✓ | ✗ | ✓ | CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | - | ✓ | ✗ | - | CURRENT_TIMESTAMP | 更新时间 |

**SQL定义**：
```sql
CREATE TABLE letters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  content LONGTEXT NOT NULL,
  backgroundType VARCHAR(50),
  emotionScore INT,
  emotionType VARCHAR(50),
  keywords JSON,
  reply LONGTEXT,
  replyGeneratedAt TIMESTAMP NULL,
  safetyFlag BOOLEAN DEFAULT FALSE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_emotionScore (emotionScore),
  INDEX idx_emotionType (emotionType),
  INDEX idx_userId_createdAt (userId, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**字段说明**：
- `backgroundType`：可选值为"星空漫漫"、"牛皮纸"、"樱花来信"、"秋日落信"、"节日灯火"
- `emotionScore`：0-30为低，31-60为中，61-100为高
- `emotionType`：可选值为"快乐"、"悲伤"、"焦虑"、"愤怒"、"孤独"、"迷茫"、"压力"、"思念"
- `keywords`：JSON数组，存储3-6个关键词，如`["工作", "压力", "截止日期"]`
- `safetyFlag`：TRUE表示检测到自我伤害、暴力等危险内容

---

### 2.3 情绪表（emotions）

**表名**：`emotions`

**用途**：存储每封信件的详细情绪分析数据（支持多情绪分析）

**字段设计**：

| 字段名 | 数据类型 | 长度 | 非空 | 唯一 | 索引 | 默认值 | 说明 |
|--------|---------|------|------|------|------|--------|------|
| id | INT | - | ✓ | ✓ | ✓ | AUTO_INCREMENT | 情绪记录ID，主键 |
| letterId | INT | - | ✓ | ✗ | ✓ | - | 信件ID，外键 |
| emotionType | VARCHAR | 50 | ✓ | ✗ | ✓ | - | 情绪类型 |
| emotionScore | INT | - | ✓ | ✗ | - | - | 情绪评分（0-100） |
| keywords | JSON | - | ✗ | ✗ | - | NULL | 该情绪相关的关键词 |
| createdAt | TIMESTAMP | - | ✓ | ✗ | ✓ | CURRENT_TIMESTAMP | 创建时间 |

**SQL定义**：
```sql
CREATE TABLE emotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  letterId INT NOT NULL,
  emotionType VARCHAR(50) NOT NULL,
  emotionScore INT NOT NULL,
  keywords JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (letterId) REFERENCES letters(id) ON DELETE CASCADE,
  INDEX idx_letterId (letterId),
  INDEX idx_emotionType (emotionType),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**设计说明**：
- 一封信件可能包含多种情绪，所以使用单独的表来存储
- 例如一封信件可能既有"焦虑"（评分75）又有"孤独"（评分60）

---

### 2.4 会员表（memberships）

**表名**：`memberships`

**用途**：存储用户的会员信息和订阅状态

**字段设计**：

| 字段名 | 数据类型 | 长度 | 非空 | 唯一 | 索引 | 默认值 | 说明 |
|--------|---------|------|------|------|------|--------|------|
| id | INT | - | ✓ | ✓ | ✓ | AUTO_INCREMENT | 会员记录ID，主键 |
| userId | INT | - | ✓ | ✓ | ✓ | - | 用户ID，外键，唯一关联 |
| membershipType | ENUM | - | ✓ | ✗ | ✓ | 'free' | 会员类型（free/monthly/yearly） |
| membershipExpiry | TIMESTAMP | - | ✗ | ✗ | ✓ | NULL | 会员到期时间 |
| stripeCustomerId | VARCHAR | 255 | ✗ | ✗ | - | NULL | Stripe客户ID |
| stripeSubscriptionId | VARCHAR | 255 | ✗ | ✗ | - | NULL | Stripe订阅ID |
| dailyLetterCount | INT | - | ✓ | ✗ | - | 0 | 当日写信次数 |
| lastLetterDate | DATE | - | ✗ | ✗ | - | NULL | 最后一次写信的日期 |
| createdAt | TIMESTAMP | - | ✓ | ✗ | - | CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | - | ✓ | ✗ | - | CURRENT_TIMESTAMP | 更新时间 |

**SQL定义**：
```sql
CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  membershipType ENUM('free', 'monthly', 'yearly') DEFAULT 'free' NOT NULL,
  membershipExpiry TIMESTAMP NULL,
  stripeCustomerId VARCHAR(255),
  stripeSubscriptionId VARCHAR(255),
  dailyLetterCount INT DEFAULT 0 NOT NULL,
  lastLetterDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_membershipType (membershipType),
  INDEX idx_membershipExpiry (membershipExpiry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**字段说明**：
- `dailyLetterCount`：每天午夜12点重置为0
- `lastLetterDate`：用于检查是否需要重置`dailyLetterCount`
- `membershipExpiry`：NULL表示永久有效（如年会员）

---

### 2.5 订阅记录表（subscription_records）

**表名**：`subscription_records`

**用途**：记录所有订阅交易，用于审计和分析

**字段设计**：

| 字段名 | 数据类型 | 长度 | 非空 | 唯一 | 索引 | 默认值 | 说明 |
|--------|---------|------|------|------|------|--------|------|
| id | INT | - | ✓ | ✓ | ✓ | AUTO_INCREMENT | 订阅记录ID，主键 |
| userId | INT | - | ✓ | ✗ | ✓ | - | 用户ID，外键 |
| membershipType | VARCHAR | 50 | ✓ | ✗ | ✓ | - | 订阅类型（monthly/yearly） |
| amount | DECIMAL | 10,2 | ✓ | ✗ | - | - | 订阅金额 |
| currency | VARCHAR | 3 | ✓ | ✗ | - | 'CNY' | 货币代码 |
| stripePaymentIntentId | VARCHAR | 255 | ✗ | ✓ | - | NULL | Stripe支付意图ID |
| status | VARCHAR | 50 | ✓ | ✗ | ✓ | - | 订阅状态（pending/success/failed） |
| createdAt | TIMESTAMP | - | ✓ | ✗ | ✓ | CURRENT_TIMESTAMP | 创建时间 |

**SQL定义**：
```sql
CREATE TABLE subscription_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  membershipType VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY' NOT NULL,
  stripePaymentIntentId VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 三、数据关系图（ER图）

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ openId (UNIQUE) │
│ name            │
│ email           │
│ loginMethod     │
│ role            │
│ createdAt       │
│ updatedAt       │
│ lastSignedIn    │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────▼────────────────┐
    │     letters         │
    ├─────────────────────┤
    │ id (PK)             │
    │ userId (FK)         │
    │ content             │
    │ backgroundType      │
    │ emotionScore        │
    │ emotionType         │
    │ keywords            │
    │ reply               │
    │ replyGeneratedAt    │
    │ safetyFlag          │
    │ createdAt           │
    │ updatedAt           │
    └────┬────────────────┘
         │
         │ 1:N
         │
    ┌────▼──────────────┐
    │    emotions       │
    ├───────────────────┤
    │ id (PK)           │
    │ letterId (FK)     │
    │ emotionType       │
    │ emotionScore      │
    │ keywords          │
    │ createdAt         │
    └───────────────────┘

┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
└────────┬────────┘
         │
         │ 1:1
         │
    ┌────▼──────────────────┐
    │   memberships         │
    ├───────────────────────┤
    │ id (PK)               │
    │ userId (FK, UNIQUE)   │
    │ membershipType        │
    │ membershipExpiry      │
    │ stripeCustomerId      │
    │ stripeSubscriptionId  │
    │ dailyLetterCount      │
    │ lastLetterDate        │
    │ createdAt             │
    │ updatedAt             │
    └───────────────────────┘

┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────▼──────────────────────┐
    │ subscription_records      │
    ├───────────────────────────┤
    │ id (PK)                   │
    │ userId (FK)               │
    │ membershipType            │
    │ amount                    │
    │ currency                  │
    │ stripePaymentIntentId     │
    │ status                    │
    │ createdAt                 │
    └───────────────────────────┘
```

---

## 四、索引策略

### 4.1 索引设计

| 表名 | 索引名 | 字段 | 类型 | 说明 |
|------|--------|------|------|------|
| users | PRIMARY | id | UNIQUE | 主键 |
| users | UNIQUE | openId | UNIQUE | OAuth ID唯一 |
| users | idx_email | email | NORMAL | 邮箱查询 |
| users | idx_createdAt | createdAt | NORMAL | 时间排序 |
| letters | PRIMARY | id | UNIQUE | 主键 |
| letters | FOREIGN | userId | NORMAL | 外键 |
| letters | idx_createdAt | createdAt | NORMAL | 时间排序 |
| letters | idx_emotionScore | emotionScore | NORMAL | 情绪评分查询 |
| letters | idx_emotionType | emotionType | NORMAL | 情绪类型查询 |
| letters | idx_userId_createdAt | userId, createdAt | COMPOSITE | 用户信件列表 |
| emotions | PRIMARY | id | UNIQUE | 主键 |
| emotions | FOREIGN | letterId | NORMAL | 外键 |
| emotions | idx_emotionType | emotionType | NORMAL | 情绪类型查询 |
| emotions | idx_createdAt | createdAt | NORMAL | 时间排序 |
| memberships | PRIMARY | id | UNIQUE | 主键 |
| memberships | UNIQUE | userId | UNIQUE | 一对一关系 |
| memberships | idx_membershipType | membershipType | NORMAL | 会员类型查询 |
| memberships | idx_membershipExpiry | membershipExpiry | NORMAL | 过期时间查询 |
| subscription_records | PRIMARY | id | UNIQUE | 主键 |
| subscription_records | UNIQUE | stripePaymentIntentId | UNIQUE | Stripe ID唯一 |
| subscription_records | idx_userId | userId | NORMAL | 用户查询 |
| subscription_records | idx_createdAt | createdAt | NORMAL | 时间排序 |
| subscription_records | idx_status | status | NORMAL | 状态查询 |

### 4.2 查询优化建议
1. **用户信件列表**：使用复合索引`(userId, createdAt)`
2. **情绪报告**：使用`emotionType`和`createdAt`索引
3. **会员查询**：使用`membershipType`和`membershipExpiry`索引
4. **支付记录**：使用`status`和`createdAt`索引

---

## 五、数据完整性约束

### 5.1 外键约束
- `letters.userId` → `users.id`（级联删除）
- `emotions.letterId` → `letters.id`（级联删除）
- `memberships.userId` → `users.id`（级联删除）
- `subscription_records.userId` → `users.id`（级联删除）

### 5.2 唯一约束
- `users.openId`：确保OAuth ID唯一
- `users.email`：邮箱唯一（可选，如果支持邮箱登录）
- `memberships.userId`：一个用户只有一条会员记录
- `subscription_records.stripePaymentIntentId`：Stripe支付ID唯一

### 5.3 检查约束
- `letters.emotionScore`：0 ≤ emotionScore ≤ 100
- `emotions.emotionScore`：0 ≤ emotionScore ≤ 100
- `subscription_records.amount`：amount > 0

---

## 六、数据初始化

### 6.1 创建用户时的初始化
当用户首次注册时，自动创建对应的会员记录：
```sql
INSERT INTO memberships (userId, membershipType, dailyLetterCount)
VALUES (?, 'free', 0);
```

### 6.2 每日重置任务
每天午夜12点执行以下SQL，重置所有用户的每日写信次数：
```sql
UPDATE memberships
SET dailyLetterCount = 0
WHERE lastLetterDate < CURDATE();
```

---

## 七、数据备份和恢复

### 7.1 备份策略
- **备份频率**：每天一次（午夜）
- **备份方式**：全量备份 + 增量备份
- **备份位置**：云存储（S3）
- **保留周期**：30天

### 7.2 恢复流程
1. 确认备份文件完整性
2. 停止应用服务
3. 恢复数据库
4. 验证数据一致性
5. 重启应用服务

---

## 八、性能优化建议

### 8.1 查询优化
1. **分页查询**：使用`LIMIT`和`OFFSET`，避免一次加载所有数据
2. **缓存热数据**：缓存用户会员信息、最近7天情绪数据
3. **异步处理**：AI回信生成、情绪分析等耗时操作使用异步队列

### 8.2 表优化
1. **分表**：如果`letters`表超过1000万条记录，按用户ID或时间分表
2. **归档**：将超过1年的信件归档到历史表
3. **统计表**：创建预计算表存储每日统计数据

### 8.3 连接池
- 使用连接池管理数据库连接
- 初始连接数：10
- 最大连接数：50
- 连接超时：30秒

---

## 九、安全考虑

### 9.1 数据加密
- **敏感数据**：邮箱、密码使用加密存储
- **传输加密**：使用HTTPS/TLS加密传输
- **数据库连接**：使用SSL加密数据库连接

### 9.2 访问控制
- **最小权限原则**：应用用户只有必要的权限
- **行级安全**：用户只能访问自己的数据
- **审计日志**：记录所有数据修改操作

### 9.3 防护措施
- **SQL注入防护**：使用参数化查询
- **备份加密**：备份文件使用加密存储
- **定期审计**：定期检查数据库访问日志

---

## 十、扩展考虑

### 10.1 未来可能的表
- **收藏表**：存储用户收藏的信件
- **分享表**：存储用户分享的信件
- **评论表**：支持用户评论回信（可选）
- **标签表**：用户自定义标签分类

### 10.2 数据分析表
- **日报表**：每日用户统计
- **周报表**：每周用户统计
- **月报表**：每月用户统计

---

**文档版本**：v1.0  
**最后更新**：2026年3月29日  
**作者**：Manus AI  
**状态**：待审核
