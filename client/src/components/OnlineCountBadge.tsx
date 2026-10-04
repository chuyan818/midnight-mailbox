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

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100"
      aria-live="polite"
      aria-label={`${count} ${labels[language]}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
      </span>
      <Users className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{count} {labels[language]}</span>
    </div>
  );
}
