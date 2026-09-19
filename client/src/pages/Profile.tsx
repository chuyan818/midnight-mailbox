import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Settings,
  Mail,
  TrendingUp,
  Clock,
  Globe,
  Bell,
  Lock,
  HelpCircle,
  Info,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import MembershipBadge from "@/components/MembershipBadge";
import { getBadgeLabel, getBadgeTier } from "@/lib/membership-tier";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading } = trpc.user.getProfile.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const badgeTier = getBadgeTier(profile?.membership?.membershipType);
  const badgeLabel = getBadgeLabel(badgeTier);
  const remindersQuery = trpc.membershipReminder.getPendingReminders.useQuery(undefined, { enabled: isAuthenticated });
  const markReminderRead = trpc.membershipReminder.markReminderAsRead.useMutation({
    onSuccess: () => remindersQuery.refetch(),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">请先登录</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-[#FFD580] text-[#0B0F2F]"
          >
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error: any) {
      toast.error("登出失败");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0F2F]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">个人中心</h1>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {remindersQuery.data?.reminders.map((reminder) => (
          <div key={reminder.id} className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-[#FFD580]/30 bg-[#FFD580]/10 p-4 text-sm">
            <div>
              <p className="font-semibold text-[#FFD580]">会员即将到期</p>
              <p className="mt-1 text-white/70">您的会员将在 {reminder.reminderType === "expiry_today" ? "今天" : reminder.reminderType === "expiry_3days" ? "3天后" : "7天后"} 到期，请及时续费。</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => markReminderRead.mutate({ reminderId: reminder.id })} className="shrink-0 text-[#FFD580] hover:bg-[#FFD580]/10">知道了</Button>
          </div>
        ))}
        {/* 用户信息卡片 */}
        <div className="mb-8 p-6 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-start gap-4">
            {/* 头像 */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD580] to-[#FF9F43] flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <span className="text-xl font-bold text-[#0B0F2F]">C</span>
            </div>

            {/* 用户信息 */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold">晚上好，van chu</h2>
                <span>👋</span>
                <MembershipBadge tier={badgeTier} size="small" />
              </div>
              <p className="text-xs text-white/60 mb-2">在深夜写信的第 23 天</p>
              <p className="text-xs text-white/70">
                今晚的你，状态：虽然孤独 <span>🌙</span>
              </p>
            </div>

            {/* 引用语 */}
            <div className="text-right text-xs text-white/50 max-w-xs">
              <p className="italic mb-1">
                "你是否写过了，但仍请我救了？谢谢你一直在这里。"
              </p>
              <p>— 你的信箱</p>
            </div>
          </div>
        </div>

        {/* 统计数据区 - 4列网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <Mail size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">28</p>
            <p className="text-xs text-white/60">总信件数</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <TrendingUp size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">8.7</p>
            <p className="text-xs text-white/60">平均情绪值</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <Mail size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">12</p>
            <p className="text-xs text-white/60">待读信件</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <Clock size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">23:45</p>
            <p className="text-xs text-white/60">最后活跃</p>
          </div>
        </div>

        {/* 情绪热盐图和本周统计 - 2列 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 情绪热盐图 */}
          <div className="lg:col-span-2 p-6 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold mb-4">情绪热盐 (最近7天)</h3>

            {/* 情绪趋势图 */}
            <div className="mb-4">
              <div className="flex items-end justify-between gap-1 h-20">
                {[
                  { date: "5/16", value: 6.5 },
                  { date: "5/17", value: 7.2 },
                  { date: "5/18", value: 6.8 },
                  { date: "5/19", value: 8.1 },
                  { date: "5/20", value: 7.9 },
                  { date: "5/21", value: 8.5 },
                  { date: "今天", value: 8.7 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-[#FFD580] to-[#FF9F43] rounded-t-sm transition-all hover:opacity-80"
                      style={{
                        height: `${(item.value / 10) * 100}%`,
                        minHeight: "2px",
                      }}
                    />
                    <span className="text-xs text-white/50">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 情绪分布 */}
            <div className="space-y-2">
              {[
                { emoji: "😊", label: "愉好" },
                { emoji: "😐", label: "平静" },
                { emoji: "😢", label: "低落" },
              ].map((mood) => (
                <div key={mood.label} className="flex items-center gap-2">
                  <span className="text-sm">{mood.emoji}</span>
                  <span className="text-xs text-white/70 w-8">{mood.label}</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFD580] to-[#FF9F43]"
                      style={{ width: `${Math.random() * 80 + 20}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 本周统计 */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">本周写信统计</p>
              <p className="text-2xl font-bold mb-1">4封</p>
              <p className="text-xs text-[#FFD580]">比上周 +20%</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">深度情绪停留时长</p>
              <p className="text-2xl font-bold mb-1">3.2小时</p>
              <p className="text-xs text-[#FFD580]">比上周 +15%</p>
            </div>
          </div>
        </div>

        {/* 当前版本和升级建议 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/60 mb-2">当前版本</p>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-lg font-bold">{badgeLabel}</p>
              <MembershipBadge tier={badgeTier} size="small" />
            </div>
            <p className="text-xs text-white/50">
              {badgeTier === "free" ? "基础特性" : "会员权益已生效"}
            </p>
            {badgeTier === "premium" ? (
              <Button
                type="button"
                onClick={() => navigate("/premium-support")}
                className="mt-3 h-8 bg-[#FFD580] text-xs text-[#0B0F2F] hover:bg-[#FFC857]"
              >
                联系优先客服
              </Button>
            ) : (
              <p className="mt-3 text-xs text-white/50">高级会员可享受优先客服支持</p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-xs text-white/60 mb-2">你可以享受</p>
            <p className="text-xs text-white/70">
              独播视频回应，让每一封信都得到深层分析
            </p>
          </div>
            <Button 
              className="mt-3 bg-[#FFD580] text-[#0B0F2F] hover:bg-[#FFC857] text-sm h-8"
            >
              延长续费购样件
            </Button>
          </div>
        </div>



        {/* 更多设置 */}
        <div className="mb-8 p-6 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold mb-4">更多设置</h3>
          <div className="space-y-2">
            {[
              { icon: Globe, label: "语言设置", value: "中文 (简体)" },
              { icon: Bell, label: "通知设置" },
              { icon: Lock, label: "隐私设置" },
              { icon: HelpCircle, label: "帮助与反馈" },
              { icon: Info, label: "关于深夜信箱", value: "v1.2.0" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-[#FFD580]" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-xs text-white/50">{item.value}</span>
                    )}
                    <span className="text-white/30">›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 登出按钮 */}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          登出账户
        </Button>
      </div>
    </div>
  );
}
