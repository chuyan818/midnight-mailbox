import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";
import { createLetterPoster, downloadPosterBlob } from "@/lib/share-poster";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  letterId: string;
  content: string;
  backgroundType?: string;
}
type GuidePlatform = "wechat" | "kakao" | "instagram";

const labels = {
  zh: {
    x: "分享到 X",
    wechat: "微信",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "生成海报",
    system: "系统分享",
    posterHint: "把这封信保存成一张温柔的图片",
    posterSuccess: "海报已保存",
    posterError: "海报生成失败，请重试",
    systemError: "当前浏览器暂不支持系统分享",
    previewTitle: "海报预览",
    previewHint: "长按图片保存到相册，也可以用系统分享发送",
    saveImage: "保存图片",
    shareImage: "分享海报",
    closePreview: "返回分享",
    copiedTitle: "链接已复制",
    copiedAgain: "再次复制链接",
    openApp: "尝试打开 KakaoTalk",
    wechatGuide: "打开微信后，进入聊天或朋友圈，粘贴链接即可分享。",
    wechatInApp:
      "你正在微信内浏览，请点击右上角「···」，选择发送给朋友或分享到朋友圈。",
    kakaoGuide:
      "网页端无法直接打开 KakaoTalk 分享窗口，已复制链接，请在 KakaoTalk 聊天中粘贴发送。",
    instagramGuide:
      "已复制链接，你可以打开 Instagram，将链接粘贴到个人简介、动态或私信中。",
    copiedHint: "下一步怎么分享？",
    posterReady: "海报已生成，长按图片即可保存。",
  },
  en: {
    x: "Share on X",
    wechat: "WeChat",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "Create poster",
    system: "System share",
    posterHint: "Save this letter as a gentle image",
    posterSuccess: "Poster saved",
    posterError: "Could not create the poster",
    systemError: "System sharing is not supported here",
    previewTitle: "Poster preview",
    previewHint: "Long-press to save, or use system share",
    saveImage: "Save image",
    shareImage: "Share poster",
    closePreview: "Back to sharing",
    copiedTitle: "Link copied",
    copiedAgain: "Copy again",
    openApp: "Try KakaoTalk",
    wechatGuide: "Open WeChat, enter a chat or Moments, then paste the link.",
    wechatInApp:
      "You are in WeChat. Tap ··· in the top-right and choose a sharing option.",
    kakaoGuide:
      "KakaoTalk web sharing is unavailable here. Paste the copied link into a KakaoTalk chat.",
    instagramGuide:
      "The link is copied. Paste it into an Instagram bio, post, or direct message.",
    copiedHint: "What next?",
    posterReady: "Poster ready. Long-press the image to save it.",
  },
  ja: {
    x: "Xで共有",
    wechat: "WeChat",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "ポスターを作成",
    system: "システム共有",
    posterHint: "この手紙をやさしい画像に保存",
    posterSuccess: "ポスターを保存しました",
    posterError: "ポスターを作成できませんでした",
    systemError: "このブラウザは共有に対応していません",
    previewTitle: "ポスターのプレビュー",
    previewHint: "長押しで保存、またはシステム共有",
    saveImage: "画像を保存",
    shareImage: "ポスターを共有",
    closePreview: "共有に戻る",
    copiedTitle: "リンクをコピーしました",
    copiedAgain: "もう一度コピー",
    openApp: "KakaoTalkを開く",
    wechatGuide: "WeChatを開いてリンクを貼り付けてください。",
    wechatInApp: "右上の「…」から共有してください。",
    kakaoGuide: "リンクをKakaoTalkのチャットに貼り付けてください。",
    instagramGuide:
      "コピーしたリンクをInstagramのプロフィールやDMに貼り付けてください。",
    copiedHint: "次の操作",
    posterReady: "ポスターの準備ができました。長押しで保存できます。",
  },
  ko: {
    x: "X에 공유",
    wechat: "WeChat",
    line: "LINE",
    kakao: "KakaoTalk",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    poster: "포스터 만들기",
    system: "시스템 공유",
    posterHint: "이 편지를 따뜻한 이미지로 저장하세요",
    posterSuccess: "포스터를 저장했습니다",
    posterError: "포스터를 만들 수 없습니다",
    systemError: "이 브라우저는 공유를 지원하지 않습니다",
    previewTitle: "포스터 미리보기",
    previewHint: "길게 눌러 저장하거나 시스템 공유를 사용하세요",
    saveImage: "이미지 저장",
    shareImage: "포스터 공유",
    closePreview: "공유로 돌아가기",
    copiedTitle: "링크를 복사했습니다",
    copiedAgain: "다시 복사",
    openApp: "KakaoTalk 열기",
    wechatGuide: "WeChat을 열고 채팅에 링크를 붙여넣으세요.",
    wechatInApp: "오른쪽 위 ‘…’에서 공유하세요.",
    kakaoGuide: "복사한 링크를 KakaoTalk 채팅에 붙여넣으세요.",
    instagramGuide: "복사한 링크를 Instagram 프로필이나 DM에 붙여넣으세요.",
    copiedHint: "다음 단계",
    posterReady: "포스터가 준비되었습니다. 길게 눌러 저장하세요.",
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
  const [poster, setPoster] = useState<{ url: string; blob: Blob } | null>(
    null
  );
  const [guidePlatform, setGuidePlatform] = useState<GuidePlatform | null>(
    null
  );
  const { language } = useLanguage();
  const copy = pageTranslations[language].write.share;
  const localized = labels[language] || labels.zh;
  const shareUrl = `${window.location.origin}/letter/${letterId}`;
  const shareText = copy.text;
  const isWechatBrowser =
    typeof navigator !== "undefined" &&
    /MicroMessenger/i.test(navigator.userAgent);

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

  useEffect(
    () => () => {
      if (poster?.url) URL.revokeObjectURL(poster.url);
    },
    [poster?.url]
  );

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
  const shareToCopyOnly = async (platform: GuidePlatform) => {
    if (await copyToClipboard(false)) {
      setGuidePlatform(platform);
    }
  };
  const getPoster = async () => {
    if (poster) return poster;
    const blob = await createLetterPoster({
      content,
      shareUrl,
      letterId,
      backgroundType,
      language,
    });
    const next = { blob, url: URL.createObjectURL(blob) };
    setPoster(next);
    return next;
  };
  const handlePosterPreview = async () => {
    setIsGeneratingPoster(true);
    try {
      await getPoster();
    } catch {
      toast.error(localized.posterError);
    } finally {
      setIsGeneratingPoster(false);
    }
  };
  const handlePosterDownload = async () => {
    setIsGeneratingPoster(true);
    try {
      const result = await getPoster();
      downloadPosterBlob(result.blob, letterId);
      toast.success(localized.posterSuccess);
    } catch {
      toast.error(localized.posterError);
    } finally {
      setIsGeneratingPoster(false);
    }
  };
  const handlePosterShare = async () => {
    try {
      const result = await getPoster();
      const file = new File([result.blob], `midnight-mailbox-${letterId}.png`, {
        type: "image/png",
      });
      if (navigator.share && navigator.canShare?.({ files: [file] }))
        await navigator.share({
          title: "深夜信箱",
          text: shareText,
          files: [file],
        });
      else {
        downloadPosterBlob(result.blob, letterId);
        toast.info(localized.posterReady);
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError")
        toast.error(localized.systemError);
    }
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
  const launchKakao = () => {
    window.location.href = "kakaotalk://";
    window.setTimeout(() => {
      if (document.visibilityState === "visible")
        toast.info(localized.kakaoGuide);
    }, 1200);
  };

  if (!isOpen) return null;
  const buttonClass =
    "w-full min-h-12 rounded-xl px-2.5 py-3 text-sm sm:text-[15px] font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 flex items-center justify-center gap-1.5 text-center leading-tight";
  const guideText =
    guidePlatform === "wechat"
      ? isWechatBrowser
        ? localized.wechatInApp
        : localized.wechatGuide
      : guidePlatform === "kakao"
        ? localized.kakaoGuide
        : localized.instagramGuide;

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
        {poster ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2
                id="share-dialog-title"
                className="text-xl font-bold text-white sm:text-2xl"
              >
                {localized.previewTitle}
              </h2>
              <button
                type="button"
                onClick={() => setPoster(null)}
                aria-label={localized.closePreview}
                className="flex h-11 w-11 items-center justify-center rounded-full text-gray-300 hover:bg-white/10"
              >
                <X size={23} />
              </button>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <img
                src={poster.url}
                alt={localized.previewTitle}
                className="mx-auto max-h-[55dvh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
            <p className="text-center text-xs leading-5 text-white/65">
              {localized.previewHint}
              <br />
              {localized.posterReady}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handlePosterDownload}
                className={`${buttonClass} bg-[#FFD580] text-[#171a43] hover:bg-[#ffe4a8]`}
              >
                <Download size={18} />
                {localized.saveImage}
              </button>
              <button
                type="button"
                onClick={handlePosterShare}
                className={`${buttonClass} border border-white/20 bg-white/10 text-white hover:bg-white/20`}
              >
                <Share2 size={18} />
                {localized.shareImage}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPoster(null)}
              className="min-h-11 w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              {localized.closePreview}
            </button>
          </div>
        ) : guidePlatform ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="share-dialog-title"
                  className="text-xl font-bold text-white sm:text-2xl"
                >
                  {localized.copiedTitle}
                </h2>
                <p className="mt-1 text-xs text-white/55">
                  {localized.copiedHint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuidePlatform(null)}
                aria-label={copy.close}
                className="flex h-11 w-11 items-center justify-center rounded-full text-gray-300 hover:bg-white/10"
              >
                <X size={23} />
              </button>
            </div>
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
              <Check className="mb-2 text-emerald-300" size={24} />
              {guideText}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => copyToClipboard()}
                className={`${buttonClass} border border-white/20 bg-white/10 text-white hover:bg-white/20`}
              >
                <Copy size={18} />
                {localized.copiedAgain}
              </button>
              <button
                type="button"
                onClick={handlePosterPreview}
                className={`${buttonClass} bg-[#FFD580] text-[#171a43] hover:bg-[#ffe4a8]`}
              >
                <ImageIcon size={18} />
                {localized.poster}
              </button>
            </div>
            {guidePlatform === "kakao" && (
              <button
                type="button"
                onClick={launchKakao}
                className={`${buttonClass} border border-[#FEE500]/40 bg-[#FEE500] text-[#191919] hover:bg-[#E6CF00]`}
              >
                <ExternalLink size={18} />
                {localized.openApp}
              </button>
            )}
            <button
              type="button"
              onClick={() => setGuidePlatform(null)}
              className="min-h-11 w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              {copy.close}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
              <div>
                <h2
                  id="share-dialog-title"
                  className="text-xl font-bold text-white sm:text-2xl"
                >
                  {copy.title}
                </h2>
                <p className="mt-1 text-xs text-white/55">
                  {localized.posterHint}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-white/10"
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
                onClick={() => shareToCopyOnly("wechat")}
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
                onClick={() => shareToCopyOnly("kakao")}
                className={`${buttonClass} bg-[#FEE500] text-[#191919] hover:bg-[#E6CF00]`}
              >
                <span aria-hidden="true">✦</span>
                {localized.kakao}
              </button>
              <button
                type="button"
                onClick={() => shareToCopyOnly("instagram")}
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
                className={`${buttonClass} bg-[#8B5CF6] text-white hover:bg-[#7C3AED]`}
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
                onClick={handlePosterPreview}
                disabled={isGeneratingPoster}
                className={`${buttonClass} bg-[#FFD580] text-[#171a43] hover:bg-[#ffe4a8] disabled:cursor-wait disabled:opacity-70`}
              >
                <ImageIcon size={18} />
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
              className="mt-3 min-h-11 w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              {copy.close}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
