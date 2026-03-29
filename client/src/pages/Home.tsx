import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Sparkles, Heart, TrendingUp, Lock } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleWriteLetter = () => {
    if (isAuthenticated) {
      navigate("/write");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white overflow-hidden">
      {/* Animated background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse" style={{ top: "10%", left: "10%" }} />
        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse" style={{ top: "20%", left: "80%", animationDelay: "1s" }} />
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse" style={{ top: "50%", left: "15%", animationDelay: "2s" }} />
        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-35 animate-pulse" style={{ top: "70%", left: "85%", animationDelay: "1.5s" }} />
        <div className="absolute w-1 h-1 bg-white rounded-full opacity-25 animate-pulse" style={{ top: "40%", left: "90%", animationDelay: "2.5s" }} />
        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-30 animate-pulse" style={{ top: "60%", left: "5%", animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 py-4 md:px-12 md:py-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-[#FFD580]" />
            <h1 className="text-xl md:text-2xl font-bold">深夜信箱</h1>
          </div>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580] hover:text-[#0B0F2F]"
                  onClick={() => navigate("/mailbox")}
                >
                  我的信箱
                </Button>
                <Button
                  className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                  onClick={() => navigate("/profile")}
                >
                  个人中心
                </Button>
              </>
            ) : (
              <Button
                className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                onClick={() => window.location.href = getLoginUrl()}
              >
                登录
              </Button>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-6 md:px-12 py-12">
          <div className="max-w-2xl text-center space-y-8 animate-fade-in">
            {/* Main Title */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#FFD580] to-[#FFC857] bg-clip-text text-transparent">
                深夜信箱
              </h2>
              <p className="text-lg md:text-xl text-gray-300 font-light">
                一个温暖的深夜陪伴
              </p>
            </div>

            {/* Description */}
            <div className="space-y-6 text-gray-400">
              <p className="text-base md:text-lg leading-relaxed">
                在深夜，当你感到孤独、焦虑或压力时，
                <br />
                把心事写进信箱，我们会用温柔的话语陪伴你。
              </p>
              <p className="text-sm md:text-base leading-relaxed opacity-80">
                不是心理医生，不是导师，
                <br />
                只是一个认真读信、温柔回复的人。
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
              <div className="space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors">
                <Heart className="w-8 h-8 text-[#FFD580] mx-auto" />
                <h3 className="font-semibold">匿名倾诉</h3>
                <p className="text-sm text-gray-400">
                  完全匿名，没有评判，只有理解
                </p>
              </div>

              <div className="space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors">
                <Sparkles className="w-8 h-8 text-[#FFD580] mx-auto" />
                <h3 className="font-semibold">AI温暖回信</h3>
                <p className="text-sm text-gray-400">
                  获得温柔、治愈的AI回复
                </p>
              </div>

              <div className="space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors">
                <TrendingUp className="w-8 h-8 text-[#FFD580] mx-auto" />
                <h3 className="font-semibold">情绪报告</h3>
                <p className="text-sm text-gray-400">
                  追踪情绪变化，了解自己
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 text-base font-semibold px-8 py-6"
                onClick={handleWriteLetter}
              >
                开始写信
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 text-base font-semibold px-8 py-6"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  登录账户
                </Button>
              )}
            </div>

            {/* Pricing Preview */}
            <div className="pt-12 space-y-6">
              <h3 className="text-2xl font-semibold">选择适合你的方案</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <div className="p-8 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <h4 className="text-xl font-semibold">免费版</h4>
                  </div>
                  <p className="text-3xl font-bold text-[#FFD580] mb-6">¥0</p>
                  <ul className="space-y-3 text-gray-400 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      每天1封信
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      AI温暖回信
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-600 rounded-full" />
                      <span className="text-gray-600">情绪趋势报告</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full border-[#FFD580] text-[#FFD580]"
                    onClick={handleWriteLetter}
                  >
                    开始使用
                  </Button>
                </div>

                {/* Premium Plan */}
                <div className="p-8 rounded-lg bg-gradient-to-br from-[#FFD580]/20 to-[#FFC857]/10 border border-[#FFD580]/30 relative">
                  <div className="absolute -top-3 -right-3 bg-[#FFD580] text-[#0B0F2F] px-3 py-1 rounded-full text-xs font-bold">
                    推荐
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#FFD580]" />
                    <h4 className="text-xl font-semibold">会员版</h4>
                  </div>
                  <p className="text-3xl font-bold text-[#FFD580] mb-2">¥29</p>
                  <p className="text-sm text-gray-400 mb-6">/月 或 ¥288/年</p>
                  <ul className="space-y-3 text-gray-300 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      无限写信
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      AI温暖回信
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      完整情绪报告
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      7天情绪趋势
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate("/profile");
                      } else {
                        window.location.href = getLoginUrl();
                      }
                    }}
                  >
                    升级会员
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-12 text-center text-gray-500 text-sm">
              <p>
                深夜信箱致力于为每个人提供温暖的陪伴
                <br />
                如果你有自伤倾向，请寻求专业心理健康帮助
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
