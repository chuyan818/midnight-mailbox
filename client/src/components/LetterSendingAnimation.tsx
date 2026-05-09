import React, { useEffect, useState } from "react";

interface LetterSendingAnimationProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

export const LetterSendingAnimation: React.FC<LetterSendingAnimationProps> = ({
  isVisible,
  onAnimationComplete,
}) => {
  const [stage, setStage] = useState<"sending" | "sent" | "done">("sending");

  useEffect(() => {
    if (!isVisible) {
      setStage("sending");
      return;
    }

    // 发送动画阶段：2秒
    const sendTimer = setTimeout(() => {
      setStage("sent");
    }, 2000);

    // 完成阶段：3秒
    const completeTimer = setTimeout(() => {
      setStage("done");
      onAnimationComplete?.();
    }, 3000);

    return () => {
      clearTimeout(sendTimer);
      clearTimeout(completeTimer);
    };
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative w-80 h-96">
        {/* 发送中动画 */}
        {stage === "sending" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* 飞行的信封 */}
            <div className="relative w-32 h-24 mb-8">
              <div className="letter-flying">
                <div className="w-32 h-24 bg-gradient-to-br from-[#FFE5EC] to-[#FFD4E5] rounded-lg shadow-2xl flex items-center justify-center border-2 border-white/30">
                  <div className="text-4xl">✉️</div>
                </div>
              </div>
            </div>

            {/* 加载文字 */}
            <div className="text-center">
              <p className="text-white text-lg font-semibold mb-4">信件正在飞向深夜...</p>
              <div className="flex justify-center gap-2">
                <div className="dot-pulse w-3 h-3 bg-white rounded-full"></div>
                <div className="dot-pulse w-3 h-3 bg-white rounded-full" style={{ animationDelay: "0.2s" }}></div>
                <div className="dot-pulse w-3 h-3 bg-white rounded-full" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* 已发送动画 */}
        {stage === "sent" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative w-32 h-24 mb-8">
              <div className="letter-sent">
                <div className="w-32 h-24 bg-gradient-to-br from-[#FFE5EC] to-[#FFD4E5] rounded-lg shadow-2xl flex items-center justify-center border-2 border-white/30">
                  <div className="text-4xl">✉️</div>
                </div>
              </div>
            </div>

            {/* 成功文字和星星 */}
            <div className="text-center">
              <p className="text-white text-lg font-semibold mb-4">信件已送达！</p>
              <div className="flex justify-center gap-4">
                <span className="text-3xl star-twinkle">⭐</span>
                <span className="text-3xl star-twinkle" style={{ animationDelay: "0.3s" }}>✨</span>
                <span className="text-3xl star-twinkle" style={{ animationDelay: "0.6s" }}>⭐</span>
              </div>
            </div>
          </div>
        )}

        {/* 动画样式 */}
        <style>{`
          @keyframes letterFly {
            0% {
              transform: translateY(200px) translateX(-100px) rotateZ(-45deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-200px) translateX(100px) rotateZ(45deg);
              opacity: 0;
            }
          }

          @keyframes letterSent {
            0% {
              transform: scale(1) rotateZ(0deg);
            }
            50% {
              transform: scale(1.1) rotateZ(5deg);
            }
            100% {
              transform: scale(1) rotateZ(0deg);
            }
          }

          @keyframes dotPulse {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }

          @keyframes starTwinkle {
            0%, 100% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .letter-flying {
            animation: letterFly 2s ease-in-out forwards;
          }

          .letter-sent {
            animation: letterSent 1s ease-in-out infinite;
          }

          .dot-pulse {
            animation: dotPulse 1.4s ease-in-out infinite;
          }

          .star-twinkle {
            animation: starTwinkle 1.5s ease-in-out infinite;
            display: inline-block;
          }
        `}</style>
      </div>
    </div>
  );
};
