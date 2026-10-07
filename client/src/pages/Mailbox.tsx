import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";
import LanguageSelector from "@/components/LanguageSelector";

export default function Mailbox() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const copy = pageTranslations[language].mailbox;
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "replied" | "pending">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data: letters, isLoading, isError, refetch, isFetching } = trpc.letter.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.letter.delete.useMutation();
  useEffect(() => {
    if (deleteId === null) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDeleteId(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [deleteId]);
  const locale = { zh: "zh-CN", en: "en-US", ja: "ja-JP", ko: "ko-KR" }[language];
  const visibleLetters = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    return [...(letters ?? [])]
      .filter((letter) => {
        const matchesSearch = !query || String(letter.content).toLocaleLowerCase(locale).includes(query) || letter.emotionType?.toLocaleLowerCase(locale).includes(query);
        const matchesStatus = statusFilter === "all" || (statusFilter === "replied" ? Boolean(letter.reply) : !letter.reply);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const difference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortOrder === "newest" ? -difference : difference;
      });
  }, [letters, locale, search, sortOrder, statusFilter]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">{copy.loginTitle}</p>
          <Button onClick={() => navigate("/")} className="bg-[#FFD580] text-[#0B0F2F]">
            {copy.backHome}
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success(copy.deleted);
      refetch();
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || copy.deleteFailed);
    }
  };

  const emotionEmojis: Record<string, string> = {
    "快乐": "😊",
    "悲伤": "😢",
    "焦虑": "😰",
    "愤怒": "😠",
    "孤独": "😔",
    "迷茫": "🤔",
    "压力": "😫",
    "思念": "💭",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F]">
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
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">{copy.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector compact />
            <Button
              variant="outline"
              className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10"
              onClick={() => navigate("/profile")}
            >
              {copy.profile}
            </Button>
            <Button
              className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 flex items-center gap-2"
              onClick={() => navigate("/write")}
            >
              <Plus className="w-4 h-4" />
              {copy.newLetter}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={language === "zh" ? "搜索信件内容或情绪" : language === "ja" ? "手紙や感情を検索" : language === "ko" ? "편지와 감정 검색" : "Search letters or emotions"}
              className="h-10 w-full rounded-lg border border-white/10 bg-[#0B0F2F]/60 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#FFD580]/70 focus:ring-2 focus:ring-[#FFD580]/20"
              aria-label={language === "zh" ? "搜索信件" : "Search letters"}
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 rounded-lg border border-white/10 bg-[#0B0F2F] px-3 text-sm text-white outline-none focus:border-[#FFD580]/70" aria-label={language === "zh" ? "筛选信件状态" : "Filter letter status"}>
            <option value="all">{language === "zh" ? "全部信件" : language === "ja" ? "すべて" : language === "ko" ? "전체" : "All letters"}</option>
            <option value="replied">{language === "zh" ? "已收到回信" : language === "ja" ? "返信あり" : language === "ko" ? "답장 있음" : "Reply received"}</option>
            <option value="pending">{language === "zh" ? "等待回信" : language === "ja" ? "返信待ち" : language === "ko" ? "답장 대기" : "Waiting for reply"}</option>
          </select>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} className="h-10 rounded-lg border border-white/10 bg-[#0B0F2F] px-3 text-sm text-white outline-none focus:border-[#FFD580]/70" aria-label={language === "zh" ? "排序信件" : "Sort letters"}>
            <option value="newest">{language === "zh" ? "最新优先" : language === "ja" ? "新しい順" : language === "ko" ? "최신순" : "Newest first"}</option>
            <option value="oldest">{language === "zh" ? "最早优先" : language === "ja" ? "古い順" : language === "ko" ? "오래된순" : "Oldest first"}</option>
          </select>
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="h-10 shrink-0 border-white/15 text-white hover:bg-white/10" aria-label={language === "zh" ? "刷新信件列表" : "Refresh letters"}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {language === "zh" ? "刷新" : language === "ja" ? "更新" : language === "ko" ? "새로고침" : "Refresh"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD580]" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-300/20 bg-red-500/10 px-6 py-12 text-center text-red-100">
            <p className="mb-4">{language === "zh" ? "信件加载失败，请重试。" : language === "ja" ? "手紙を読み込めませんでした。" : language === "ko" ? "편지를 불러오지 못했어요." : "Could not load your letters."}</p>
            <Button type="button" onClick={() => refetch()} className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400">{language === "zh" ? "重新加载" : "Try again"}</Button>
          </div>
        ) : !letters || letters.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400 text-lg">{copy.empty}</p>
            <Button
              className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
              onClick={() => navigate("/write")}
            >
              {copy.start}
            </Button>
          </div>
        ) : visibleLetters.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center text-white/60">
            <p>{language === "zh" ? "没有符合筛选条件的信件。" : language === "ja" ? "条件に一致する手紙はありません。" : language === "ko" ? "조건에 맞는 편지가 없어요." : "No letters match your filters."}</p>
            <Button type="button" variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="mt-3 text-[#FFD580] hover:bg-[#FFD580]/10">{language === "zh" ? "清除筛选" : "Clear filters"}</Button>
          </div>
        ) : (
          <div className="space-y-3" aria-live="polite">
            <p className="text-xs text-white/45">{language === "zh" ? `显示 ${visibleLetters.length} / ${letters.length} 封信件` : `${visibleLetters.length} of ${letters.length} letters`}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleLetters.map((letter: any) => (
              <div
                key={letter.id}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/letter/${letter.id}`); } }}
                className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-6 transition-colors hover:border-[#FFD580]/30 focus:outline-none focus:ring-2 focus:ring-[#FFD580]/70"
                onClick={() => navigate(`/letter/${letter.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {letter.emotionType
                        ? emotionEmojis[letter.emotionType] || "💭"
                        : "✍️"}
                    </span>
                    <div>
                      <p className="text-xs text-gray-400">
                        {new Date(letter.createdAt).toLocaleDateString(locale)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(letter.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(letter.id);
                    }}
                    aria-label={language === "zh" ? "删除信件" : "Delete letter"}
                    className="rounded p-1 text-gray-400 opacity-0 transition-colors hover:text-red-400 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Preview */}
                <div className="mb-4">
                  <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
                    {String(letter.content)}
                  </p>
                </div>

                {/* Emotion & Reply Status */}
                <div className="space-y-3">
                  {letter.emotionScore !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">情绪评分:</span>
                      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#FFD580] to-[#FFC857] h-full"
                          style={{ width: `${((letter.emotionScore as number) / 100) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#FFD580]">
                        {copy.emotionScore} {letter.emotionScore as number}
                      </span>
                    </div>
                  )}

                  {letter.reply ? (
                    <div className="p-3 rounded bg-[#FFD580]/10 border border-[#FFD580]/20">
                      <p className="text-xs text-[#FFD580] font-semibold mb-1">
                        {copy.received}
                      </p>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {String(letter.reply)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400">
                        {copy.generating}
                      </p>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {letter.keywords && Array.isArray(letter.keywords) && letter.keywords.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-1">
                    {(letter.keywords as string[]).slice(0, 3).map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteId(null); }}>
          <div className="space-y-4 rounded-lg border border-white/10 bg-[#1C1F4A] p-6 max-w-sm" role="dialog" aria-modal="true" aria-labelledby="delete-letter-title">
            <h3 id="delete-letter-title" className="text-lg font-semibold text-white">{copy.confirm}</h3>
            <p className="text-gray-400">
              {copy.cannotRecover}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={() => setDeleteId(null)}
              >
                {copy.cancel}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteId && handleDelete(deleteId)}
                disabled={deleteMutation.isPending as any}
              >
                {deleteMutation.isPending ? copy.deleting : copy.confirmDelete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
