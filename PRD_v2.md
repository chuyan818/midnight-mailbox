# 深夜信箱 PRD v2.0 - 社交治愈平台

## 产品概述

深夜信箱是一个融合**个人日记、AI陪伴、社交治愈**的综合平台。用户可以在深夜向AI倾诉，获得温暖回复，同时可以在社区中与他人分享情感、互相治愈。

## 核心价值主张

- **个人空间**：私密的情感倾诉和AI陪伴
- **社交治愈**：在安全的社区中与他人共鸣
- **情绪成长**：通过数据可视化追踪情绪变化
- **时间见证**：记录生活中的重要时刻

## 产品愿景

成为用户**深夜的情感避风港**，通过AI和社区的力量，帮助用户理解自己、治愈自己、成长自己。

---

## 功能架构 v2.0

### 第一层：个人空间（Private）

1. **写信系统** - 向AI倾诉
   - 5种信纸背景选择
   - 情绪标签标记
   - 公开/私密选项
   - 字数统计和保存提示

2. **AI回信** - 夜航人的温暖陪伴
   - 个性化AI回复
   - 打字机动画效果
   - 多语言支持
   - 收藏和分享功能

3. **我的信箱** - 历史记录管理
   - 信件列表展示
   - 按时间/情绪筛选
   - 删除和归档功能
   - 时间胶囊功能

4. **情绪报告** - 数据可视化
   - 今日情绪评分（半圆图）
   - 7天情绪趋势（折线图）
   - 关键词云展示
   - 情绪成长报告

### 第二层：社交空间（Social）

5. **公共信箱** - 社区共鸣
   - 浏览他人的公开信件
   - 按情绪/关键词搜索
   - 点赞和评论功能
   - 举报和屏蔽功能

6. **共鸣互动** - 点亮星星
   - 为他人的信件点赞（点亮星星）
   - 实时通知
   - 热门信件排行
   - 个人贡献值统计

7. **每日一句** - 治愈文案
   - 系统推荐的每日金句
   - 用户投稿的治愈文案
   - 收藏和分享功能
   - 按主题分类

### 第三层：时间见证（Memory）

8. **时间胶囊** - 未来的自己
   - 写信给未来的自己
   - 定时提醒功能
   - 打开时显示当时的情绪数据
   - 时间线展示

9. **情绪星球** - 情绪可视化
   - 所有情绪的星球展示
   - 按情绪类型聚合
   - 情绪分布饼图
   - 情绪成长轨迹

### 第四层：会员权益（Premium）

10. **会员系统** - 三层结构
    - 免费版：基础功能
    - 标准版（¥15/月）：社交功能
    - 高级版（¥35/月）：全功能 + 优先客服

11. **优先客服** - 高级会员权益
    - 24小时优先响应
    - 专属客服通道
    - 情绪咨询建议
    - VIP标识

---

## 页面结构（Site Map）

```
首页 (Home)
├── 写信 (Write)
│   ├── 选择信纸背景
│   ├── 输入信件内容
│   ├── 标记情绪标签
│   └── 选择公开/私密
├── 我的信箱 (Mailbox)
│   ├── 信件列表
│   ├── 时间胶囊 (TimeCapsule)
│   └── 情绪报告 (Report)
├── 公共信箱 (PublicMailbox)
│   ├── 浏览公开信件
│   ├── 搜索和筛选
│   └── 点赞和评论
├── 每日一句 (DailyQuote)
│   ├── 今日金句
│   ├── 历史金句
│   └── 投稿入口
├── 情绪星球 (EmotionPlanet)
│   ├── 情绪分布
│   ├── 情绪成长
│   └── 数据统计
├── 个人中心 (Profile)
│   ├── 会员信息
│   ├── 账户设置
│   ├── 语言选择
│   └── 优先客服
└── 登录/注册 (Auth)
    ├── OAuth登录
    ├── 注册页面
    └── 忘记密码
```

---

## 数据库设计 v2.0

### 新增表

#### 1. public_letters（公共信件）
```sql
CREATE TABLE public_letters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  letter_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT,
  emotion_type VARCHAR(50),
  keywords JSON,
  stars_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (letter_id) REFERENCES letters(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 2. stars（共鸣互动）
```sql
CREATE TABLE stars (
  id INT PRIMARY KEY AUTO_INCREMENT,
  public_letter_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (public_letter_id) REFERENCES public_letters(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_star (public_letter_id, user_id)
);
```

#### 3. daily_quotes（每日一句）
```sql
CREATE TABLE daily_quotes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL,
  author VARCHAR(100),
  category VARCHAR(50),
  source VARCHAR(100),
  is_featured BOOLEAN DEFAULT FALSE,
  featured_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. time_capsules（时间胶囊）
```sql
CREATE TABLE time_capsules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  emotion_type VARCHAR(50),
  scheduled_date DATETIME NOT NULL,
  is_opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 5. emotion_stars（情绪星球）
```sql
CREATE TABLE emotion_stars (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  emotion_type VARCHAR(50) NOT NULL,
  count INT DEFAULT 1,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_emotion (user_id, emotion_type)
);
```

#### 6. comments（评论）
```sql
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  public_letter_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (public_letter_id) REFERENCES public_letters(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 7. blocks（屏蔽列表）
```sql
CREATE TABLE blocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  blocked_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (blocked_user_id) REFERENCES users(id),
  UNIQUE KEY unique_block (user_id, blocked_user_id)
);
```

---

## UI设计规范 v2.0

### 设计风格：小程序风格

#### 色彩系统
- **主色**：#FFD580（温暖金色）
- **深色背景**：#0B0F2F（深夜蓝）
- **次色**：#8B5CF6（紫色 - 社交）
- **成功色**：#10B981（绿色）
- **警告色**：#F59E0B（橙色）
- **错误色**：#EF4444（红色）

#### 字体系统
- **标题**：PingFang SC / 微软雅黑，Bold，24px
- **副标题**：PingFang SC / 微软雅黑，SemiBold，18px
- **正文**：PingFang SC / 微软雅黑，Regular，14px
- **辅助文本**：PingFang SC / 微软雅黑，Regular，12px

#### 组件规范
- **卡片**：圆角8px，阴影 0 2px 8px rgba(0,0,0,0.1)
- **按钮**：圆角6px，高度44px，字体14px
- **输入框**：圆角6px，高度40px，边框 1px solid #E5E7EB
- **间距**：8px/16px/24px/32px（8的倍数）

#### 响应式设计
- **移动端**：< 640px
- **平板**：640px - 1024px
- **桌面**：> 1024px

---

## 功能详细说明

### 1. 公共信箱（PublicMailbox）

**功能描述**：用户可以选择将信件公开，与社区分享，获得他人的共鸣和点赞。

**核心功能**：
- 浏览公开信件列表
- 按情绪/关键词搜索
- 点赞（点亮星星）
- 实时评论
- 举报和屏蔽

**权限**：
- 免费版：只读
- 标准版及以上：可发布和互动

### 2. 共鸣互动（Stars）

**功能描述**：用户为他人的信件点赞，表示共鸣和支持。

**核心功能**：
- 一键点赞
- 实时通知
- 热门排行
- 个人贡献统计

**权限**：
- 标准版及以上：可点赞

### 3. 每日一句（DailyQuote）

**功能描述**：系统每天推荐一句治愈文案，用户也可以投稿。

**核心功能**：
- 显示今日金句
- 浏览历史金句
- 收藏喜欢的金句
- 用户投稿功能

**权限**：
- 免费版：可浏览
- 标准版及以上：可投稿

### 4. 时间胶囊（TimeCapsule）

**功能描述**：用户写信给未来的自己，在指定时间收到提醒。

**核心功能**：
- 写信给未来
- 设置提醒时间
- 打开时显示当时的情绪数据
- 时间线展示

**权限**：
- 标准版及以上：可使用

### 5. 情绪星球（EmotionPlanet）

**功能描述**：可视化展示用户的所有情绪，形成个人的"情绪星球"。

**核心功能**：
- 情绪分布饼图
- 情绪成长轨迹
- 情绪统计数据
- 情绪对比分析

**权限**：
- 免费版：基础展示
- 高级版：完整分析

---

## 会员权益对比

| 功能 | 免费版 | 标准版(¥15/月) | 高级版(¥35/月) |
|------|--------|----------------|----------------|
| 每日信件数 | 1 | 5 | 无限 |
| 收藏数量 | 10 | 100 | 无限 |
| 公开信件 | ❌ | ✅ | ✅ |
| 点赞互动 | ❌ | ✅ | ✅ |
| 投稿金句 | ❌ | ✅ | ✅ |
| 时间胶囊 | ❌ | ✅ | ✅ |
| 情绪星球 | 基础 | 完整 | 完整 |
| 优先客服 | ❌ | ❌ | ✅ |
| AI深度分析 | ❌ | ❌ | ✅ |

---

## 技术架构

### 前端技术栈
- React 19 + TypeScript
- Tailwind CSS 4
- Wouter（路由）
- tRPC（RPC框架）
- Recharts（数据可视化）
- Sonner（Toast通知）

### 后端技术栈
- Express 4
- tRPC 11
- Drizzle ORM
- MySQL / TiDB
- Manus LLM API
- OpenAI API（降级方案）

### 部署
- Manus WebDev（托管平台）
- CloudRun（无服务器计算）
- MySQL（数据库）

---

## 开发计划

### Phase 1：数据库和API（第13-15阶段）
- 创建新表和迁移
- 实现后端API

### Phase 2：前端页面（第16-18阶段）
- 重新设计首页
- 实现新页面
- 集成API

### Phase 3：功能完善（第19-21阶段）
- 权限检查
- 错误处理
- 单元测试

### Phase 4：优化和部署（第22-24阶段）
- 性能优化
- UI优化
- 最终测试

---

## 成功指标

- **用户增长**：月活跃用户 > 10,000
- **用户留存**：7天留存率 > 40%
- **社交互动**：平均每个用户点赞 > 5次/周
- **内容质量**：公开信件数 > 总信件数的 30%
- **用户满意度**：App评分 > 4.5星

---

## 风险和缓解措施

### 风险1：社区内容质量
**风险**：用户发布不当内容
**缓解**：
- 内容审核机制
- 举报和屏蔽功能
- 社区准则

### 风险2：用户隐私
**风险**：用户担心隐私泄露
**缓解**：
- 明确的公开/私密选项
- 数据加密存储
- 隐私政策透明

### 风险3：社交压力
**风险**：用户因缺乏互动感到失落
**缓解**：
- 强调个人空间的重要性
- 鼓励而不强制社交
- 多样化的互动方式

---

## 下一步

1. 获取利益相关者反馈
2. 确定开发优先级
3. 启动Phase 1开发
4. 定期进行用户测试
