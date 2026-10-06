import { useEffect, useRef } from "react";

interface DynamicKraftBackgroundProps {
  className?: string;
}

export function DynamicKraftBackground({
  className = "",
}: DynamicKraftBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清空之前的内容
    containerRef.current.innerHTML = "";

    // 创建纹理层
    const textureLayer = document.createElement("div");
    textureLayer.className = "texture-layer";
    textureLayer.style.position = "absolute";
    textureLayer.style.width = "100%";
    textureLayer.style.height = "100%";
    textureLayer.style.background = "repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 2px)";
    textureLayer.style.animation = "texture-float 10s ease-in-out infinite";
    textureLayer.style.willChange = "transform";
    textureLayer.style.pointerEvents = "none";

    containerRef.current.appendChild(textureLayer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes paper-breathe {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.98;
          }
        }

        @keyframes texture-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(2px);
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          width: "100%",
          height: "100%",
          animation: "paper-breathe 6s ease-in-out infinite",
          willChange: "opacity",
        }}
      />
    </>
  );
}
