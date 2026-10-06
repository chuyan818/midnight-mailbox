import { useEffect, useRef } from "react";

interface DynamicStarryBackgroundProps {
  starCount?: number;
  maxAnimationDuration?: number;
  className?: string;
}

export function DynamicStarryBackground({
  starCount = 40,
  maxAnimationDuration = 5,
  className = "",
}: DynamicStarryBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清空之前的星星
    containerRef.current.innerHTML = "";

    // 创建星星
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = "dynamic-star";
      star.style.position = "absolute";
      star.style.width = "3px";
      star.style.height = "3px";
      star.style.background = "white";
      star.style.borderRadius = "50%";
      star.style.top = Math.random() * 100 + "%";
      star.style.left = Math.random() * 100 + "%";
      star.style.animation = `twinkle ${3 + Math.random() * (maxAnimationDuration - 3)}s infinite`;
      star.style.animationDelay = Math.random() * maxAnimationDuration + "s";
      star.style.willChange = "opacity";

      containerRef.current.appendChild(star);
    }
  }, [starCount, maxAnimationDuration]);

  return (
    <>
      <style>{`
        @keyframes twinkle {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.3;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </>
  );
}

// 樱花飘落背景组件
interface DynamicPetalBackgroundProps {
  petalCount?: number;
  maxAnimationDuration?: number;
  className?: string;
}

export function DynamicPetalBackground({
  petalCount = 8,
  maxAnimationDuration = 8,
  className = "",
}: DynamicPetalBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement("div");
      petal.className = "dynamic-petal";
      petal.style.position = "absolute";
      petal.style.width = "8px";
      petal.style.height = "8px";
      petal.style.background = "#ff69b4";
      petal.style.borderRadius = "50%";
      petal.style.top = "-20px";
      petal.style.left = Math.random() * 100 + "%";
      petal.style.animation = `petal-fall ${5 + Math.random() * (maxAnimationDuration - 5)}s ease-in linear forwards`;
      petal.style.animationDelay = Math.random() * maxAnimationDuration + "s";
      petal.style.willChange = "transform, opacity";

      containerRef.current.appendChild(petal);
    }
  }, [petalCount, maxAnimationDuration]);

  return (
    <>
      <style>{`
        @keyframes petal-fall {
          0% {
            transform: translateY(0) translateX(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100px) rotateZ(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />
    </>
  );
}

// 落叶飘落背景组件
interface DynamicLeafBackgroundProps {
  leafCount?: number;
  maxAnimationDuration?: number;
  className?: string;
}

export function DynamicLeafBackground({
  leafCount = 6,
  maxAnimationDuration = 10,
  className = "",
}: DynamicLeafBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    for (let i = 0; i < leafCount; i++) {
      const leaf = document.createElement("div");
      leaf.className = "dynamic-leaf";
      leaf.style.position = "absolute";
      leaf.style.width = "12px";
      leaf.style.height = "12px";
      leaf.style.background = "#ff9800";
      leaf.style.top = "-20px";
      leaf.style.left = Math.random() * 100 + "%";
      leaf.style.clipPath = "polygon(50% 0%, 100% 38%, 82% 100%, 50% 75%, 18% 100%, 0% 38%)";
      leaf.style.animation = `leaf-fall ${6 + Math.random() * (maxAnimationDuration - 6)}s ease-in linear forwards`;
      leaf.style.animationDelay = Math.random() * maxAnimationDuration + "s";
      leaf.style.willChange = "transform, opacity";

      containerRef.current.appendChild(leaf);
    }
  }, [leafCount, maxAnimationDuration]);

  return (
    <>
      <style>{`
        @keyframes leaf-fall {
          0% {
            transform: translateY(0) translateX(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(150px) rotateZ(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />
    </>
  );
}

// 灯光闪烁背景组件
interface DynamicLightBackgroundProps {
  lightCount?: number;
  maxAnimationDuration?: number;
  className?: string;
}

export function DynamicLightBackground({
  lightCount = 8,
  maxAnimationDuration = 4,
  className = "",
}: DynamicLightBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    for (let i = 0; i < lightCount; i++) {
      const light = document.createElement("div");
      light.className = "dynamic-light";
      light.style.position = "absolute";
      light.style.width = "6px";
      light.style.height = "6px";
      light.style.background = "#ffeb3b";
      light.style.borderRadius = "50%";
      light.style.left = (i * (100 / lightCount)) + "%";
      light.style.top = "20%";
      light.style.animation = `light-flicker ${2 + Math.random() * (maxAnimationDuration - 2)}s ease-in-out infinite`;
      light.style.animationDelay = Math.random() * maxAnimationDuration + "s";
      light.style.willChange = "opacity";
      light.style.boxShadow = "0 0 10px rgba(255, 235, 59, 0.8)";

      containerRef.current.appendChild(light);
    }
  }, [lightCount, maxAnimationDuration]);

  return (
    <>
      <style>{`
        @keyframes light-flicker {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </>
  );
}
