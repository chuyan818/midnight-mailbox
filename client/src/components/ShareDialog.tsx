import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  letterId: string;
  content: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  letterId,
  content,
}) => {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();
  const copy = pageTranslations[language].write.share;

  const shareUrl = `${window.location.origin}/letter/${letterId}`;
  const shareText = copy.text;

  const labels = {
    zh: { x: "分享到 X", wechat: "微信", line: "LINE", kakao: "KakaoTalk", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook" },
    en: { x: "Share on X", wechat: "WeChat", line: "LINE", kakao: "KakaoTalk", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook" },
    ja: { x: "Xで共有", wechat: "WeChat", line: "LINE", kakao: "KakaoTalk", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook" },
    ko: { x: "X에 공유", wechat: "WeChat", line: "LINE", kakao: "KakaoTalk", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook" },
  }[language];

  const openShareUrl = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const shareToWeb = (url: string) => openShareUrl(url);
  const shareToCopyOnly = () => {
    copyToClipboard();
    toast.success(copy.copiedWechat);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(copy.copiedClipboard);
    }).catch(() => {
      toast.error(copy.copy);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-label={copy.title}>
      <div className="bg-gradient-to-br from-[#1C1F4A] to-[#2D2F5A] rounded-lg p-5 sm:p-8 max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto border border-white/10">
        {/* 关闭按钮 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-white pr-3">{copy.title}</h2>
          <button
            onClick={onClose}
            aria-label={copy.close}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 分享文案 */}
        <p className="text-gray-300 mb-6 text-center">{shareText}</p>

        {/* 分享按钮 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* X */}
          <button
            onClick={() => shareToWeb(`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)}
            className="w-full min-h-12 bg-black hover:bg-slate-800 text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span aria-hidden="true">𝕏</span> {labels.x}
          </button>

          {/* 微信：网页端不能直接唤起好友选择，复制链接供微信分享 */}
          <button
            onClick={shareToCopyOnly}
            className="w-full min-h-12 bg-[#09B981] hover:bg-[#059669] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span aria-hidden="true">🔗</span> {labels.wechat}
          </button>

          {/* LINE */}
          <button
            onClick={() => shareToWeb(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)}
            className="w-full min-h-12 bg-[#06C755] hover:bg-[#05A947] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span aria-hidden="true">◉</span> {labels.line}
          </button>

          {/* KakaoTalk：网页端使用复制链接，避免依赖未配置的 Kakao SDK */}
          <button
            onClick={shareToCopyOnly}
            className="w-full min-h-12 bg-[#FEE500] hover:bg-[#E6CF00] text-[#191919] font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span aria-hidden="true">✦</span> {labels.kakao}
          </button>

          {/* Instagram：官方不提供网页分享链接，复制链接后可粘贴到动态或私信 */}
          <button
            onClick={shareToCopyOnly}
            className="w-full min-h-12 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-90 text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span aria-hidden="true">◎</span> {labels.instagram}
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => shareToWeb(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`)}
            className="w-full min-h-12 bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span aria-hidden="true">◔</span> {labels.whatsapp}
          </button>

          {/* Facebook */}
          <button
            onClick={() => shareToWeb(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
            className="w-full min-h-12 bg-[#1877F2] hover:bg-[#1465D1] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span aria-hidden="true">f</span> {labels.facebook}
          </button>

          {/* 复制链接 */}
          <button
            onClick={copyToClipboard}
            className="w-full min-h-12 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            {copied ? (
              <>
                <Check size={20} /> {copy.copied}
              </>
            ) : (
              <>
                <Copy size={20} /> {copy.copy}
              </>
            )}
          </button>
        </div>
        {copied && (
          <p role="status" aria-live="polite" className="mb-4 text-center text-sm text-emerald-300">
            {copy.copiedClipboard}
          </p>
        )}

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full min-h-11 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-3 rounded-lg transition whitespace-normal"
        >
          {copy.close}
        </button>
      </div>
    </div>
  );
};
