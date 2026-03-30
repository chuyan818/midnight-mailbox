import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation as useWouterLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, ArrowLeft, Sparkles, Globe, Lock } from "lucide-react";

type BackgroundType = "星空漫漫" | "牛皮纸" | "樱花来信" | "秋日落信" | "节日灯火";

const EMOTION_TAGS = [
  { emoji: "😢", label: "伤心" },
  { emoji: "😔", label: "失落" },
  { emoji: "😰", label: "焦虑" },
  { emoji: "😡", label: "愤怒" },
  { emoji: "😕", label: "困惑" },
  { emoji: "🥺", label: "委屈" },
  { emoji: "😴", label: "疲惫" },
  { emoji: "😌", label: "平静" },
];

const BACKGROUNDS: Array<{
  type: BackgroundType;
  label: string;
  bg: string;
  description: string;
}> = [
  {
    type: "星空漫漫",
    label: "星空漫漫",
    bg: "bg-gradient-to-br from-[#0b1a2a] to-[#000814]",
    description: "深蓝星空，安静治愈",
  },
  {
    type: "牛皮纸",
    label: "牛皮纸",
    bg: "bg-gradient-to-br from-[#D4A574] to-[#C9935F]",
    description: "温暖的纸张，岁月的痕迹",
  },
  {
    type: "樱花来信",
    label: "樱花来信",
    bg: "bg-gradient-to-br from-[#FFE5EC] via-[#FFD4E5] to-[#FFC0D9]",
    description: "粉色的梦幻，春日的温柔",
  },
  {
    type: "秋日落信",
    label: "秋日落信",
    bg: "bg-gradient-to-br from-[#FF9B50] via-[#FF7E5F] to-[#FFA500]",
    description: "金色的落日，夕阳的思绪",
  },
  {
    type: "节日灯火",
    label: "节日灯火",
    bg: "bg-gradient-to-br from-[#FFD700] via-[#FF6B6B] to-[#4ECDC4]",
    description: "彩色的灯火，节日的温暖",
  },
];

// 动画函数
function clearBackground() {
  const bg = document.getElementById("bgLayer");
  if (bg) bg.innerHTML = "";
}

function createStars() {
  clearBackground();
  const bg = document.getElementById("bgLayer");
  if (!bg) return;

  const style = document.createElement("style");
  style.textContent = `
    .star {
      position: absolute;
      width: 3px;
      height: 3px;
      background: white;
      border-radius: 50%;
      animation: twinkle 4s infinite;
    }
    @keyframes twinkle {
      0% { opacity: 0.3; }
      50% { opacity: 1; }
      100% { opacity: 0.3; }
    }
  `;
  bg.appendChild(style);

  for (let i = 0; i < 30; i++) {
    let star = document.createElement("div");
    star.className = "star";
    star.style.top = Math.random() * 100 + "%";
    star.style.left = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 5 + "s";
    bg.appendChild(star);
  }
}

function createPetals() {
  clearBackground();
  const bg = document.getElementById("bgLayer");
  if (!bg) return;

  const style = document.createElement("style");
  style.textContent = `
    .petal {
      position: absolute;
      width: 12px;
      height: 12px;
      background: #ffb6c1;
      border-radius: 50% 50% 50% 0;
      transform: rotate(45deg);
      opacity: 0.8;
      animation: sakuraFall linear infinite;
    }
    @keyframes sakuraFall {
      0% {
        transform: translateY(-40px) translateX(0px) rotate(0deg);
        opacity: 0;
      }
      50% {
        transform: translateY(250px) translateX(20px) rotate(180deg);
        opacity: 1;
      }
      100% {
        transform: translateY(500px) translateX(-20px) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  bg.appendChild(style);

  for (let i = 0; i < 6; i++) {
    let petal = document.createElement("div");
    petal.className = "petal";
    petal.style.left = Math.random() * 100 + "%";
    petal.style.animationDuration = 6 + Math.random() * 3 + "s";
    petal.style.animationDelay = Math.random() * 5 + "s";
    bg.appendChild(petal);
  }
}

function createLeaves() {
  clearBackground();
  const bg = document.getElementById("bgLayer");
  if (!bg) return;

  const style = document.createElement("style");
  style.textContent = `
    .leaf {
      position: absolute;
      width: 14px;
      height: 14px;
      background: #d97706;
      border-radius: 30% 0 30% 0;
      animation: leafFall linear infinite;
    }
    @keyframes leafFall {
      0% {
        transform: translateY(-40px) rotate(0deg);
      }
      100% {
        transform: translateY(500px) rotate(360deg);
      }
    }
  `;
  bg.appendChild(style);

  for (let i = 0; i < 5; i++) {
    let leaf = document.createElement("div");
    leaf.className = "leaf";
    leaf.style.left = Math.random() * 100 + "%";
    leaf.style.animationDuration = 7 + Math.random() * 3 + "s";
    bg.appendChild(leaf);
  }
}

function createLanterns() {
  clearBackground();
  const bg = document.getElementById("bgLayer");
  if (!bg) return;

  const style = document.createElement("style");
  style.textContent = `
    .lantern {
      position: absolute;
      width: 18px;
      height: 24px;
      background: linear-gradient(#ff4d4d, #cc0000);
      border-radius: 6px;
      box-shadow: 0 0 8px rgba(255,120,0,0.6);
      pointer-events: none;
      animation: lanternSwing 4s ease-in-out infinite;
      transform-origin: center top;
    }
    .lantern::before {
      content: "";
      position: absolute;
      width: 2px;
      height: 6px;
      background: #999;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
    }
    @keyframes lanternSwing {
      0% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
      100% { transform: rotate(-3deg); }
    }
  `;
  bg.appendChild(style);

  for (let i = 0; i < 8; i++) {
    let lantern = document.createElement("div");
    lantern.className = "lantern";
    lantern.style.top = Math.random() * 60 + "%";
    lantern.style.left = Math.random() * 100 + "%";
    lantern.style.animationDelay = Math.random() * 3 + "s";
    bg.appendChild(lantern);
  }
}

function createLights() {
  createLanterns();
}

function createPaperBreath() {
  clearBackground();
  const bg = document.getElementById("bgLayer");
  if (!bg) return;

  const style = document.createElement("style");
  style.textContent = `
    .paper-bg {
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom, #d6b98c, #caa472);
      animation: paperBreath 10s ease-in-out infinite;
      position: relative;
    }
    .paper-bg::after {
      content: "";
      position: absolute;
      width: 200%;
      height: 200%;
      top: -50%;
      left: -50%;
      background: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 40px 40px;
      opacity: 0.3;
      animation: paperTextureMove 20s linear infinite;
      pointer-events: none;
    }
    @keyframes paperBreath {
      0% { filter: brightness(1); }
      50% { filter: brightness(1.05); }
      100% { filter: brightness(1); }
    }
    @keyframes paperTextureMove {
      0% { transform: translate(0px, 0px); }
      100% { transform: translate(40px, 40px); }
    }
  `;
  bg.appendChild(style);

  let paper = document.createElement("div");
  paper.className = "paper-bg";
  bg.appendChild(paper);
}

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

  // 当选中背景改变时，更新动画
  useEffect(() => {
    switch (selectedBackground) {
      case "星空漫漫":
        createStars();
        break;
      case "牛皮纸":
        createPaperBreath();
        break;
      case "樱花来信":
        createPetals();
        break;
      case "秋日落信":
        createLeaves();
        break;
      case "节日灯火":
        createLights();
        break;
    }
  }, [selectedBackground]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">请先登录</h1>
          <p className="text-gray-400">登录后即可开始写信</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("请输入信件内容");
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
                  <div className={`w-full h-16 rounded-md mb-3 ${bg.bg} relative overflow-hidden`} />
                  <h3 className="font-semibold text-white text-sm">{bg.label}</h3>
                  <p className="text-xs text-gray-400 mt-1">{bg.description}</p>
                </button>
              ))}
            </div>

            {/* Tips */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 space-y-2">
              <p className="font-semibold text-white">💡 小贴士</p>
              <ul className="space-y-1 text-xs">
                <li>• 完全匿名</li>
                <li>• 支持多种情绪表达</li>
                <li>• 会获得温暖回信</li>
              </ul>
            </div>
          </div>

          {/* Right: Letter Writing */}
          <div className="lg:col-span-2">
            {/* Preview */}
            <div className={`w-full rounded-lg p-8 mb-6 min-h-[400px] flex flex-col ${selectedBg?.bg} shadow-xl relative overflow-hidden`}>
              {/* 动画背景层 */}
              <div id="bgLayer" className="absolute inset-0 pointer-events-none" />

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
                placeholder="倾诉你的秘密、烦恼、想法...（最多5000字）"
                className="w-full h-32 p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD580] focus:ring-1 focus:ring-[#FFD580]/50 resize-none"
              />

              {/* Emotion Tags */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  你现在的心情
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOTION_TAGS.map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => toggleEmotion(tag.label)}
                      className={`px-3 py-2 rounded-full border-2 transition-all text-sm ${
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
