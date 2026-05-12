import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation as useWouterLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, ArrowLeft, Sparkles, Globe, Lock } from "lucide-react";
import { LetterSendingAnimation } from "@/components/LetterSendingAnimation";
import { ShareDialog } from "@/components/ShareDialog";
import { SaveTemplateDialog } from "@/components/SaveTemplateDialog";
import { TemplateSelector } from "@/components/TemplateSelector";

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
  const [showSendingAnimation, setShowSendingAnimation] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [lastLetterId, setLastLetterId] = useState<string>("");

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
    setShowSendingAnimation(true);
    try {
      const result = await createLetterMutation.mutateAsync({
        content,
        backgroundType: selectedBackground,
      });

      setLastLetterId(result.id);
      // 动画完成后显示分享和模板保存选项
    } catch (error: any) {
      setShowSendingAnimation(false);
      toast.error(error.message || "发送失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowSendingAnimation(false);
    // 显示分享对话框
    setShowShareDialog(true);
  };

  const handleShareDialogClose = () => {
    setShowShareDialog(false);
    // 显示模板保存对话框
    setShowTemplateDialog(true);
  };

  const handleTemplateDialogClose = () => {
    setShowTemplateDialog(false);
    // 重置表单
    setContent("");
    setSelectedEmotions([]);
    setIsPublic(false);
    // 导航到信件详情页
    if (lastLetterId) {
      navigate(`/letter/${lastLetterId}`);
    }
  };

  const selectedBg = BACKGROUNDS.find((b) => b.type === selectedBackground);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F]">
      {/* 发送动画 */}
      <LetterSendingAnimation
        isVisible={showSendingAnimation}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* 分享对话框 */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={handleShareDialogClose}
        letterId={lastLetterId}
        content={content}
      />

      {/* 模板保存对话框 */}
      <SaveTemplateDialog
        isOpen={showTemplateDialog}
        onClose={handleTemplateDialogClose}
        content={content}
        backgroundType={selectedBackground}
        emotions={selectedEmotions}
      />

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
              <ArrowLeft size={24} />
            </Button>
            <h1 className="text-2xl font-bold text-white">写信</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Letter Preview */}
          <div className="lg:col-span-2">
            <div
              className={`${selectedBg?.bg} rounded-lg p-8 min-h-[500px] flex flex-col justify-between relative overflow-hidden`}
            >
              {/* Background animations */}
              <div id="bgLayer" className="absolute inset-0"></div>

              {/* Letter content */}
              <div className="relative z-10">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="在这里写下你的心事..."
                  className="w-full h-80 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none text-lg leading-relaxed"
                />
              </div>

              {/* Letter footer */}
              <div className="relative z-10 text-right text-gray-300 text-sm">
                {new Date().toLocaleDateString("zh-CN")}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-6">
            {/* Template Selector */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">快速加载</h3>
              <TemplateSelector
                onLoadTemplate={(templateContent, templateBg, templateEmotions) => {
                  setContent(templateContent);
                  setSelectedBackground(templateBg as BackgroundType);
                  setSelectedEmotions(templateEmotions);
                  toast.success("模板已加载");
                }}
              />
            </div>

            {/* Background Selection */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">选择信纸</h3>
              <div className="space-y-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.type}
                    onClick={() => setSelectedBackground(bg.type)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      selectedBackground === bg.type
                        ? "bg-[#8B5CF6] text-white"
                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emotion Tags */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">当前情绪</h3>
              <div className="grid grid-cols-4 gap-2">
                {EMOTION_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => toggleEmotion(tag.label)}
                    className={`text-2xl p-2 rounded-lg transition ${
                      selectedEmotions.includes(tag.label)
                        ? "bg-[#8B5CF6] scale-110"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    title={tag.label}
                  >
                    {tag.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">隐私设置</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-300 flex items-center gap-2">
                  {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                  {isPublic ? "公开分享" : "仅自己可见"}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Send size={20} />
              {isSubmitting ? "发送中..." : "发送信件"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
