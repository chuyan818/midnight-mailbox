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

  const shareToWeChat = () => {
    // 微信分享（需要微信SDK，这里显示提示）
    toast.success(copy.copiedWechat);
    copyToClipboard();
  };

  const shareToWeibo = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(weiboUrl, "_blank");
  };

  const shareToQQ = () => {
    const qqUrl = `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
    window.open(qqUrl, "_blank");
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
        <div className="space-y-3 mb-6">
          {/* 微信分享 */}
          <button
            onClick={shareToWeChat}
            className="w-full min-h-12 bg-[#09B981] hover:bg-[#059669] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span>🔗</span> {copy.wechat}
          </button>

          {/* 微博分享 */}
          <button
            onClick={shareToWeibo}
            className="w-full min-h-12 bg-[#E74C3C] hover:bg-[#C0392B] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span>🌐</span> {copy.weibo}
          </button>

          {/* QQ分享 */}
          <button
            onClick={shareToQQ}
            className="w-full min-h-12 bg-[#3B5998] hover:bg-[#2D4373] text-white font-semibold py-3 px-3 rounded-lg transition flex items-center justify-center gap-2 whitespace-normal text-center"
          >
            <span>💬</span> {copy.qq}
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
