# Profile.tsx 集成指南

本指南说明如何在 `client/src/pages/Profile.tsx` 中集成新的会员徽章、优先客服支持和到期提醒功能。

## 第一步：添加导入

在 `Profile.tsx` 的导入部分，修改第5行和第7行：

```typescript
// 修改第5行，添加新的图标
import { ArrowLeft, Loader2, LogOut, Crown, Calendar, Globe, Star, Zap, Shield } from "lucide-react";

// 在第7行后添加新的导入
import { useLanguage, Language, translations } from "@/contexts/LanguageContext";
import MembershipBadge from "@/components/MembershipBadge";
```

## 第二步：在会员名称旁添加徽章

找到第180-181行的会员名称部分，修改如下：

```typescript
// 原代码：
<div>
  <h3 className={`text-xl font-bold ${currentInfo.color}`}>{currentInfo.name}</h3>
  {profile?.membership?.membershipExpiry && (

// 新代码：
<div>
  <div className="flex items-center gap-3 mb-2">
    <h3 className={`text-xl font-bold ${currentInfo.color}`}>{currentInfo.name}</h3>
    <MembershipBadge 
      tier={currentType === 'free' ? 'free' : currentType === 'monthly' ? 'standard' : 'premium'} 
      size="small" 
    />
  </div>
  {profile?.membership?.membershipExpiry && (
```

## 第三步：添加优先客服支持按钮

找到第190-199行的取消会员按钮，修改如下：

```typescript
// 原代码：
{currentType !== "free" && (
  <Button
    variant="outline"
    className="border-red-500 text-red-400 hover:bg-red-500/10"
    onClick={handleCancel}
    disabled={cancelMutation.isPending as any}
  >
    {cancelMutation.isPending ? "取消中..." : "取消会员"}
  </Button>
)}

// 新代码：
<div className="flex gap-2">
  {currentType !== "free" && (
    <Button
      variant="outline"
      className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
      onClick={() => navigate("/premium-support")}
    >
      <Zap className="w-4 h-4 mr-2" />
      优先客服
    </Button>
  )}
  {currentType !== "free" && (
    <Button
      variant="outline"
      className="border-red-500 text-red-400 hover:bg-red-500/10"
      onClick={handleCancel}
      disabled={cancelMutation.isPending as any}
    >
      {cancelMutation.isPending ? "取消中..." : "取消会员"}
    </Button>
  )}
</div>
```

## 第四步：添加高级会员专属权益

在第210行（功能列表结束后）添加以下代码：

```typescript
{/* Premium Benefits */}
{currentType === 'yearly' && (
  <div className="mt-4 pt-4 border-t border-white/10">
    <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
      <Star className="w-4 h-4 text-yellow-400" />
      高级会员专属权益
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Shield className="w-4 h-4 text-blue-400" />
        <span>24小时优先客服支持</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span>AI深度心理学分析</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Star className="w-4 h-4 text-pink-400" />
        <span>专属高级信纸主题</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Shield className="w-4 h-4 text-green-400" />
        <span>端到端加密存储</span>
      </div>
    </div>
  </div>
)}
```

## 第五步：添加会员到期提醒

在第227行（会员信息区域结束后）添加以下代码：

```typescript
{/* Membership Expiry Reminder */}
{currentType !== 'free' && profile?.membership?.membershipExpiry && (() => {
  const daysUntilExpiry = Math.ceil(
    (new Date(profile.membership.membershipExpiry).getTime() - Date.now()) / 
    (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 ? (
    <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
      <p className="text-sm text-orange-300 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        ⚠️ 您的会员将在 {daysUntilExpiry} 天后到期，请及时续费以继续享受会员权益
      </p>
    </div>
  ) : null;
})()}
```

## 新创建的文件

以下文件已创建，可以直接使用：

1. **server/badge-config.ts** - 会员徽章配置和权益定义
2. **server/membership-config.ts** - 会员权限配置系统
3. **server/membership-limits.ts** - 会员功能限制逻辑
4. **server/membership-expiry-reminder.ts** - 会员到期提醒系统
5. **client/src/components/MembershipBadge.tsx** - 会员徽章组件
6. **client/src/pages/PremiumSupport.tsx** - 高级会员优先客服支持页面

## 集成步骤总结

1. 在 `Profile.tsx` 中添加导入
2. 在会员名称旁添加徽章展示
3. 添加优先客服支持按钮
4. 添加高级会员专属权益展示
5. 添加会员到期前7天的提醒

完成这些修改后，Profile 页面将展示：
- 用户的会员等级和对应的徽章
- 优先客服支持按钮（仅非免费用户可见）
- 高级会员的专属权益列表
- 会员到期前7天的提醒通知

## 注意事项

- 确保 `MembershipBadge` 组件已正确导入
- 会员到期提醒仅在剩余天数 ≤ 7 天时显示
- 优先客服按钮链接到 `/premium-support` 路由
- 所有新增代码都使用了现有的 Tailwind CSS 样式类
