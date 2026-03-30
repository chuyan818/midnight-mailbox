import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, ArrowLeft, Sparkles, Globe, Lock } from "lucide-react";
import "@/styles/theme-animations.css";
import { DynamicStarryBackground, DynamicPetalBackground, DynamicLeafBackground, DynamicLightBackground } from "@/components/DynamicStarryBackground";
import { DynamicKraftBackground } from "@/components/DynamicKraftBackground";

type BackgroundType = "星空漫漫" | "牛皮纸" | "樱花来信" | "秋日落信" | "节日灯火";

const EMOTION_TAGS = [
  { label: "孤独", emoji: "😔" },
  { label: "压力", emoji: "😰" },
  { label: "想念", emoji: "💭" },
  { label: "遗憾", emoji: "😞" },
  { label: "希望", emoji: "✨" },
];

const BACKGROUNDS: { type: BackgroundType; label: string; bg: string; description: string; themeClass: string }[] = [
  {
    type: "星空漫漫",
    label: "星空漫漫",
    bg: "bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F]",
    description: "深邃的星空，无尽的思念",
    themeClass: "theme-starry-night",
  },
  {
    type: "牛皮纸",
    label: "牛皮纸",
    bg: "bg-gradient-to-br from-[#D4A574] to-[#C9935F]",
    description: "温暖的纸张，岁月的痕迹",
    themeClass: "theme-vintage-kraft",
  },
  {
    type: "樱花来信",
    label: "樱花来信",
    bg: "bg-gradient-to-br from-[#FFE5EC] via-[#FFD4E5] to-[#FFC0D9]",
    description: "粉色的梦幻，春日的温柔",
    themeClass: "theme-cherry-blossom",
  },
  {
    type: "秋日落信",
    label: "秋日落信",
    bg: "bg-gradient-to-br from-[#FF9B50] via-[#FF7E5F] to-[#FFA500]",
    description: "金色的落日，夕阳的思绪",
    themeClass: "theme-autumn-leaves",
  },
  {
    type: "节日灯火",
    label: "节日灯火",
    bg: "bg-gradient-to-br from-[#FFD700] via-[#FF6B6B] to-[#4ECDC4]",
    description: "彩色的灯火，节日的温暖",
    themeClass: "theme-festive-lights",
  },
];

export default function Write() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedBackground, setSelectedBackground] = useState<BackgroundType>("星空漫漫");
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  const createLetterMutation = trpc.letter.create.useMutation();

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

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("请输入信件内容");
      return;
    }

    if (content.length < 10) {
      toast.error("信件内容至少需要10个字符");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createLetterMutation.mutateAsync({
        content,
        backgroundType: selectedBackground,
      });

      toast.success("信件已发送，AI正在生成回信...");
      setContent("");
      setSelectedEmotions([]);
      setIsPublic(false);
      
      // Navigate back to home after success
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "发送失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBg = BACKGROUNDS.find((b) => b.type === selectedBackground);

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
            <h1 className="text-2xl font-bold text-white">写信</h1>
          </div>
          <div className="text-sm text-gray-400">
            {content.length} / 5000
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Background Selection */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFD580]" />
              选择信纸
            </h2>

            <div className="space-y-3">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.type}
                  onClick={() => setSelectedBackground(bg.type)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedBackground === bg.type
                      ? "border-[#FFD580] bg-white/10"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  <div className={`w-full h-16 rounded-md mb-3 ${bg.bg} ${bg.themeClass} relative overflow-hidden`}>
                    {/* 预览动画 */}
                    {bg.type === "星空漫漫" && (
                      <>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={`preview-star-${i}`}
                            className="star absolute rounded-full bg-white"
                            style={{
                              width: Math.random() * 1.5 + 0.5 + 'px',
                              height: Math.random() * 1.5 + 0.5 + 'px',
                              left: Math.random() * 100 + '%',
                              top: Math.random() * 100 + '%',
                              animationDelay: Math.random() * 3 + 's',
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                  <h3 className="font-semibold text-white text-sm">{bg.label}</h3>
                  <p className="text-xs text-gray-400 mt-1">{bg.description}</p>
                </button>
              ))}
            </div>

            {/* Tips */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 space-y-2">
              <p className="font-semibold text-white">💡 小贴士</p>
              <ul className="space-y-1 text-xs">
                <li>• 10-5000字之间</li>
                <li>• 完全匿名</li>
                <li>• 支持多种情绪表达</li>
                <li>• 会获得温暖回信</li>
              </ul>
            </div>
          </div>

          {/* Right: Letter Writing */}
          <div className="lg:col-span-2">
            {/* Preview */}
            <div className={`w-full rounded-lg p-8 mb-6 min-h-[400px] flex flex-col ${selectedBg?.bg} shadow-xl relative overflow-hidden ${selectedBg?.themeClass}`}>
              {/* 动画背景层 */}
              {selectedBackground === "星空漫漫" && <DynamicStarryBackground starCount={30} maxAnimationDuration={5} />}
              {selectedBackground === "牛皮纸" && <DynamicKraftBackground />}
              {selectedBackground === "樱花来信" && <DynamicPetalBackground petalCount={6} maxAnimationDuration={8} />}
              {selectedBackground === "秋日落信" && <DynamicLeafBackground leafCount={5} maxAnimationDuration={10} />}
              {selectedBackground === "节日灯火" && <DynamicLightBackground lightCount={8} maxAnimationDuration={4} />}
              
              {/* 文字内容层 */}
              <div className="flex-1 text-gray-800 dark:text-white whitespace-pre-wrap break-words font-serif text-sm leading-relaxed relative z-10">
                {content || (
                  <span className="text-gray-500 dark:text-gray-400 italic">
                    在这里开始写下你的心事...
                  </span>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                placeholder="亲爱的夜航人，我想和你分享我的心事..."
                className="w-full h-48 p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:border-[#FFD580] focus:outline-none resize-none"
              />

              {/* Emotion Tags */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  标记你的情绪（必需）
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOTION_TAGS.map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => toggleEmotion(tag.label)}
                      className={`px-4 py-2 rounded-full border-2 transition-all text-sm font-medium ${
                        selectedEmotions.includes(tag.label)
                          ? "border-[#FFD580] bg-[#FFD580]/20 text-[#FFD580]"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                      }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Public Option */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  分享设置
                </label>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    isPublic
                      ? "border-[#FFD580] bg-[#FFD580]/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  {isPublic ? (
                    <Globe className="w-5 h-5 text-[#FFD580]" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="text-left">
                    <div className="font-medium text-white">
                      {isPublic ? "公开分享" : "仅自己可见"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {isPublic
                        ? "所有人都可以看到你的信件和回信"
                        : "只有你可以看到你的信件和回信"}
                    </div>
                  </div>
                </button>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="w-full bg-[#FFD580] hover:bg-[#FFC850] text-[#0B0F2F] font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {isSubmitting ? "发送中..." : "发送信件"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
