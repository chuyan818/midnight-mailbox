import { useEffect, useState, type CSSProperties } from "react";
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
import { ThemeSelector } from "@/components/ThemeSelector";
import { getThemeConfig } from "@/config/themes";
import {
  BACKGROUND_TO_THEME,
  THEME_TO_BACKGROUND,
  BackgroundType,
} from "@/lib/write-theme-mapping";
import { THEME_ELEMENT_LIMITS } from "@/lib/theme-performance";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";
import LanguageSelector from "@/components/LanguageSelector";

const EMOTION_TAGS = [
  { emoji: "😢", label: "伤心" },
  { emoji: "😔", label: "失落" },
  { emoji: "😰", label: "焦虑" },
  { emoji: "😡", label: "愤怒" },
  { emoji: "😕", label: "困惑" },
  { emoji: "🥺", label: "委屈" },
  { emoji: "😴", label: "疲惫" },
  { emoji: "😌", label: "平静" },
] as const;

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

  for (let i = 0; i < THEME_ELEMENT_LIMITS.stars; i++) {
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

  for (let i = 0; i < THEME_ELEMENT_LIMITS.petals; i++) {
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

  for (let i = 0; i < THEME_ELEMENT_LIMITS.leaves; i++) {
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

  for (let i = 0; i < THEME_ELEMENT_LIMITS.lanterns; i++) {
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
  const { language } = useLanguage();
  const copy = pageTranslations[language].write;
  const [selectedBackground, setSelectedBackground] = useState<BackgroundType>(
    () => {
      if (typeof window === "undefined") return "星空漫漫";
      const savedTheme = window.localStorage.getItem(
        "midnight-mailbox-selected-theme"
      ) as keyof typeof THEME_TO_BACKGROUND | null;
      return savedTheme && savedTheme in THEME_TO_BACKGROUND
        ? THEME_TO_BACKGROUND[savedTheme]
        : "星空漫漫";
    }
  );
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSendingAnimation, setShowSendingAnimation] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [lastLetterId, setLastLetterId] = useState<string>("");
  const localizedBackgrounds = BACKGROUNDS.map(background => ({
    ...background,
    label:
      copy.themes[
        (
          {
            星空漫漫: "starry",
            牛皮纸: "kraft",
            樱花来信: "cherry",
            秋日落信: "autumn",
            节日灯火: "festive",
          } as const
        )[background.type]
      ],
  }));

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const createLetterMutation = trpc.letter.create.useMutation();

  // 当选中背景改变时，更新动画
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) clearBackground();

    // 即使用户关闭动态效果，也保留静态主题元素；全局 CSS 会禁用其动画。
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

  useEffect(() => {
    if (selectedBackground === "星空漫漫") {
      window.localStorage.removeItem("midnight-mailbox-selected-theme");
      return;
    }
    window.localStorage.setItem(
      "midnight-mailbox-selected-theme",
      BACKGROUND_TO_THEME[selectedBackground]
    );
  }, [selectedBackground]);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("sharePreview") === "1"
    ) {
      setContent(value => value || "分享预览");
      setLastLetterId("share-preview");
      setShowShareDialog(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            {copy.loginTitle}
          </h1>
          <p className="text-gray-400">{copy.loginDesc}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error(copy.sendError);
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
      toast.error(error.message || copy.sendFailed);
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

  const selectedBg = BACKGROUNDS.find(b => b.type === selectedBackground);
  const selectedTheme = BACKGROUND_TO_THEME[selectedBackground];
  const themeConfig = getThemeConfig(selectedTheme);
  const editorPlaceholderColors: Record<typeof selectedTheme, string> = {
    "starry-night": "rgba(232, 232, 240, 0.68)",
    "vintage-kraft": "rgba(61, 40, 23, 0.62)",
    "cherry-blossom": "rgba(136, 14, 79, 0.58)",
    "autumn-leaves": "rgba(120, 53, 15, 0.68)",
    "festive-lights": "rgba(120, 53, 15, 0.68)",
  };
  const editorStyle = {
    color: themeConfig.textColor,
    caretColor: themeConfig.accentColor,
    "--write-placeholder-color": editorPlaceholderColors[selectedTheme],
  } as CSSProperties;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] theme-${selectedTheme}`}
    >
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
            <h1 className="text-2xl font-bold text-white">{copy.title}</h1>
          </div>
          <LanguageSelector compact />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Letter Preview */}
          <div className="lg:col-span-2">
            <div
              className={`${selectedBg?.bg} theme-${selectedTheme} rounded-lg p-8 min-h-[500px] flex flex-col justify-between relative overflow-hidden`}
              style={{
                background:
                  themeConfig.backgroundGradient ?? themeConfig.backgroundColor,
                color: themeConfig.textColor,
              }}
            >
              {/* Background animations */}
              <div
                id="bgLayer"
                className="sky-background absolute inset-0 pointer-events-none"
              ></div>

              {/* Letter content */}
              <div className="relative z-10">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={copy.placeholder}
                  aria-label={copy.placeholder}
                  style={editorStyle}
                  className="w-full h-80 resize-none rounded-xl border border-black/10 bg-white/10 px-4 py-3 text-lg leading-relaxed placeholder-[color:var(--write-placeholder-color)] shadow-inner outline-none transition focus:border-black/25 focus:bg-white/15 focus:ring-2 focus:ring-black/10"
                />
              </div>

              {/* Letter footer */}
              <div
                className="relative z-10 text-right text-sm"
                style={{ color: themeConfig.textColor, opacity: 0.68 }}
              >
                {new Date().toLocaleDateString("zh-CN")}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-6">
            {/* Unified Theme Selector */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">{copy.theme}</h3>
              <ThemeSelector
                selectedTheme={selectedTheme}
                onThemeChange={themeId =>
                  setSelectedBackground(THEME_TO_BACKGROUND[themeId])
                }
                onReset={() => {
                  setSelectedBackground("星空漫漫");
                }}
              />
            </div>

            {/* Background Selection */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">{copy.paper}</h3>
              <div className="space-y-2">
                {localizedBackgrounds.map(bg => (
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
              <h3 className="text-white font-semibold mb-4">{copy.emotion}</h3>
              <div className="grid grid-cols-4 gap-2">
                {EMOTION_TAGS.map(tag => (
                  <button
                    key={tag.label}
                    onClick={() => toggleEmotion(tag.label)}
                    className={`text-2xl p-2 rounded-lg transition ${
                      selectedEmotions.includes(tag.label)
                        ? "bg-[#8B5CF6] scale-110"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    title={copy.emotionTags[tag.label]}
                  >
                    {tag.emoji}
                    <span className="sr-only">
                      {copy.emotionTags[tag.label]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4">{copy.privacy}</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-300 flex items-center gap-2">
                  {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                  {isPublic ? copy.public : copy.private}
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
              {isSubmitting ? copy.sending : copy.send}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
