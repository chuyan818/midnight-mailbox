import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Copy, Share2, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { CrisisSupportCard } from "@/components/CrisisSupportCard";

/**
 * Typewriter effect component
 */
function TypewriterText({
  text,
  speed = 30,
}: {
  text: string;
  speed?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className="font-serif text-lg leading-relaxed whitespace-pre-wrap break-words">
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </div>
  );
}

export default function Letter() {
  const [match, params] = useRoute("/letter/:id");
  const [, navigate] = useLocation();
  const [isCopied, setIsCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  if (!match) {
    return null;
  }

  const letterId = parseInt(params?.id as string);
  const {
    data: letter,
    isLoading,
    error,
    refetch,
  } = trpc.letter.get.useQuery(
    { id: letterId },
    {
      enabled: !!letterId,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // 自动重试逻辑
  React.useEffect(() => {
    if (error && letterId) {
      const timer = setTimeout(() => {
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, letterId, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#FFD580]" />
          <p>AI正在生成温暖的回信...</p>
          <p className="text-sm text-gray-400">请稍候，这通常需要几秒钟</p>
        </div>
      </div>
    );
  }

  // 如果查询出错但仍在重试，显示加载状态而不是错误
  if (error && !letter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#FFD580]" />
          <p>正在加载信件...</p>
          <p className="text-sm text-gray-400">如果长时间未加载，请</p>
          <Button
            onClick={() => navigate("/mailbox")}
            className="bg-[#FFD580] text-[#0B0F2F]"
          >
            返回信箱
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyReply = () => {
    if (letter?.reply) {
      navigator.clipboard.writeText(letter.reply);
      setIsCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // 添加letter的非空检查
  if (!letter) {
    return null; // 不应该到达这里，因为前面已经检查过了
  }

  const handleShare = () => {
    if (letter.riskLevel === "high" || letter.requiresHumanReview) {
      toast.info("这封信正在接受安全审核，暂不支持公开分享");
      return;
    }
    setShowShareDialog(true);
  };

  const getBackgroundStyle = (type?: string) => {
    const backgrounds: Record<string, string> = {
      星空漫漫: "bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F]",
      牛皮纸: "bg-gradient-to-br from-[#D4A574] to-[#C9935F]",
      樱花来信: "bg-gradient-to-br from-[#FFE5EC] via-[#FFD4E5] to-[#FFC0D9]",
      秋日落信: "bg-gradient-to-br from-[#FF9B50] via-[#FF7E5F] to-[#FFA500]",
      节日灯火: "bg-gradient-to-br from-[#FFD700] via-[#FF6B6B] to-[#4ECDC4]",
    };
    return backgrounds[type || "星空漫漫"] || backgrounds["星空漫漫"];
  };

  const emotionEmojis: Record<string, string> = {
    快乐: "😊",
    悲伤: "😢",
    焦虑: "😰",
    愤怒: "😠",
    孤独: "😔",
    迷茫: "🤔",
    压力: "😫",
    思念: "💭",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F]">
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        letterId={String(letterId)}
        content={letter.content || ""}
        backgroundType={letter.backgroundType || undefined}
      />
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0F2F]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">深夜信箱</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Your Letter */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>你的来信</span>
            {letter.emotionType && (
              <span className="text-2xl">
                {emotionEmojis[letter.emotionType] || "💭"}
              </span>
            )}
          </h2>

          <div
            className={`min-h-[260px] w-full rounded-2xl p-5 shadow-xl sm:min-h-[300px] sm:p-8 ${getBackgroundStyle(letter.backgroundType || undefined)} flex flex-col`}
          >
            <div className="flex-1 text-gray-800 dark:text-white whitespace-pre-wrap break-words font-serif text-base leading-relaxed">
              {letter?.content}
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 text-xs text-gray-600 dark:text-gray-400">
              {letter?.createdAt
                ? new Date(letter.createdAt).toLocaleString("zh-CN")
                : "加载中..."}
            </div>
          </div>

          {(letter.riskLevel === "high" || letter.requiresHumanReview) && (
            <CrisisSupportCard riskCategory={letter.riskCategory} />
          )}

          {/* Emotion Analysis */}
          {letter?.emotionScore !== null &&
            letter?.emotionScore !== undefined && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">情绪类型</p>
                  <p className="text-lg font-semibold text-[#FFD580]">
                    {letter?.emotionType || "未分析"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">情绪评分</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#FFD580] to-[#FFC857] h-full"
                        style={{
                          width: `${((letter?.emotionScore || 0) / 100) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-lg font-semibold text-[#FFD580]">
                      {letter?.emotionScore || 0}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">关键词</p>
                  <div className="flex flex-wrap gap-1">
                    {letter?.keywords && Array.isArray(letter.keywords) ? (
                      letter?.keywords
                        ?.slice(0, 3)
                        .map((keyword: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-[#FFD580]/20 text-[#FFD580] rounded-full"
                          >
                            {keyword}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-gray-500">分析中...</span>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* AI Reply */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>夜航人的回信</span>
            <Heart className="w-5 h-5 text-[#FFD580]" />
          </h2>

          {letter?.reply ? (
            <div className="space-y-4">
              <div className="min-h-[260px] rounded-2xl border border-[#FFD580]/30 bg-white/5 p-5 shadow-lg sm:min-h-[300px] sm:p-8">
                <TypewriterText text={letter?.reply || ""} speed={20} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="min-h-11 w-full border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 flex items-center justify-center gap-2"
                  onClick={handleCopyReply}
                >
                  <Copy className="w-4 h-4" />
                  {isCopied ? "已复制" : "复制回信"}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 w-full border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 flex items-center justify-center gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                  分享
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-lg bg-white/5 border border-white/10 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FFD580]" />
              <p className="text-gray-400">
                AI正在认真读你的信，准备温暖的回复...
              </p>
              <p className="text-xs text-gray-500">通常需要30秒到2分钟</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <h3 className="font-semibold text-white">💡 关于这个回信</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            这是由AI"夜航人"根据你的来信生成的温暖回复。我们的AI致力于提供理解、共情和温柔的陪伴，而不是评判或说教。
          </p>
          <p className="text-xs text-gray-500">
            如果你需要专业心理健康帮助，请联系相关专业机构。
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            className="border-purple-400 text-purple-400 hover:bg-purple-400/10 flex-1 min-w-[120px]"
            onClick={() => navigate(`/report?letterId=${letterId}`)}
          >
            查看情绪报告
          </Button>
          <Button
            variant="outline"
            className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 flex-1 min-w-[120px]"
            onClick={() => navigate("/write")}
          >
            再写一封信
          </Button>
          <Button
            className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 flex-1 min-w-[120px]"
            onClick={() => navigate("/mailbox")}
          >
            查看我的信箱
          </Button>
        </div>
      </div>
    </div>
  );
}
