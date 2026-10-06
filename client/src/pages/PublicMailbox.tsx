import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Heart, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const EMOTION_TAGS = [
  { label: "孤独", color: "#9370DB", icon: "😔" },
  { label: "压力", color: "#DC143C", icon: "😰" },
  { label: "想念", color: "#FFB6C1", icon: "💭" },
  { label: "遗憾", color: "#8B7355", icon: "😞" },
  { label: "希望", color: "#90EE90", icon: "✨" },
];

interface PublicLetter {
  id: number;
  excerpt: string;
  emotionTags: string[];
  starCount: number;
  hasStarred: boolean;
  createdAt: string;
}

export default function PublicMailbox() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<"latest" | "mostShared">("latest");
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [letters, setLetters] = useState<PublicLetter[]>([
    {
      id: 1,
      excerpt: "今天又是一个人在办公室里，看着窗外的雨，心里想着什么时候才能放松...",
      emotionTags: ["压力", "孤独"],
      starCount: 234,
      hasStarred: false,
      createdAt: "2 小时前",
    },
    {
      id: 2,
      excerpt: "距离你离开已经三个月了，但我还是会在某个瞬间想起你的笑容...",
      emotionTags: ["想念", "遗憾"],
      starCount: 456,
      hasStarred: false,
      createdAt: "5 小时前",
    },
    {
      id: 3,
      excerpt: "虽然现在很难，但我相信一切都会好起来的，因为我还有梦想...",
      emotionTags: ["希望", "压力"],
      starCount: 189,
      hasStarred: false,
      createdAt: "8 小时前",
    },
  ]);

  const handleToggleStar = (id: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setLetters(
      letters.map((letter) =>
        letter.id === id
          ? {
              ...letter,
              hasStarred: !letter.hasStarred,
              starCount: letter.hasStarred
                ? letter.starCount - 1
                : letter.starCount + 1,
            }
          : letter
      )
    );
  };

  const filteredLetters = selectedEmotion
    ? letters.filter((letter) => letter.emotionTags.includes(selectedEmotion))
    : letters;

  const sortedLetters = [...filteredLetters].sort((a, b) => {
    if (sortBy === "mostShared") {
      return b.starCount - a.starCount;
    }
    return 0;
  });

  const getEmotionColor = (emotion: string) => {
    const tag = EMOTION_TAGS.find((t) => t.label === emotion);
    return tag?.color || "#FFD580";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0F2F]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">公共信箱</h1>
              <p className="text-gray-400 text-sm mt-1">
                {sortedLetters.length} 封温暖的信件
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

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Sort */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === "latest" ? "default" : "outline"}
                className={
                  sortBy === "latest"
                    ? "bg-[#FFD580] text-[#0B0F2F]"
                    : "border-white/20 text-gray-300"
                }
                onClick={() => setSortBy("latest")}
              >
                最新
              </Button>
              <Button
                size="sm"
                variant={sortBy === "mostShared" ? "default" : "outline"}
                className={
                  sortBy === "mostShared"
                    ? "bg-[#FFD580] text-[#0B0F2F]"
                    : "border-white/20 text-gray-300"
                }
                onClick={() => setSortBy("mostShared")}
              >
                最多共鸣
              </Button>
            </div>

            {/* Emotion Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedEmotion === null ? "default" : "outline"}
                className={
                  selectedEmotion === null
                    ? "bg-white/20 text-white"
                    : "border-white/20 text-gray-300"
                }
                onClick={() => setSelectedEmotion(null)}
              >
                全部
              </Button>
              {EMOTION_TAGS.map((tag) => (
                <Button
                  key={tag.label}
                  size="sm"
                  variant={
                    selectedEmotion === tag.label ? "default" : "outline"
                  }
                  className={
                    selectedEmotion === tag.label
                      ? "bg-white/20 text-white"
                      : "border-white/20 text-gray-300"
                  }
                  onClick={() => setSelectedEmotion(tag.label)}
                >
                  {tag.icon} {tag.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Letters Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {sortedLetters.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无符合条件的信件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLetters.map((letter) => (
              <Card
                key={letter.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFD580]/20 overflow-hidden group cursor-pointer"
              >
                <div className="p-6 space-y-4">
                  {/* Excerpt */}
                  <p className="text-gray-300 line-clamp-4 group-hover:text-white transition-colors">
                    {letter.excerpt}
                  </p>

                  {/* Emotion Tags */}
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

                  {/* Divider */}
                  <div className="h-px bg-white/10" />

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{letter.createdAt}</span>

                    {/* Star Button */}
                    <button
                      onClick={() => handleToggleStar(letter.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-[#FFD580]/20 transition-colors group/star"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          letter.hasStarred
                            ? "fill-[#FFD580] text-[#FFD580]"
                            : "text-gray-400 group-hover/star:text-[#FFD580]"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          letter.hasStarred
                            ? "text-[#FFD580]"
                            : "text-gray-400"
                        }`}
                      >
                        {letter.starCount}
                      </span>
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
