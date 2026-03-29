import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Mailbox() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: letters, isLoading, refetch } = trpc.letter.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.letter.delete.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">请先登录</p>
          <Button onClick={() => navigate("/")} className="bg-[#FFD580] text-[#0B0F2F]">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("信件已删除");
      refetch();
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || "删除失败");
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
            <h1 className="text-2xl font-bold text-white">我的信箱</h1>
          </div>
          <Button
            className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 flex items-center gap-2"
            onClick={() => navigate("/write")}
          >
            <Plus className="w-4 h-4" />
            写新信
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD580]" />
          </div>
        ) : !letters || letters.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400 text-lg">还没有写过信呢</p>
            <Button
              className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
              onClick={() => navigate("/write")}
            >
              开始写信
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {letters.map((letter: any) => (
              <div
                key={letter.id}
                className="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-[#FFD580]/30 transition-colors cursor-pointer group"
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
                        {new Date(letter.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(letter.createdAt).toLocaleTimeString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(letter.id);
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
                        {letter.emotionScore as number}
                      </span>
                    </div>
                  )}

                  {letter.reply ? (
                    <div className="p-3 rounded bg-[#FFD580]/10 border border-[#FFD580]/20">
                      <p className="text-xs text-[#FFD580] font-semibold mb-1">
                        ✓ 已收到回信
                      </p>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {String(letter.reply)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400">
                        ⏳ AI正在生成回信...
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
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1C1F4A] border border-white/10 rounded-lg p-6 max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">确认删除？</h3>
            <p className="text-gray-400">
              删除后无法恢复，请谨慎操作。
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={() => setDeleteId(null)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteId && handleDelete(deleteId)}
                disabled={deleteMutation.isPending as any}
              >
                {deleteMutation.isPending ? "删除中..." : "确认删除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
