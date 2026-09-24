import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Sparkles, Heart, TrendingUp, Lock, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";
import LanguageSelector from "@/components/LanguageSelector";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const copy = pageTranslations[language].home;

  const handleWriteLetter = () => {
    if (isAuthenticated) {
      navigate("/write");
    } else {
      navigate("/user-login");
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
            <h1 className="text-xl md:text-2xl font-bold">{copy.brand}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector compact />
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580] hover:text-[#0B0F2F]"
                  onClick={() => navigate("/mailbox")}
                >
                  {copy.mailbox}
                </Button>
                <Button
                  className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                  onClick={() => navigate("/profile")}
                >
                  {copy.profile}
                </Button>
              </>
            ) : (
              <Button
                className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                onClick={() => navigate("/user-login")}
              >
                {copy.login}
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
                {copy.heroTitle}
              </h2>
              <p className="text-lg md:text-xl text-gray-300 font-light">
                {copy.subtitle}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-6 text-gray-400">
              <p className="text-base md:text-lg leading-relaxed">
                {copy.description}
              </p>
              <p className="text-sm md:text-base leading-relaxed opacity-80">
                {copy.disclaimer}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
              <div 
                className="space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors cursor-pointer"
                onClick={() => navigate("/write")}
              >
                <Heart className="w-8 h-8 text-[#FFD580] mx-auto" />
                <h3 className="font-semibold">{copy.anonymous}</h3>
                <p className="text-sm text-gray-400">
                  {copy.anonymousDesc}
                </p>
              </div>

              <div className="space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors cursor-pointer"
                onClick={() => navigate("/public-mailbox")}
              >
                <Sparkles className="w-8 h-8 text-[#FFD580] mx-auto" />
                <h3 className="font-semibold">{copy.publicMailbox}</h3>
                <p className="text-sm text-gray-400">
                  {copy.publicMailboxDesc}
                </p>
              </div>

              <div className="space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors cursor-pointer"
                onClick={() => navigate("/daily-quote")}
              >
                <TrendingUp className="w-8 h-8 text-[#FFD580] mx-auto" />
                <h3 className="font-semibold">{copy.dailyQuote}</h3>
                <p className="text-sm text-gray-400">
                  {copy.dailyQuoteDesc}
                </p>
              </div>

              <div className="space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#FFD580]/30 transition-colors cursor-pointer"
                onClick={() => navigate("/emotion-planet")}
              >
                <Sparkles className="w-8 h-8 text-[#FFD580] mx-auto" />
                <h3 className="font-semibold">{copy.emotionPlanet}</h3>
                <p className="text-sm text-gray-400">
                  {copy.emotionPlanetDesc}
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
                {copy.startWriting}
              </Button>
              {isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 text-base font-semibold px-8 py-6"
                  onClick={() => navigate("/time-capsule")}
                >
                  <Clock className="w-5 h-5 mr-2" />
                  {copy.capsule}
                </Button>
              )}

            </div>

            {/* Pricing Preview */}
            <div className="pt-12 space-y-6">
              <h3 className="text-2xl font-semibold">{copy.choosePlan}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <div className="p-8 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <h4 className="text-xl font-semibold">{copy.freePlan}</h4>
                  </div>
                  <p className="text-3xl font-bold text-[#FFD580] mb-6">¥0</p>
                  <ul className="space-y-3 text-gray-400 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      {copy.dailyOne}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      AI温暖回信
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-600 rounded-full" />
                      <span className="text-gray-600">{copy.emotionReport}</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full border-[#FFD580] text-[#FFD580]"
                    onClick={handleWriteLetter}
                  >
                    {copy.startUsing}
                  </Button>
                </div>

                {/* Premium Plan */}
                <div className="p-8 rounded-lg bg-gradient-to-br from-[#FFD580]/20 to-[#FFC857]/10 border border-[#FFD580]/30 relative">
                  <div className="absolute -top-3 -right-3 bg-[#FFD580] text-[#0B0F2F] px-3 py-1 rounded-full text-xs font-bold">
                    {copy.recommended}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#FFD580]" />
                    <h4 className="text-xl font-semibold">{copy.memberPlan}</h4>
                  </div>
                  <p className="text-3xl font-bold text-[#FFD580] mb-2">¥29</p>
                  <p className="text-sm text-gray-400 mb-6">{copy.perMonth}</p>
                  <ul className="space-y-3 text-gray-300 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      {copy.unlimited}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      {copy.warmReply}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      {copy.fullReport}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                      {copy.trend}
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate("/profile");
                      } else {
                        navigate("/user-login");
                      }
                    }}
                  >
                    {copy.upgrade}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-12 text-center text-gray-500 text-sm">
              <p>
                {copy.footer}
                <br />
                {copy.safety}
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
