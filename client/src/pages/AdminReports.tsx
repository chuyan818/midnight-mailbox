import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCircle, AlertCircle } from "lucide-react";

export function AdminReports() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "pending" | "reviewing" | "resolved" | "dismissed">("pending");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resolution, setResolution] = useState("");

  const { data: reportsData, isLoading } = trpc.admin.getReports.useQuery({
    page,
    pageSize: 20,
    status,
  });

  const handleMutation = trpc.admin.handleReport.useMutation();

  const handleReport = async (reportId: number, newStatus: "reviewing" | "resolved" | "dismissed") => {
    try {
      await handleMutation.mutateAsync({
        reportId,
        status: newStatus,
        resolution: resolution || undefined,
      });
      setSelectedReport(null);
      setResolution("");
      window.location.reload();
    } catch (error) {
      console.error("Failed to handle report:", error);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-red-100 text-red-800",
    reviewing: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "待处理",
    reviewing: "审核中",
    resolved: "已解决",
    dismissed: "已驳回",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">举报管理</h1>
          <p className="text-gray-600 mt-2">处理用户举报</p>
        </div>

        {/* Filter */}
        <Card className="p-6">
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "reviewing", "resolved", "dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s as any);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  status === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {s === "all" ? "全部" : statusLabels[s]}
              </button>
            ))}
          </div>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-6 text-center text-gray-500">加载中...</Card>
          ) : reportsData?.data.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">没有找到举报</Card>
          ) : (
            reportsData?.data.map((report: any) => (
              <Card
                key={report.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        举报 #{report.id}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          statusColors[report.status]
                        }`}
                      >
                        {statusLabels[report.status]}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      举报类型：{report.reportType || "未设置"}
                    </p>
                    <p className="text-gray-700 line-clamp-2">
                      {report.reason}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReport(report)}
                  >
                    处理
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {reportsData && reportsData.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              上一页
            </Button>
            <span className="px-4 py-2">
              第 {page} / {reportsData.totalPages} 页
            </span>
            <Button
              onClick={() =>
                setPage(Math.min(reportsData.totalPages, page + 1))
              }
              disabled={page === reportsData.totalPages}
              variant="outline"
            >
              下一页
            </Button>
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full mx-4 p-6 max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">处理举报</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">举报原因</p>
                  <p className="mt-2 text-gray-900">{selectedReport.reason}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">当前状态</p>
                  <p className="mt-1 font-semibold">
                    {statusLabels[selectedReport.status]}
                  </p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm">处理意见</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="输入处理意见..."
                    className="w-full mt-2 p-2 border border-gray-300 rounded-lg"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedReport(null);
                    setResolution("");
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={() =>
                    handleReport(selectedReport.id, "reviewing")
                  }
                  disabled={handleMutation.isPending}
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  审核中
                </Button>
                <Button
                  onClick={() =>
                    handleReport(selectedReport.id, "resolved")
                  }
                  disabled={handleMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  已解决
                </Button>
                <Button
                  onClick={() =>
                    handleReport(selectedReport.id, "dismissed")
                  }
                  disabled={handleMutation.isPending}
                  variant="outline"
                >
                  驳回
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
