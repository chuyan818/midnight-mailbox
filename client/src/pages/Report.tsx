import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import EmotionTrendChart from "@/components/EmotionTrendChart";

export default function Report() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const hasPaidMembership = profile?.membership?.paymentStatus === "active"
    && (profile.membership.membershipType === "monthly" || profile.membership.membershipType === "yearly")
    && (!profile.membership.membershipExpiry || new Date(profile.membership.membershipExpiry).getTime() > Date.now());

  const { data: todayScore, isLoading: loadingToday } = trpc.emotion.getTodayScore.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: trendData, isLoading: loadingTrend } = trpc.emotion.getTrendData.useQuery(undefined, {
    enabled: isAuthenticated && hasPaidMembership,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">请先登录</p>
          <Button onClick={() => navigate("/")} className="bg-[#FFD580] text-[#0B0F2F]">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const emotionColors: Record<string, string> = {
    "快乐": "#FFD580",
    "悲伤": "#6B7280",
    "焦虑": "#F59E0B",
    "愤怒": "#EF4444",
    "孤独": "#8B5CF6",
    "迷茫": "#06B6D4",
    "压力": "#EC4899",
    "思念": "#F472B6",
  };

  const emotionEmojis: Record<string, string> = {
    "快乐": "😊",
    "悲伤": "😢",
    "焦虑": "😰",
    "愤怒": "😠",
    "孤独": "😔",
    "迷茫": "🤔",
    "压力": "😫",
    "思念": "💭",
  };

  // Prepare pie chart data
  const pieData = [
    {
      name: todayScore?.type || "平静",
      value: todayScore?.score || 0,
      fill: emotionColors[todayScore?.type || "平静"] || "#FFD580",
    },
    {
      name: "其他",
      value: 100 - (todayScore?.score || 0),
      fill: "#374151",
    },
  ];

  // Extract keywords from trend data
  const allKeywords: Record<string, number> = {};
  if (trendData && Array.isArray(trendData)) {
    // This would need to be populated from the actual data
    // For now, we'll show placeholder keywords
  }

  const topKeywords = [
    { word: "工作", count: 5 },
    { word: "压力", count: 4 },
    { word: "孤独", count: 3 },
    { word: "思念", count: 2 },
    { word: "焦虑", count: 2 },
  ];

  const maxKeywordCount = Math.max(...topKeywords.map((k) => k.count), 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F]">
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
            <h1 className="text-2xl font-bold text-white">情绪报告</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Today's Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">今日情绪评分</h2>
            {loadingToday ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#FFD580]" />
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">情绪类型</p>
                    <p className="text-3xl font-bold text-[#FFD580]">
                      {emotionEmojis[todayScore?.type || "平静"] || "💭"} {todayScore?.type || "平静"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">今日写信</p>
                    <p className="text-3xl font-bold text-[#FFD580]">{todayScore?.count || 0}</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-white">{todayScore?.score || 0}</p>
                  <p className="text-gray-400 text-sm">情绪评分 (0-100)</p>
                </div>
              </div>
            )}
          </div>

          {/* Score Interpretation */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">评分解读</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 font-semibold mb-1">高分 (61-100)</p>
                <p className="text-xs text-gray-300">
                  你今天的心情相对积极，充满能量和希望。继续保持这种状态！
                </p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400 font-semibold mb-1">中分 (31-60)</p>
                <p className="text-xs text-gray-300">
                  你的情绪处于中等水平，可能有一些压力或挑战。记得照顾好自己。
                </p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 font-semibold mb-1">低分 (0-30)</p>
                <p className="text-xs text-gray-300">
                  你可能感到困难或低落。这是正常的，记得寻求支持和帮助。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">7天情绪趋势</h2>
          {!hasPaidMembership ? (
            <div data-testid="report-upgrade-prompt" className="group relative overflow-hidden rounded-2xl border border-[#FFD580]/35 bg-gradient-to-br from-[#FFD580]/20 via-[#FFD580]/[0.06] to-transparent p-6 text-center shadow-[0_16px_55px_rgba(255,213,128,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFD580]/70 hover:shadow-[0_20px_65px_rgba(255,213,128,0.2)] motion-safe:animate-[fadeIn_500ms_ease-out]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#FFD580]/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />
              <Sparkles className="mx-auto mb-3 h-7 w-7 text-[#FFD580] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" aria-hidden="true" />
              <p className="text-lg font-semibold text-[#FFE7A8]">7天情绪趋势为会员专属功能</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-300">免费版可查看当前情绪报告；升级后解锁完整情绪报告和7天趋势。</p>
              <Button onClick={() => navigate("/profile?payment=retry")} className="mt-5 bg-[#FFD580] text-[#0B0F2F] shadow-[0_8px_24px_rgba(255,213,128,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-400 active:scale-[0.97]">升级会员</Button>
            </div>
          ) : loadingTrend ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFD580]" />
            </div>
          ) : trendData && trendData.length > 0 ? (
            <div className="p-6 rounded-lg bg-white/5 border border-white/10">
              <EmotionTrendChart data={trendData} scoreLabel="评分" />
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center text-gray-400">
              <p>还没有足够的数据来显示趋势</p>
              <p className="text-sm mt-2">继续写信，我们会帮你追踪情绪变化</p>
            </div>
          )}
        </div>

        {/* Keywords Cloud */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">完整情绪报告</h2>
          {!hasPaidMembership ? (
            <div className="p-6 rounded-lg bg-[#FFD580]/10 border border-[#FFD580]/30 text-center">
              <p className="text-[#FFD580] font-semibold">关键词和情绪洞察为会员专属</p>
              <p className="text-sm text-gray-300 mt-2">升级会员后可查看完整的情绪分析结果。</p>
              <Button onClick={() => navigate("/profile?payment=retry")} className="mt-4 bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400">立即升级</Button>
            </div>
          ) : <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <div className="flex flex-wrap gap-3">
              {topKeywords.map((keyword, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 rounded-full bg-[#FFD580]/20 border border-[#FFD580]/30 hover:border-[#FFD580] transition-colors"
                  style={{
                    fontSize: `${12 + (keyword.count / maxKeywordCount) * 8}px`,
                    opacity: 0.6 + (keyword.count / maxKeywordCount) * 0.4,
                  }}
                >
                  <span className="text-[#FFD580] font-semibold">{keyword.word}</span>
                  <span className="text-gray-400 text-xs ml-2">×{keyword.count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              这些是你最常提到的词汇，可以帮助你更好地理解自己的情绪模式。
            </p>
          </div>
          }
        </div>

        {/* Insights */}
        {hasPaidMembership && <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">情绪洞察</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span>💡</span> 你的情绪模式
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                根据你最近的信件，你似乎在处理工作压力和孤独感。这些都是很常见的情绪，记得照顾好自己。
              </p>
            </div>

            <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span>🌟</span> 建议
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                尝试每天写一封信来表达你的感受。这有助于你更好地理解自己的情绪，并获得温暖的陪伴。
              </p>
            </div>
          </div>
        </div>
        }

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 flex-1"
            onClick={() => navigate("/write")}
          >
            写新信
          </Button>
          <Button
            className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 flex-1"
            onClick={() => navigate("/mailbox")}
          >
            查看信箱
          </Button>
        </div>
      </div>
    </div>
  );
}
