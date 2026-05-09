import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  backgroundType: string;
  emotions: string[];
  onSave?: (templateName: string) => void;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  isOpen,
  onClose,
  content,
  backgroundType,
  emotions,
  onSave,
}) => {
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("请输入模板名称");
      return;
    }

    setIsSaving(true);
    try {
      // 保存到localStorage
      const templates = JSON.parse(localStorage.getItem("letterTemplates") || "[]");
      templates.push({
        id: Date.now(),
        name: templateName,
        content,
        backgroundType,
        emotions,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("letterTemplates", JSON.stringify(templates));

      toast.success(`模板"${templateName}"已保存`);
      onSave?.(templateName);
      setTemplateName("");
      onClose();
    } catch (error) {
      toast.error("保存模板失败");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1C1F4A] to-[#2D2F5A] rounded-lg p-8 max-w-md w-full mx-4 border border-white/10">
        {/* 关闭按钮 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">保存为模板</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* 模板信息预览 */}
        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400">信纸主题</p>
              <p className="text-white font-semibold">{backgroundType}</p>
            </div>
            {emotions.length > 0 && (
              <div>
                <p className="text-gray-400">情绪标签</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {emotions.map((emotion) => (
                    <span
                      key={emotion}
                      className="bg-[#8B5CF6]/30 text-[#C4B5FD] px-2 py-1 rounded text-xs"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-gray-400">内容预览</p>
              <p className="text-white line-clamp-2">{content}</p>
            </div>
          </div>
        </div>

        {/* 模板名称输入 */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">模板名称</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="例如：深夜的思绪、工作压力..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
            maxLength={50}
          />
          <p className="text-gray-400 text-xs mt-1">
            {templateName.length}/50
          </p>
        </div>

        {/* 提示文字 */}
        <p className="text-gray-400 text-sm mb-6">
          保存后，你可以在下次写信时快速加载这个模板，节省时间。
        </p>

        {/* 按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !templateName.trim()}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {isSaving ? "保存中..." : "保存模板"}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
