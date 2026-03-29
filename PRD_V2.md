# 深夜信箱 - 产品需求文档（PRD v2.0）

## 一、产品概述

**产品名称**：深夜信箱（Midnight Mailbox）

**产品定位**：一个社交治愈平台，用户可以在深夜写信倾诉、投递信箱、浏览他人的匿名信件、点亮共鸣之星，感受彼此的陪伴。

**核心理念**：
- 不是日记，是陪伴
- 不是评判，是理解
- 不是分享，是共鸣

**目标用户**：18-35岁的年轻人，特别是有情绪压力、孤独感、渴望被理解的用户。

---

## 二、核心功能

### 1. 写一封信
用户可以创建一封新信件，包含以下元素：

**必填项**：
- 文字内容（10-5000字）

**可选项**：
- 信纸背景（5种选择）
- 情绪标签（多选，例如：孤独、压力、想念、遗憾、希望等）
- 是否公开（默认匿名）

**功能**：
- 实时字数计数
- 草稿自动保存
- 情绪标签推荐

### 2. 投递信箱
用户点击"投进信箱"按钮后：

**动画效果**：
- 信纸飞入信箱（3D动画）
- 信箱亮灯（灯光效果）
- 页面提示："你的信已经寄出"

**后端处理**：
- 保存信件到数据库
- 记录投递时间和情绪标签
- 如果选择公开，添加到公共信箱

### 3. 公共信箱
展示所有匿名公开的信件，用户可以：

**浏览功能**：
- 查看信件内容
- 查看情绪标签
- 查看投递时间
- 查看共鸣数（星星数量）

**互动功能**：
- 点亮星星（表示"我懂你的感受"）
- 不是点赞，是共鸣
- 每个用户每条信件只能点一次

**排序方式**：
- 最新优先
- 最共鸣优先（星星最多）

### 4. 今日最孤独的一句话
系统每天自动选择一条最有共鸣的信件摘录：

**功能**：
- 每天00:00更新
- 展示完整句子
- 显示情绪标签
- 支持生成分享卡片（可分享到社交媒体）
- 高传播性的设计

**示例**：
> 原来很多人都在假装开心。

### 5. 深夜信件
每晚22:00发布三封精选信件：

**功能**：
- 自动选择当日最有共鸣的三封信
- 推送通知用户
- 展示在专门页面
- 增加用户粘性

### 6. 时间胶囊
用户可以写信给未来的自己：

**功能**：
- 选择打开时间（1周、1个月、3个月、6个月、1年）
- 定时提醒和自动打开
- 收费功能（VIP专享）
- 支持设置打开时的自动回复

**定价**：
- 免费用户：每月1条
- VIP用户：无限制

### 7. 情绪星球
地图或星空形式展示所有信件：

**功能**：
- 每封信是一颗星
- 不同情绪用不同颜色表示
- 点击星星打开信件
- 支持按情绪筛选
- 视觉效果优美

**交互**：
- 缩放和平移
- 搜索功能
- 情绪分布统计

---

## 三、小程序页面结构

### 首页
**按钮组件**：
1. 写一封信 - 进入写信页面
2. 打开信箱 - 进入公共信箱
3. 今日一句 - 查看每日精选
4. 我的信 - 查看个人信件

**展示内容**：
- 深夜氛围背景
- 欢迎文案
- 快捷导航

### 写信页面
**组件**：
1. 文字输入区 - 支持自动换行
2. 信纸背景选择 - 5种背景
3. 情绪标签选择 - 多选
4. 公开开关 - 是否公开
5. 投递按钮 - 点击投递

**验证**：
- 字数限制（10-5000字）
- 必填项检查
- 自动保存草稿

### 公共信箱
**展示**：
- 信件卡片列表
- 每张卡片显示：摘录、情绪标签、星星数、投递时间
- 无限滚动加载

**排序**：
- 最新优先
- 最共鸣优先

**互动**：
- 点亮星星
- 查看完整信件

### 今日一句
**展示**：
- 大字体展示句子
- 情绪标签
- 分享按钮
- 生成分享卡片

**分享卡片**：
- 包含句子、背景、品牌信息
- 支持下载或分享到社交媒体

### 我的信箱
**功能**：
1. 我的信件 - 查看历史信件
2. 时间胶囊 - 查看待打开的信件
3. 收藏信 - 收藏他人的信件

**展示**：
- 信件列表
- 编辑和删除选项
- 时间胶囊倒计时

---

## 四、数据库设计

### 核心表结构

#### users（用户表）
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### letters（信件表）
```sql
CREATE TABLE letters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  content TEXT NOT NULL,
  background VARCHAR(50),
  emotionTags JSON,
  isPublic BOOLEAN DEFAULT FALSE,
  reply TEXT,
  emotionScore INT,
  emotionType VARCHAR(50),
  keywords JSON,
  starCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### public_letters（公共信件表）
```sql
CREATE TABLE public_letters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  letterId INT NOT NULL UNIQUE,
  userId INT NOT NULL,
  excerpt VARCHAR(500),
  emotionTags JSON,
  starCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (letterId) REFERENCES letters(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### stars（共鸣互动表）
```sql
CREATE TABLE stars (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  publicLetterId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_star (userId, publicLetterId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (publicLetterId) REFERENCES public_letters(id) ON DELETE CASCADE
);
```

#### daily_quotes（每日一句表）
```sql
CREATE TABLE daily_quotes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  letterId INT NOT NULL,
  quote VARCHAR(500) NOT NULL,
  emotionTags JSON,
  date DATE UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (letterId) REFERENCES letters(id) ON DELETE CASCADE
);
```

#### time_capsules（时间胶囊表）
```sql
CREATE TABLE time_capsules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  content TEXT NOT NULL,
  openDate DATETIME NOT NULL,
  status ENUM('pending', 'opened') DEFAULT 'pending',
  autoReply TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  openedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### emotion_stars（情绪星球表）
```sql
CREATE TABLE emotion_stars (
  id INT PRIMARY KEY AUTO_INCREMENT,
  letterId INT NOT NULL,
  emotionType VARCHAR(50),
  color VARCHAR(10),
  x FLOAT,
  y FLOAT,
  z FLOAT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (letterId) REFERENCES letters(id) ON DELETE CASCADE
);
```

---

## 五、视觉设计

### 整体风格
- **主题**：治愈、夜晚、安静
- **参考**：深夜电台、星空、温暖灯光
- **氛围**：孤独但不冷漠，安静但有陪伴

### 配色方案

| 元素 | 颜色 | 用途 |
|------|------|------|
| 背景 | #0B0F2F 深蓝 | 主背景 |
| 文字 | #F5F1E8 米白 | 主文字 |
| 星星 | #FFD580 金色 | 共鸣互动 |
| 按钮 | #FF9D5C 暖橙 | 主要操作 |
| 强调 | #1C1F4A 夜蓝 | 次要元素 |
| 成功 | #A8E6CF 薄荷 | 成功提示 |

### 字体
- 主字体：思源黑体、微软雅黑
- 副字体：思源宋体（用于引用）

### 动画
- 信纸投递：3D旋转 + 缩放 + 淡入
- 信箱亮灯：灯光闪烁 + 音效
- 星星点亮：缩放 + 光晕效果
- 页面切换：淡入淡出

---

## 六、技术架构

### 前端
- React 19 + Vite
- Tailwind CSS 4
- 3D动画库（Three.js 或 Babylon.js）
- 图表库（ECharts）

### 后端
- Express.js
- tRPC
- Node.js

### 数据库
- MySQL

### 部署
- Manus 平台

---

## 七、商业模式

### 免费用户
- 每天可写3封信
- 查看公共信箱
- 点亮星星
- 查看每日一句
- 每月1条时间胶囊

### VIP用户（¥29/月 或 ¥288/年）
- 无限写信
- 优先显示在公共信箱
- 无限时间胶囊
- 高级分享卡片
- 无广告体验

---

## 八、成功指标

- **日活跃用户（DAU）**：目标 10,000+
- **月活跃用户（MAU）**：目标 50,000+
- **平均会话时长**：目标 10+ 分钟
- **VIP转化率**：目标 5%+
- **用户留存率**：7日留存 > 40%

---

## 九、风险评估

### 技术风险
- 3D动画性能优化
- 大数据量下的查询性能
- 实时通知系统

### 业务风险
- 内容审核和安全
- 用户隐私保护
- 社区规范制定

### 缓解方案
- 实施内容安全检测
- 完善隐私政策
- 建立社区指南
- 定期用户调研

---

## 十、开发计划

| 阶段 | 时间 | 目标 |
|------|------|------|
| 第一阶段 | 第1-2周 | 核心功能（写信、投递、公共信箱） |
| 第二阶段 | 第3周 | 每日一句、深夜信件 |
| 第三阶段 | 第4周 | 时间胶囊、情绪星球 |
| 第四阶段 | 第5周 | 测试、优化、发布 |

---

**文档版本**：v2.0  
**最后更新**：2026-03-29  
**作者**：Manus AI
