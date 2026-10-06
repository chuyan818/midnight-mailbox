import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Heart, Copy, Check, X } from "lucide-react";
import { useLocation } from "wouter";

interface Quote {
  id: number;
  content: string;
  emotion: string;
  letterCount: number;
  shareCount: number;
  date: string;
}

export default function DailyQuote() {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [quote, setQuote] = useState<Quote>({
    id: 1,
    content: "有时候，我们需要的不是答案，而是有人愿意听我们说话。",
    emotion: "孤独",
    letterCount: 342,
    shareCount: 1205,
    date: "2026-03-29",
  });

  const handleCopy = () => {
    const text = `"${quote.content}"\n\n来自深夜信箱 - 今日最孤独的句子`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showShareOptions, setShowShareOptions] = useState(false);
  const shareOptionsRef = useRef<HTMLDivElement>(null);

  const quoteUrl = `${window.location.origin}/quote/${quote.id}`;
  const quoteText = quote.content;

  useEffect(() => {
    // 点击外部关闭分享选项
    const handleClickOutside = (e: MouseEvent) => {
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(e.target as Node)) {
        setShowShareOptions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleShare = (platform: string) => {
    let url = "";
    const encodedUrl = encodeURIComponent(quoteUrl);
    const encodedText = encodeURIComponent(quoteText);

    switch (platform) {
      case "wechat":
        // 微信分享 - 显示分享链接
        navigator.clipboard.writeText(quoteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case "weibo":
        url = `https://service.weibo.com/share/share.php?title=${encodedText}&url=${encodedUrl}`;
        window.open(url, "_blank");
        break;
      case "line":
        url = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
        window.open(url, "_blank");
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        window.open(url, "_blank");
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        window.open(url, "_blank");
        break;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        window.open(url, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(quoteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
    setShowShareOptions(false);
  };

  
const shareplatforms = [
  { id: 'wechat', name: '微信', icon: '🟢', emoji: '💬' },
  { id: 'weibo', name: '微博', icon: '🔴', emoji: '📱' },
  { id: 'line', name: 'LINE', icon: '🟢', emoji: '💚' },
  { id: 'twitter', name: 'Twitter', icon: '🔵', emoji: '𝕏' },
  { id: 'facebook', name: 'Facebook', icon: '🔵', emoji: 'f' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '🟢', emoji: '💬' },
  { id: 'copy', name: '复制链接', icon: '🔗', emoji: '📋' },
];

  const emotionColors: Record<string, { bg: string; text: string; light: string }> = {
    孤独: { bg: "#9370DB", text: "#E6D5FF", light: "#9370DB20" },
    压力: { bg: "#DC143C", text: "#FFB3BA", light: "#DC143C20" },
    想念: { bg: "#FFB6C1", text: "#FFE5EB", light: "#FFB6C120" },
    遗憾: { bg: "#8B7355", text: "#D4C5B9", light: "#8B735520" },
    希望: { bg: "#90EE90", text: "#D4F1D4", light: "#90EE9020" },
  };

  const colors = emotionColors[quote.emotion] || emotionColors["孤独"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0F2F]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">今日一句</h1>
            <p className="text-gray-400 text-sm mt-1">
              最孤独的句子，最温暖的陪伴
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
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        {/* Quote Card */}
        <Card
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 overflow-hidden mb-8"
          style={{
            backgroundImage: `linear-gradient(135deg, ${colors.light} 0%, rgba(255,255,255,0.05) 100%)`,
          }}
        >
          <div className="p-8 md:p-12 space-y-8">
            {/* Quote Text */}
            <div className="space-y-6">
              <div className="text-5xl md:text-6xl text-gray-600 opacity-40">"</div>
              <p className="text-3xl md:text-4xl font-light leading-relaxed text-white">
                {quote.content}
              </p>
              <div className="text-5xl md:text-6xl text-gray-600 opacity-40 text-right">"</div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Emotion Tag */}
            <div className="flex items-center gap-4">
              <span
                className="px-4 py-2 rounded-full font-medium text-white"
                style={{ backgroundColor: colors.bg }}
              >
                {quote.emotion}
              </span>
              <span className="text-gray-400">
                来自 {quote.letterCount} 封信件中的最孤独的句子
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#FFD580]">
                  {quote.letterCount}
                </div>
                <div className="text-xs text-gray-400 mt-1">相关信件</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#FFD580]">
                  {quote.shareCount}
                </div>
                <div className="text-xs text-gray-400 mt-1">次分享</div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 col-span-2 md:col-span-1">
                <div className="text-2xl font-bold text-[#FFD580]">
                  {new Date(quote.date).toLocaleDateString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs text-gray-400 mt-1">今日</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <div className="flex-1 relative" ref={shareOptionsRef}>
                <Button
                  className="w-full bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 font-semibold py-6"
                  onClick={() => setShowShareOptions(true)}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  分享这句话
                </Button>
                {showShareOptions && (
                  <>
                    <div 
                      className="fixed inset-0 bg-black/50 z-40"
                      onClick={() => setShowShareOptions(false)}
                    />
                    <div className="fixed bottom-0 left-0 right-0 bg-[#1C1F4A] rounded-t-3xl shadow-2xl z-50"
                         style={{height: '45vh'}}>
                      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <span className="text-white text-lg font-semibold">分享到</span>
                        <button
                          onClick={() => setShowShareOptions(false)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="px-6 py-8 overflow-y-auto" style={{height: 'calc(45vh - 120px)'}}>
                        <div className="grid grid-cols-3 gap-6">
                          {shareplatforms.map((platform) => (
                            <button
                              key={platform.id}
                              onClick={() => {
                                handleShare(platform.id);
                                setShowShareOptions(false);
                              }}
                              className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-white/10 transition-all active:scale-95"
                            >
                              <div className="text-4xl">{platform.emoji}</div>
                              <span className="text-white text-sm font-medium text-center">{platform.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-white/10 bg-[#1C1F4A]">
                        <button
                          onClick={() => setShowShareOptions(false)}
                          className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                className="flex-1 border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 font-semibold py-6"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    复制文本
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Previous Quotes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">往日一句</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                date: "昨天",
                content: "我们都在黑暗中摸索，但至少我们不是一个人。",
                emotion: "希望",
              },
              {
                date: "前天",
                content: "有时候放下，不是因为不爱，而是因为爱得太深。",
                emotion: "遗憾",
              },
              {
                date: "3天前",
                content: "压力会过去，但我们会留下。",
                emotion: "压力",
              },
              {
                date: "4天前",
                content: "你不必完美，你只需要真实。",
                emotion: "孤独",
              },
            ].map((item, idx) => (
              <Card
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors p-6"
              >
                <div className="space-y-3">
                  <p className="text-gray-300 italic">"{item.content}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item.date}</span>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
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
        </div>


      </div>
    </div>
  );
}
