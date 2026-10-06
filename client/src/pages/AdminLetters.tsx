import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Trash2, Eye } from "lucide-react";

export function AdminLetters() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "flagged" | "safe">("all");
  const [selectedLetter, setSelectedLetter] = useState<any>(null);

  const { data: lettersData, isLoading } = trpc.admin.getLetters.useQuery({
    page,
    pageSize: 20,
    status,
  });

  const deleteMutation = trpc.admin.deleteLetter.useMutation();

  const handleDeleteLetter = async (letterId: number) => {
    if (!confirm("确定要删除这封信件吗？")) return;
    try {
      await deleteMutation.mutateAsync({
        letterId,
        reason: "管理员删除",
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete letter:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">信件管理</h1>
          <p className="text-gray-600 mt-2">查看和管理所有信件</p>
        </div>

        {/* Filter */}
        <Card className="p-6">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setStatus("all");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg ${
                status === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => {
                setStatus("flagged");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg ${
                status === "flagged"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              标记的
            </button>
            <button
              onClick={() => {
                setStatus("safe");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg ${
                status === "safe"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              安全的
            </button>
          </div>
        </Card>

        {/* Letters List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-6 text-center text-gray-500">加载中...</Card>
          ) : lettersData?.data.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">没有找到信件</Card>
          ) : (
            lettersData?.data.map((letter: any) => (
              <Card
                key={letter.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        信件 #{letter.id}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          letter.safetyFlag
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {letter.safetyFlag ? "标记" : "安全"}
                      </span>
                      {letter.isPublic && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          公开
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      情绪：{letter.emotionType || "未设置"}
                    </p>
                    <p className="text-gray-700 line-clamp-2">
                      {letter.content}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(letter.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLetter(letter)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteLetter(letter.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {lettersData && lettersData.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              上一页
            </Button>
            <span className="px-4 py-2">
              第 {page} / {lettersData.totalPages} 页
            </span>
            <Button
              onClick={() =>
                setPage(Math.min(lettersData.totalPages, page + 1))
              }
              disabled={page === lettersData.totalPages}
              variant="outline"
            >
              下一页
            </Button>
          </div>
        )}

        {/* Letter Detail Modal */}
        {selectedLetter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full mx-4 p-6 max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">信件详情</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">内容</p>
                  <p className="mt-2 text-gray-900">{selectedLetter.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">情绪</p>
                    <p className="mt-1 font-semibold">
                      {selectedLetter.emotionType || "未设置"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">状态</p>
                    <p className="mt-1 font-semibold">
                      {selectedLetter.safetyFlag ? "标记" : "安全"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLetter(null)}
                >
                  关闭
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
