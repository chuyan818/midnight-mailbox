import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const EMOTION_STYLES: Record<string, { color: string; icon: string }> = {
  孤独: { color: "#9370DB", icon: "😔" },
  压力: { color: "#DC143C", icon: "😰" },
  想念: { color: "#FFB6C1", icon: "💭" },
  遗憾: { color: "#8B7355", icon: "😞" },
  希望: { color: "#90EE90", icon: "✨" },
  快乐: { color: "#FFD580", icon: "😊" },
  期待: { color: "#7DD3FC", icon: "🌟" },
  平静: { color: "#86EFAC", icon: "🌿" },
  日常分享: { color: "#C4B5FD", icon: "🌙" },
};

interface PublicLetter {
  id: number;
  excerpt: string;
  emotionTags: string[];
  starCount: number;
  hasStarred: boolean;
  createdAt: Date;
}

export default function PublicMailbox() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<"latest" | "mostShared">("latest");
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const mailboxQuery = trpc.social.publicLetters.list.useQuery({
    limit: 20,
    offset: 0,
    sortBy: sortBy === "mostShared" ? "popular" : "recent",
  });
  const addStarMutation = trpc.social.stars.add.useMutation();
  const removeStarMutation = trpc.social.stars.remove.useMutation();

  const letters = useMemo<PublicLetter[]>(
    () => (mailboxQuery.data?.data ?? []).map((letter) => ({
      id: letter.id,
      excerpt: letter.excerpt,
      emotionTags: Array.isArray(letter.emotionTags)
        ? letter.emotionTags.filter((tag): tag is string => typeof tag === "string")
        : [],
      starCount: letter.starCount,
      hasStarred: Boolean(letter.hasStarred),
      createdAt: new Date(letter.createdAt),
    })),
    [mailboxQuery.data],
  );
  const availableEmotionTags = useMemo(
    () => Array.from(new Set(letters.flatMap((letter) => letter.emotionTags))).sort(),
    [letters],
  );

  const handleToggleStar = (letter: PublicLetter) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const mutation = letter.hasStarred ? removeStarMutation : addStarMutation;
    mutation.mutate(
      { publicLetterId: letter.id },
      {
        onSuccess: async () => {
          await utils.social.publicLetters.list.invalidate();
        },
        onError: (error) => toast.error(error.message || "星星操作失败，请稍后重试"),
      },
    );
  };

  const filteredLetters = selectedEmotion
    ? letters.filter((letter) => letter.emotionTags.includes(selectedEmotion))
    : letters;
  const sortedLetters = [...filteredLetters].sort((a, b) =>
    sortBy === "mostShared"
      ? b.starCount - a.starCount
      : b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const getEmotionColor = (emotion: string) => EMOTION_STYLES[emotion]?.color || "#FFD580";
  const formatCreatedAt = (date: Date) => new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      <div className="sticky top-0 z-20 bg-[#0B0F2F]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">公共信箱</h1>
              <p className="text-gray-400 text-sm mt-1">
                {mailboxQuery.isLoading ? "正在加载…" : `${mailboxQuery.data?.total ?? sortedLetters.length} 封温暖的信件`}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10"
              onClick={() => navigate("/")}
            >
              返回首页
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === "latest" ? "default" : "outline"}
                className={sortBy === "latest" ? "bg-[#FFD580] text-[#0B0F2F]" : "border-white/20 text-gray-300"}
                onClick={() => setSortBy("latest")}
              >
                最新
              </Button>
              <Button
                size="sm"
                variant={sortBy === "mostShared" ? "default" : "outline"}
                className={sortBy === "mostShared" ? "bg-[#FFD580] text-[#0B0F2F]" : "border-white/20 text-gray-300"}
                onClick={() => setSortBy("mostShared")}
              >
                最多共鸣
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedEmotion === null ? "default" : "outline"}
                className={selectedEmotion === null ? "bg-white/20 text-white" : "border-white/20 text-gray-300"}
                onClick={() => setSelectedEmotion(null)}
              >
                全部
              </Button>
              {availableEmotionTags.map((label) => (
                <Button
                  key={label}
                  size="sm"
                  variant={selectedEmotion === label ? "default" : "outline"}
                  className={selectedEmotion === label ? "bg-white/20 text-white" : "border-white/20 text-gray-300"}
                  onClick={() => setSelectedEmotion(label)}
                >
                  {EMOTION_STYLES[label]?.icon || "💭"} {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {mailboxQuery.isLoading ? (
          <div className="text-center py-12 text-gray-400">正在读取公共信箱…</div>
        ) : mailboxQuery.isError ? (
          <div className="text-center py-12 text-red-300">公共信箱暂时无法加载，请稍后重试。</div>
        ) : sortedLetters.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无符合条件的信件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLetters.map((letter) => (
              <Card key={letter.id} className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFD580]/20 overflow-hidden group cursor-pointer">
                <div className="p-6 space-y-4">
                  <p className="text-gray-300 line-clamp-4 group-hover:text-white transition-colors">{letter.excerpt}</p>
                  <div className="flex flex-wrap gap-2">
                    {letter.emotionTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{
                          backgroundColor: `${getEmotionColor(tag)}20`,
                          color: getEmotionColor(tag),
                          border: `1px solid ${getEmotionColor(tag)}40`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatCreatedAt(letter.createdAt)}</span>
                    <button
                      onClick={() => handleToggleStar(letter)}
                      disabled={addStarMutation.isPending || removeStarMutation.isPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-[#FFD580]/20 transition-colors group/star disabled:opacity-50"
                    >
                      <Star className={`w-4 h-4 transition-colors ${letter.hasStarred ? "fill-[#FFD580] text-[#FFD580]" : "text-gray-400 group-hover/star:text-[#FFD580]"}`} />
                      <span className={`text-xs font-medium ${letter.hasStarred ? "text-[#FFD580]" : "text-gray-400"}`}>{letter.starCount}</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
