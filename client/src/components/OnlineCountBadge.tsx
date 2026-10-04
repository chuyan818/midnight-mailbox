import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const labels = {
  zh: "人在线",
  en: "online now",
  ja: "人がオンライン",
  ko: "명 온라인",
} as const;

export default function OnlineCountBadge() {
  const { language } = useLanguage();
  const query = trpc.presence.onlineCount.useQuery(undefined, {
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const count = query.data?.onlineCount ?? 0;
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (query.data === undefined) return;
    setIsUpdating(true);
    const timer = window.setTimeout(() => setIsUpdating(false), 420);
    return () => window.clearTimeout(timer);
  }, [query.data?.onlineCount]);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100 transition-all duration-300 ${isUpdating ? "scale-[1.03] shadow-[0_0_18px_rgba(110,231,183,0.22)]" : "scale-100"}`}
      aria-live="polite"
      aria-label={`${count} ${labels[language]}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
      </span>
      <Users className="h-3.5 w-3.5" aria-hidden="true" />
      <span className={`transition-colors duration-300 ${isUpdating ? "text-emerald-50" : ""}`}>{count} {labels[language]}</span>
    </div>
  );
}
