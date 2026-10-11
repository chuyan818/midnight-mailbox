import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Moon, Sparkles, Star } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const EMOTION_COLORS: Record<string, string> = {
  孤独: "#B9A2FF",
  压力: "#E77A8B",
  想念: "#FFB6C1",
  遗憾: "#B89E82",
  希望: "#9FE3B1",
  快乐: "#FFD580",
  焦虑: "#FF9B8F",
  愤怒: "#FF8A54",
  悲伤: "#8DB7E8",
  平静: "#8DD8D0",
};

const POSITIONS = [
  [19, 28], [43, 20], [72, 29], [31, 57], [77, 67], [53, 47],
  [15, 75], [85, 19], [52, 80], [26, 43], [67, 61], [39, 37],
] as const;

export default function EmotionPlanet() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const statsQuery = trpc.social.emotionPlanet.stats.useQuery(undefined, { enabled: isAuthenticated });
  const trendQuery = trpc.social.emotionPlanet.trend.useQuery({ days: 30 }, { enabled: isAuthenticated });

  const emotionStats = Object.entries(statsQuery.data?.stats || {}).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...emotionStats.map(([, count]) => count), 1);
  const dominant = emotionStats[0];
  const trendRows = Object.entries(trendQuery.data?.trend || {}).sort(([a], [b]) => a.localeCompare(b));
  const recentCount = trendRows.reduce((total, [, values]) => total + Object.values(values).reduce((sum, count) => sum + count, 0), 0);

  const stars = useMemo(() => emotionStats.map(([emotion, count], index) => ({
    emotion,
    count,
    color: EMOTION_COLORS[emotion] || "#C8C6E8",
    x: POSITIONS[index % POSITIONS.length][0],
    y: POSITIONS[index % POSITIONS.length][1],
    radius: 4 + (count / maxCount) * 6,
  })), [emotionStats, maxCount]);

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-[#0B0F2F] p-8 text-center text-white"><p>登录后才能看见属于你的私人星系。</p><Button onClick={() => navigate("/login")} className="mt-4">去登录</Button></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#171A43] to-[#0B0F2F] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F2F]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#E9B86A]">PRIVATE GALAXY</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">我的情绪星系</h1>
            <p className="mt-1 text-sm text-white/55">只属于你的近 30 天情绪轨迹，不公开单封信的内容。</p>
          </div>
          <Button variant="outline" className="border-[#E9B86A] text-[#E9B86A] hover:bg-[#E9B86A]/10" onClick={() => navigate("/")}><ArrowLeft className="mr-2 h-4 w-4" />返回</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/5 p-5"><p className="text-sm text-white/50">近 30 天记录</p><p className="mt-2 text-3xl font-semibold text-[#E9B86A]">{recentCount}</p><p className="mt-1 text-xs text-white/45">每一种感受都值得被看见</p></Card>
          <Card className="border-white/10 bg-white/5 p-5"><p className="text-sm text-white/50">此刻最亮的星</p><p className="mt-2 flex items-center gap-2 text-2xl font-semibold">{dominant ? <><span style={{ color: EMOTION_COLORS[dominant[0]] || "#E9B86A" }}>●</span>{dominant[0]}</> : "还没有记录"}</p><p className="mt-1 text-xs text-white/45">不是标签，只是最近陪你的情绪</p></Card>
          <Card className="border-white/10 bg-white/5 p-5"><p className="text-sm text-white/50">你的星系提示</p><p className="mt-2 text-sm leading-6 text-white/75">情绪会移动，不需要被固定。写下来的每一晚，都在帮你留下一条回到自己的路。</p></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-white/10 to-transparent">
            <div className="flex items-center justify-between border-b border-white/10 p-5"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><Moon className="h-5 w-5 text-[#E9B86A]" />近 30 天星轨</h2><p className="mt-1 text-xs text-white/45">星星越大，出现得越频繁</p></div><Sparkles className="h-5 w-5 text-[#E9B86A]" /></div>
            <svg viewBox="0 0 100 100" className="aspect-square w-full bg-[radial-gradient(circle_at_50%_45%,#343665_0%,#15183D_45%,#0B0F2F_100%)]" role="img" aria-label="个人情绪星系">
              <defs><filter id="glow"><feGaussianBlur stdDeviation="1.8" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
              <ellipse cx="50" cy="50" rx="38" ry="14" fill="none" stroke="rgba(233,184,106,.18)" strokeWidth=".35" transform="rotate(-22 50 50)" />
              <ellipse cx="50" cy="50" rx="29" ry="10" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth=".25" transform="rotate(18 50 50)" />
              <circle cx="50" cy="50" r="6" fill="#E9B86A" opacity=".16" filter="url(#glow)" /><circle cx="50" cy="50" r="2.2" fill="#E9B86A" />
              {stars.map(star => <g key={star.emotion} onClick={() => setSelectedEmotion(star.emotion)} className="cursor-pointer"><circle cx={star.x} cy={star.y} r={star.radius * 1.7} fill={star.color} opacity=".12" filter="url(#glow)" /><circle cx={star.x} cy={star.y} r={star.radius} fill={star.color} opacity={selectedEmotion && selectedEmotion !== star.emotion ? 0.3 : 0.9} /><text x={star.x} y={star.y + star.radius + 4} textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="2.6">{star.emotion}</text></g>)}
            </svg>
            {!stars.length && <div className="p-8 text-center text-sm text-white/55">写下第一封信后，这里会长出属于你的第一颗星。</div>}
          </Card>

          <Card className="border-white/10 bg-white/5 p-5"><h2 className="flex items-center gap-2 text-lg font-semibold"><Heart className="h-5 w-5 text-[#E9B86A]" />情绪轨迹</h2><div className="mt-5 space-y-3">{trendRows.length ? trendRows.slice(-8).map(([date, values]) => { const top = Object.entries(values).sort((a, b) => b[1] - a[1])[0]; return <div key={date} className="flex items-center gap-3"><span className="w-20 text-xs text-white/45">{date.slice(5)}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (top?.[1] || 0) * 35)}%`, background: EMOTION_COLORS[top?.[0] || ""] || "#E9B86A" }} /></div><span className="w-12 truncate text-right text-xs text-white/70">{top?.[0] || "—"}</span></div>; }) : <p className="py-8 text-center text-sm text-white/50">最近 30 天还没有情绪记录。</p>}</div><div className="mt-6 rounded-xl border border-[#E9B86A]/20 bg-[#E9B86A]/5 p-4 text-sm leading-6 text-white/70"><Star className="mb-2 h-4 w-4 text-[#E9B86A]" />无论轨迹朝哪里走，你都不需要独自解释它。继续写下去，变化会慢慢显形。</div></Card>
        </div>

        <Card className="border-white/10 bg-white/5 p-5"><h2 className="text-lg font-semibold">情绪分布</h2><div className="mt-4 flex flex-wrap gap-2">{emotionStats.length ? emotionStats.map(([emotion, count]) => <button key={emotion} onClick={() => setSelectedEmotion(selectedEmotion === emotion ? null : emotion)} className={`rounded-full border px-3 py-2 text-sm transition ${selectedEmotion === emotion ? "border-[#E9B86A] bg-[#E9B86A]/15 text-[#E9B86A]" : "border-white/10 text-white/70 hover:border-white/25"}`}><span style={{ color: EMOTION_COLORS[emotion] || "#E9B86A" }}>●</span> {emotion} <span className="ml-1 text-white/45">{count}</span></button>) : <span className="text-sm text-white/50">还没有可展示的情绪分布。</span>}</div></Card>
      </main>
    </div>
  );
}
