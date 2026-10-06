import React, { useState } from "react";
import { ChevronDown, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";

interface TemplateSelectorProps {
  onLoadTemplate: (content: string, backgroundType: string, emotions: string[]) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onLoadTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 获取用户的模板列表
  const { data: templates = [], isLoading } = trpc.templates.list.useQuery();

  // 删除模板
  const deleteTemplateMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("模板已删除");
    },
    onError: () => {
      toast.error("删除模板失败");
    },
  });

  const handleLoadTemplate = (template: any) => {
    onLoadTemplate(
      template.content,
      template.backgroundType,
      template.emotionTags || []
    );
    setIsOpen(false);
    toast.success(`已加载模板"${template.templateName}"`);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("确定要删除这个模板吗？")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition border border-white/20"
      >
        <Copy size={18} />
        <span>我的模板</span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gradient-to-br from-[#1C1F4A] to-[#2D2F5A] rounded-lg border border-white/20 shadow-lg z-40">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">加载中...</div>
          ) : templates.length === 0 ? (
            <div className="p-4 text-center text-gray-400">暂无模板</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {templates.map((template: any) => (
                <div
                  key={template.id}
                  className="p-4 border-b border-white/10 hover:bg-white/5 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <h3 className="text-white font-semibold text-sm truncate">
                        {template.templateName}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                        {template.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded">
                          {template.backgroundType}
                        </span>
                        {template.emotionTags && template.emotionTags.length > 0 && (
                          <span className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded">
                            {template.emotionTags.length} 标签
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="text-gray-400 hover:text-red-400 transition p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
