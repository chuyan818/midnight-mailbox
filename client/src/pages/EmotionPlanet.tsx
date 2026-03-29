import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Sparkles, Filter } from "lucide-react";
import { useLocation } from "wouter";

interface EmotionStar {
  id: number;
  emotion: string;
  color: string;
  x: number;
  y: number;
  size: number;
  intensity: number;
}

const EMOTION_COLORS: Record<string, string> = {
  孤独: "#9370DB",
  压力: "#DC143C",
  想念: "#FFB6C1",
  遗憾: "#8B7355",
  希望: "#90EE90",
  快乐: "#FFD580",
  焦虑: "#FF6B6B",
  愤怒: "#FF4500",
};

export default function EmotionPlanet() {
  const [, navigate] = useLocation();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [stars, setStars] = useState<EmotionStar[]>([
    { id: 1, emotion: "孤独", color: "#9370DB", x: 20, y: 30, size: 8, intensity: 0.8 },
    { id: 2, emotion: "压力", color: "#DC143C", x: 45, y: 25, size: 6, intensity: 0.6 },
    { id: 3, emotion: "想念", color: "#FFB6C1", x: 70, y: 40, size: 7, intensity: 0.7 },
    { id: 4, emotion: "遗憾", color: "#8B7355", x: 30, y: 60, size: 5, intensity: 0.5 },
    { id: 5, emotion: "希望", color: "#90EE90", x: 80, y: 70, size: 9, intensity: 0.9 },
    { id: 6, emotion: "快乐", color: "#FFD580", x: 55, y: 50, size: 6, intensity: 0.6 },
    { id: 7, emotion: "焦虑", color: "#FF6B6B", x: 15, y: 75, size: 7, intensity: 0.7 },
    { id: 8, emotion: "愤怒", color: "#FF4500", x: 85, y: 20, size: 5, intensity: 0.5 },
    { id: 9, emotion: "孤独", color: "#9370DB", x: 50, y: 80, size: 8, intensity: 0.8 },
    { id: 10, emotion: "希望", color: "#90EE90", x: 25, y: 45, size: 6, intensity: 0.6 },
    { id: 11, emotion: "想念", color: "#FFB6C1", x: 65, y: 65, size: 7, intensity: 0.7 },
    { id: 12, emotion: "压力", color: "#DC143C", x: 40, y: 35, size: 6, intensity: 0.6 },
  ]);

  const emotionStats = Object.entries(
    stars.reduce(
      (acc, star) => {
        acc[star.emotion] = (acc[star.emotion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).sort((a, b) => b[1] - a[1]);

  const filteredStars = selectedEmotion
    ? stars.filter((star) => star.emotion === selectedEmotion)
    : stars;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0F2F]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">情绪星球</h1>
            <p className="text-gray-400 text-sm mt-1">
              {filteredStars.length} 颗情绪之星闪烁在夜空
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#FFD580]" />
                情绪分布
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedEmotion(null)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedEmotion === null
                      ? "bg-[#FFD580]/20 text-[#FFD580] border border-[#FFD580]/50"
                      : "hover:bg-white/5 text-gray-300"
                  }`}
                >
                  全部 ({stars.length})
                </button>
                {emotionStats.map(([emotion, count]) => (
                  <button
                    key={emotion}
                    onClick={() => setSelectedEmotion(emotion)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedEmotion === emotion
                        ? "bg-white/10 border border-white/20"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                      />
                      <span className="text-sm">{emotion}</span>
                    </div>
                    <span className="text-xs text-gray-500">{count}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Legend */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6">
              <h3 className="text-sm font-semibold mb-4">星星大小说明</h3>
              <div className="space-y-3 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-[#FFD580] text-[#FFD580]" />
                  <span>星星越大，该情绪越强烈</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFD580]" />
                  <span>闪烁的星星代表最近的信件</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main - Star Map */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 overflow-hidden">
              {/* Star Map SVG */}
              <svg
                viewBox="0 0 100 100"
                className="w-full aspect-square bg-gradient-to-b from-[#1C1F4A] to-[#0B0F2F]"
              >
                {/* Background grid */}
                <defs>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="0.1"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />

                {/* Stars */}
                {filteredStars.map((star) => (
                  <g
                    key={star.id}
                    onMouseEnter={() => setHoveredStar(star.id)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className="cursor-pointer"
                  >
                    {/* Glow effect */}
                    <circle
                      cx={star.x}
                      cy={star.y}
                      r={star.size * 1.5}
                      fill={star.color}
                      opacity={0.2}
                      className={
                        hoveredStar === star.id
                          ? "animate-pulse"
                          : ""
                      }
                    />

                    {/* Star */}
                    <circle
                      cx={star.x}
                      cy={star.y}
                      r={star.size}
                      fill={star.color}
                      opacity={star.intensity}
                      className={
                        hoveredStar === star.id
                          ? "animate-pulse"
                          : ""
                      }
                    />

                    {/* Highlight on hover */}
                    {hoveredStar === star.id && (
                      <circle
                        cx={star.x}
                        cy={star.y}
                        r={star.size + 2}
                        fill="none"
                        stroke={star.color}
                        strokeWidth="0.5"
                        opacity="0.8"
                      />
                    )}
                  </g>
                ))}
              </svg>

              {/* Info Panel */}
              {hoveredStar !== null && (
                <div className="p-6 border-t border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor:
                          stars.find((s) => s.id === hoveredStar)?.color,
                      }}
                    />
                    <div>
                      <p className="font-semibold">
                        {stars.find((s) => s.id === hoveredStar)?.emotion}
                      </p>
                      <p className="text-xs text-gray-400">
                        点击查看相关信件
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {emotionStats.slice(0, 4).map(([emotion, count]) => (
                <Card
                  key={emotion}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 text-center hover:border-[#FFD580]/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedEmotion(emotion)}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                  />
                  <p className="font-semibold text-sm">{emotion}</p>
                  <p className="text-2xl font-bold text-[#FFD580]">{count}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Information Section */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">关于情绪星球</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div>
              <p className="font-semibold text-white mb-2">✨ 每颗星星代表一封信</p>
              <p>
                在深夜信箱中写下的每一封信，都会在情绪星球中闪烁成一颗星星。
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">🎨 颜色代表情绪</p>
              <p>
                不同的颜色代表不同的情绪。星星的大小代表情绪的强度。
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">🌌 共同的夜空</p>
              <p>
                所有用户的情绪星星都汇聚在这个星球中，形成一个温暖的社区。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
