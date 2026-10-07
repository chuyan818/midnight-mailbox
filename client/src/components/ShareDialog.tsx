import React, { useEffect, useState } from "react";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";
import { downloadLetterPoster } from "@/lib/share-poster";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  letterId: string;
  content: string;
  backgroundType?: string;
}
const labels = {
  zh: {
    x: "分享到 X",
    wechat: "微信",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "下载专属海报",
    system: "系统分享",
    posterHint: "把这封信保存成一张温柔的图片",
    posterSuccess: "海报已下载",
    posterError: "海报生成失败，请重试",
    systemError: "当前浏览器暂不支持系统分享",
  },
  en: {
    x: "Share on X",
    wechat: "WeChat",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "Download poster",
    system: "System share",
    posterHint: "Save this letter as a gentle image",
    posterSuccess: "Poster downloaded",
    posterError: "Could not create the poster",
    systemError: "System sharing is not supported here",
  },
  ja: {
    x: "Xで共有",
    wechat: "WeChat",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "ポスターを保存",
    system: "システム共有",
    posterHint: "この手紙をやさしい画像に保存",
    posterSuccess: "ポスターを保存しました",
    posterError: "ポスターを作成できませんでした",
    systemError: "このブラウザは共有に対応していません",
  },
  ko: {
    x: "X에 공유",
    wechat: "WeChat",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "포스터 다운로드",
    system: "시스템 공유",
    posterHint: "이 편지를 따뜻한 이미지로 저장하세요",
    posterSuccess: "포스터를 다운로드했습니다",
    posterError: "포스터를 만들 수 없습니다",
    systemError: "이 브라우저는 공유를 지원하지 않습니다",
  },
} as const;

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  letterId,
  content,
  backgroundType,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const { language } = useLanguage();
  const copy = pageTranslations[language].write.share;
  const localized = labels[language] || labels.zh;
  const shareUrl = `${window.location.origin}/letter/${letterId}`;
  const shareText = copy.text;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const openShareUrl = (url: string) =>
    window.open(url, "_blank", "noopener,noreferrer");
  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copiedWithFallback = document.execCommand("copy");
    textarea.remove();
    if (!copiedWithFallback) throw new Error("Copy command was rejected");
  };
  const copyToClipboard = async (showToast = true) => {
    try {
      await copyText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      if (showToast) toast.success(copy.copiedClipboard);
      return true;
    } catch {
      toast.error(copy.copy);
      return false;
    }
  };
  const shareToCopyOnly = async () => {
    if (await copyToClipboard(false)) toast.success(copy.copiedWechat);
  };
  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.info(localized.systemError);
      return;
    }
    try {
      await navigator.share({
        title: "深夜信箱",
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError")
        toast.error(localized.systemError);
    }
  };
  const handlePosterDownload = async () => {
    setIsGeneratingPoster(true);
    try {
      await downloadLetterPoster({
        content,
        shareUrl,
        letterId,
        backgroundType,
        language,
      });
      toast.success(localized.posterSuccess);
    } catch {
      toast.error(localized.posterError);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  if (!isOpen) return null;
  const buttonClass =
    "w-full min-h-12 rounded-xl px-2.5 py-3 text-sm sm:text-[15px] font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 flex items-center justify-center gap-1.5 text-center leading-tight";
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/15 bg-gradient-to-br from-[#171a43] to-[#2D2F5A] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
          <div>
            <h2
              id="share-dialog-title"
              className="text-xl font-bold text-white sm:text-2xl"
            >
              {copy.title}
            </h2>
            <p className="mt-1 text-xs text-white/55">{localized.posterHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <X size={23} />
          </button>
        </div>
        <p className="mb-5 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-center text-sm leading-6 text-gray-200 sm:text-base">
          {shareText}
        </p>
        <div className="mb-3 grid grid-cols-2 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() =>
              openShareUrl(
                `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
              )
            }
            className={`${buttonClass} bg-black text-white hover:bg-slate-800`}
          >
            <span aria-hidden="true">𝕏</span>
            {localized.x}
          </button>
          <button
            type="button"
            onClick={shareToCopyOnly}
            className={`${buttonClass} bg-[#09B981] text-white hover:bg-[#059669]`}
          >
            <span aria-hidden="true">🔗</span>
            {localized.wechat}
          </button>
          <button
            type="button"
            onClick={() =>
              openShareUrl(
                `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
              )
            }
            className={`${buttonClass} bg-[#06C755] text-white hover:bg-[#05A947]`}
          >
            <span aria-hidden="true">◉</span>
            {localized.line}
          </button>
          <button
            type="button"
            onClick={shareToCopyOnly}
            className={`${buttonClass} bg-[#FEE500] text-[#191919] hover:bg-[#E6CF00]`}
          >
            <span aria-hidden="true">✦</span>
            {localized.kakao}
          </button>
          <button
            type="button"
            onClick={shareToCopyOnly}
            className={`${buttonClass} bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white hover:opacity-90`}
          >
            <span aria-hidden="true">◎</span>
            {localized.instagram}
          </button>
          <button
            type="button"
            onClick={() =>
              openShareUrl(
                `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
              )
            }
            className={`${buttonClass} bg-[#25D366] text-white hover:bg-[#1DA851]`}
          >
            <span aria-hidden="true">◔</span>
            {localized.whatsapp}
          </button>
          <button
            type="button"
            onClick={() =>
              openShareUrl(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
              )
            }
            className={`${buttonClass} bg-[#1877F2] text-white hover:bg-[#1465D1]`}
          >
            <span aria-hidden="true">f</span>
            {localized.facebook}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard()}
            className={`${buttonClass} bg-[#8B5CF6} text-white hover:bg-[#7C3AED]`}
          >
            {copied ? (
              <>
                <Check size={18} />
                {copy.copied}
              </>
            ) : (
              <>
                <Copy size={18} />
                {copy.copy}
              </>
            )}
          </button>
        </div>
        {copied && (
          <p
            role="status"
            aria-live="polite"
            className="mb-3 text-center text-xs text-emerald-300"
          >
            {copy.copiedClipboard}
          </p>
        )}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={handlePosterDownload}
            disabled={isGeneratingPoster}
            className={`${buttonClass} bg-[#FFD580] text-[#171a43] hover:bg-[#ffe4a8] disabled:cursor-wait disabled:opacity-70`}
          >
            <Download size={18} />
            {isGeneratingPoster ? "…" : localized.poster}
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className={`${buttonClass} border border-white/20 bg-white/10 text-white hover:bg-white/20`}
            >
              <Share2 size={18} />
              {localized.system}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-11 w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          {copy.close}
        </button>
      </div>
    </div>
  );
};
