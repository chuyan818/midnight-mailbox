import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Copy, Check } from "lucide-react";
import { useLocation } from "wouter";
import { ShareDialog } from "@/components/ShareDialog";

interface Quote {
  id: number;
  content: string;
  emotion: string;
  letterCount: number;
  shareCount: number;
  date: string;
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
  const [quote] = useState<Quote>({
    id: 1,
    content: "有时候，我们需要的不是答案，而是有人愿意听我们说话。",
    emotion: "孤独",
    letterCount: 342,
    shareCount: 1205,
    date: "2026-03-29",
  });

  const quoteUrl = `${window.location.origin}/daily-quote?quote=${quote.id}`;
  const colors = emotionColors[quote.emotion] || emotionColors.孤独;

  const handleCopy = async () => {
    const text = `“${quote.content}”\n\n来自深夜信箱 - 今日最孤独的句子`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F2F]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">今日一句</h1>
            <p className="mt-1 text-sm text-gray-400">最孤独的句子，最温暖的陪伴</p>
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
                {quote.content}
              </p>
              <div className="text-right text-5xl text-gray-600 opacity-40">”</div>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center gap-4">
              <span
                className="rounded-full px-4 py-2 font-medium text-white"
                style={{ backgroundColor: colors.bg }}
              >
                {quote.emotion}
              </span>
              <span className="text-gray-400">
                来自 {quote.letterCount} 封信件中的最孤独的句子
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-[#FFD580]">{quote.letterCount}</div>
                <div className="mt-1 text-xs text-gray-400">相关信件</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-[#FFD580]">{quote.shareCount}</div>
                <div className="mt-1 text-xs text-gray-400">次分享</div>
              </div>
              <div className="col-span-2 rounded-lg border border-white/10 bg-white/5 p-4 md:col-span-1">
                <div className="text-2xl font-bold text-[#FFD580]">
                  {new Date(quote.date).toLocaleDateString("zh-CN", {
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
            {[
              { date: "昨天", content: "我们都在黑暗中摸索，但至少我们不是一个人。", emotion: "希望" },
              { date: "前天", content: "有时候放下，不是因为不爱，而是因为爱得太深。", emotion: "遗憾" },
              { date: "3天前", content: "压力会过去，但我们会留下。", emotion: "压力" },
              { date: "4天前", content: "你不必完美，你只需要真实。", emotion: "孤独" },
            ].map(item => (
              <Card
                key={item.date}
                className="border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-[#FFD580]/30"
              >
                <div className="space-y-3">
                  <p className="text-gray-300 italic">“{item.content}”</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item.date}</span>
                    <span
                      className="rounded px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${emotionColors[item.emotion]?.bg || "#FFD580"}20`,
                        color: emotionColors[item.emotion]?.bg || "#FFD580",
                      }}
                    >
                      {item.emotion}
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
        letterId={`quote-${quote.id}`}
        content={quote.content}
        backgroundType="星空漫漫"
        shareUrl={quoteUrl}
        shareText={`我在深夜信箱读到一句温柔的话：“${quote.content}”`}
      />
    </div>
  );
}
