import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { ShareDialog } from "@/components/ShareDialog";
import { trpc } from "@/lib/trpc";

interface Quote {
  id: number;
  quote: string;
  emotionTags?: unknown;
  date: string | Date;
  publicLetter?: { starCount?: number; emotionTags?: unknown } | null;
}

const emotionColors: Record<string, { bg: string; text: string; light: string }> = {
  孤独: { bg: "#9370DB", text: "#E6D5FF", light: "#9370DB20" },
  压力: { bg: "#DC143C", text: "#FFB3BA", light: "#DC143C20" },
  想念: { bg: "#FFB6C1", text: "#FFE5EB", light: "#FFB6C120" },
  遗憾: { bg: "#8B7355", text: "#D4C5B9", light: "#8B735520" },
  希望: { bg: "#90EE90", text: "#D4F1D4", light: "#90EE9020" },
};

export default function DailyQuote() {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const quoteQuery = trpc.social.dailyQuote.today.useQuery();
  const historyQuery = trpc.social.dailyQuote.list.useQuery({ limit: 5, offset: 0 });
  const quote = quoteQuery.data as Quote | undefined;
  const content = quote?.quote || "";
  const emotionValue = Array.isArray(quote?.emotionTags) ? String(quote?.emotionTags[0] || "陪伴") : "陪伴";
  const relatedCount = historyQuery.data?.total || 0;

  const quoteUrl = `${window.location.origin}/daily-quote?quote=${quote?.id || "today"}`;
  const colors = emotionColors[emotionValue] || emotionColors.孤独;

  const handleCopy = async () => {
    const text = `“${content}”\n\n来自深夜信箱 - 一个温暖的深夜陪伴`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (quoteQuery.isLoading) return <div className="min-h-screen bg-[#0B0F2F] p-8 text-center text-white">正在为今晚点亮一句话……</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F2F]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">今日一句</h1>
            <p className="mt-1 text-sm text-gray-400">从真实来信里，留下一句温柔的话</p>
          </div>
          <Button
            variant="outline"
            className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10"
            onClick={() => navigate("/")}
          >
            返回首页
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <Card
          className="mb-8 overflow-hidden border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"
          style={{
            backgroundImage: `linear-gradient(135deg, ${colors.light} 0%, rgba(255,255,255,0.05) 100%)`,
          }}
        >
          <div className="space-y-8 p-8 md:p-12">
            <div className="space-y-6">
              <div className="text-5xl text-gray-600 opacity-40">“</div>
              <p className="text-3xl font-light leading-relaxed text-white md:text-4xl">
                {content || "今晚暂时还没有新的句子，写下心事后再回来看看。"}
              </p>
              <div className="text-right text-5xl text-gray-600 opacity-40">”</div>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center gap-4">
              <span
                className="rounded-full px-4 py-2 font-medium text-white"
                style={{ backgroundColor: colors.bg }}
              >
                {emotionValue}
              </span>
                <span className="text-gray-400">来自真实来信的温柔摘句</span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-[#FFD580]">{relatedCount}</div>
                <div className="mt-1 text-xs text-gray-400">往日句子</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-[#FFD580]">{quote?.publicLetter?.starCount || 0}</div>
                <div className="mt-1 text-xs text-gray-400">共鸣星星</div>
              </div>
              <div className="col-span-2 rounded-lg border border-white/10 bg-white/5 p-4 md:col-span-1">
                <div className="text-2xl font-bold text-[#FFD580]">
                  {new Date(quote?.date || Date.now()).toLocaleDateString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </div>
                <div className="mt-1 text-xs text-gray-400">今日</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 md:flex-row">
              <Button
                className="flex-1 bg-[#FFD580] py-6 font-semibold text-[#0B0F2F] hover:bg-yellow-400"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="mr-2 h-5 w-5" />
                分享这句话
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-[#FFD580] py-6 font-semibold text-[#FFD580] hover:bg-[#FFD580]/10"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />已复制
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-5 w-5" />复制文本
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">往日一句</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(historyQuery.data?.data || []).filter((item: any) => item.id !== quote?.id).map((item: any) => (
              <Card
                key={item.date}
                className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-[#FFD580]/30"
              >
                <div className="space-y-3">
                  <p className="text-gray-300 italic">“{item.quote}”</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString("zh-CN")}</span>
                    <span
                      className="rounded px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${emotionColors[Array.isArray(item.emotionTags) ? item.emotionTags[0] : ""]?.bg || "#FFD580"}20`,
                        color: emotionColors[Array.isArray(item.emotionTags) ? item.emotionTags[0] : ""]?.bg || "#FFD580",
                      }}
                    >
                      {Array.isArray(item.emotionTags) ? item.emotionTags[0] || "陪伴" : "陪伴"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        letterId={`quote-${quote?.id || "today"}`}
        content={content}
        backgroundType="星空漫漫"
        shareUrl={quoteUrl}
        shareText={`我在深夜信箱读到一句温柔的话：“${content}”`}
      />
    </div>
  );
}
