import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

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

  const shareUrl = `${window.location.origin}/letter/${letterId}`;
  const shareText = `我在深夜信箱里写下了我的心事，AI给了我温暖的回复。你也来试试吧！`;

  const shareToWeChat = () => {
    // 微信分享（需要微信SDK，这里显示提示）
    toast.success("已复制分享链接，可在微信中分享");
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
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("已复制到剪贴板");
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1C1F4A] to-[#2D2F5A] rounded-lg p-8 max-w-md w-full mx-4 border border-white/10">
        {/* 关闭按钮 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">分享这封信</h2>
          <button
            onClick={onClose}
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
            className="w-full bg-[#09B981] hover:bg-[#059669] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>🔗</span> 微信分享
          </button>

          {/* 微博分享 */}
          <button
            onClick={shareToWeibo}
            className="w-full bg-[#E74C3C] hover:bg-[#C0392B] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>🌐</span> 分享到微博
          </button>

          {/* QQ分享 */}
          <button
            onClick={shareToQQ}
            className="w-full bg-[#3B5998] hover:bg-[#2D4373] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>💬</span> 分享到QQ
          </button>

          {/* 复制链接 */}
          <button
            onClick={copyToClipboard}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={20} /> 已复制
              </>
            ) : (
              <>
                <Copy size={20} /> 复制链接
              </>
            )}
          </button>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition"
        >
          关闭
        </button>
      </div>
    </div>
  );
};
