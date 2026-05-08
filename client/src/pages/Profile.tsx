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
  Home,
  MessageSquare,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading } = trpc.user.getProfile.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

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

  const settingsMenu = [
    { icon: Globe, label: "语言设置", value: "中文 (简体)" },
    { icon: Bell, label: "通知设置" },
    { icon: Lock, label: "隐私设置" },
    { icon: HelpCircle, label: "帮助与反馈" },
    { icon: Info, label: "关于深夜信箱", value: "v1.2.0" },
  ];

  const bottomNav = [
    { icon: Home, label: "首页", path: "/" },
    { icon: Mail, label: "信箱", path: "/mailbox" },
    { icon: Sparkles, label: "对话精选", path: "/featured" },
    { icon: User, label: "我的", path: "/profile", active: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white pb-24">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0B0F2F]/95 to-[#0B0F2F]/80 backdrop-blur-sm border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">个人中心</h1>
        <button className="p-2 hover:bg-white/10 rounded-lg transition">
          <Settings size={24} />
        </button>
      </div>

      {/* 主要内容区域 */}
      <div className="px-4 py-6 space-y-4">
        {/* 用户信息卡片 - 占据较大空间 */}
        <div className="bg-gradient-to-br from-[#1C1F4A]/80 to-[#2D2F5A]/80 border border-white/10 rounded-2xl p-6">
          <div className="flex gap-4 mb-4">
            {/* 头像 */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD580] to-[#FF9F43] flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <span className="text-2xl font-bold text-[#0B0F2F]">C</span>
            </div>

            {/* 用户基本信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold">晚上好，van chu</h2>
                <span className="text-lg">👋</span>
              </div>
              <p className="text-xs text-white/60 mb-2">在深夜写信的第 23 天</p>
              <p className="text-xs text-white/70 mb-2">
                今晚的你，状态：虽然孤独 <span>🌙</span>
              </p>
            </div>
          </div>

          {/* 引用语 */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/70 italic mb-2">
              "你是否写过了，但仍请我救了？谢谢你一直在这里。"
            </p>
            <p className="text-xs text-white/50 text-right">— 你的信箱</p>
          </div>
        </div>

        {/* 统计数据区 - 4列紧凑排列 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <Mail size={18} className="mx-auto mb-1 text-[#FFD580]" />
            <p className="text-lg font-bold">28</p>
            <p className="text-xs text-white/60">总信件数</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <TrendingUp size={18} className="mx-auto mb-1 text-[#FFD580]" />
            <p className="text-lg font-bold">8.7</p>
            <p className="text-xs text-white/60">平均情绪值</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <MessageSquare size={18} className="mx-auto mb-1 text-[#FFD580]" />
            <p className="text-lg font-bold">12</p>
            <p className="text-xs text-white/60">待读信件</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
            <Clock size={18} className="mx-auto mb-1 text-[#FFD580]" />
            <p className="text-lg font-bold">23:45</p>
            <p className="text-xs text-white/60">最后活跃</p>
          </div>
        </div>

        {/* 情绪热盐图和本周统计 - 并排 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 情绪热盐图 - 占2列 */}
          <div className="col-span-2 bg-gradient-to-br from-[#1C1F4A]/80 to-[#2D2F5A]/80 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3">情绪热盐 (最近7天)</h3>

            {/* 情绪趋势图 */}
            <div className="mb-4">
              <div className="flex items-end justify-between gap-1 h-24">
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
                  <span className="text-lg">{mood.emoji}</span>
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

          {/* 本周统计 - 占1列 */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-[#1C1F4A]/80 to-[#2D2F5A]/80 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-white/60 mb-1">本周写信统计</p>
              <p className="text-2xl font-bold mb-1">4封</p>
              <p className="text-xs text-[#FFD580]">比上周 +20%</p>
            </div>
            <div className="bg-gradient-to-br from-[#1C1F4A]/80 to-[#2D2F5A]/80 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-white/60 mb-1">深度情绪停留时长</p>
              <p className="text-2xl font-bold mb-1">3.2小时</p>
              <p className="text-xs text-[#FFD580]">比上周 +15%</p>
            </div>
          </div>
        </div>

        {/* 当前版本和升级建议 - 并排 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#1C1F4A]/80 to-[#2D2F5A]/80 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/60 mb-2">当前版本</p>
            <p className="text-lg font-bold mb-1">免费版</p>
            <p className="text-xs text-white/50">基础特性</p>
          </div>

          <div className="bg-gradient-to-br from-[#2D2F5A]/80 to-[#1C1F4A]/80 border border-[#FFD580]/20 rounded-xl p-4">
            <p className="text-xs text-white/60 mb-2">你可以享受</p>
            <p className="text-xs text-white/70">独播视频回应，让每一封信都得到深层分析</p>
          </div>
        </div>

        {/* 升级建议按钮 */}
        <div className="bg-gradient-to-br from-[#2D2F5A]/80 to-[#1C1F4A]/80 border border-[#FFD580]/20 rounded-xl p-4 flex items-center justify-between">
          <div></div>
          <Button className="bg-[#FFD580] text-[#0B0F2F] hover:bg-[#FFC857] whitespace-nowrap">
            延长续费购样件
          </Button>
          <button className="text-xs text-[#FFD580] hover:text-[#FFC857] transition">
            查看会员权益 →
          </button>
        </div>

        {/* 更多设置 */}
        <div className="bg-gradient-to-br from-[#1C1F4A]/80 to-[#2D2F5A]/80 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">更多设置</h3>
          <div className="space-y-2">
            {settingsMenu.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-[#FFD580]" />
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
          onClick={async () => {
            try {
              await logout();
              navigate("/");
            } catch (error: any) {
              toast.error("登出失败");
            }
          }}
          className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-sm"
        >
          登出账户
        </Button>
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0B0F2F]/95 to-[#0B0F2F]/80 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-around">
          {bottomNav.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 transition ${
                  item.active
                    ? "text-[#FFD580]"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
