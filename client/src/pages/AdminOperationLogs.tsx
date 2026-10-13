import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

export function AdminOperationLogs() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.admin.getOperationLogs.useQuery({
    page,
    pageSize: 20,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">操作日志</h1>
            <p className="mt-2 text-gray-600">查看管理员操作审计记录</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/settings")}>
            返回系统配置
          </Button>
        </div>
        <Card className="overflow-x-auto p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold">时间</th>
                <th className="px-4 py-3 text-left font-semibold">管理员 ID</th>
                <th className="px-4 py-3 text-left font-semibold">操作</th>
                <th className="px-4 py-3 text-left font-semibold">目标</th>
                <th className="px-4 py-3 text-left font-semibold">详情</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">加载中...</td></tr>
              ) : data?.data.length ? (
                data.data.map((log) => (
                  <tr key={log.id} className="border-b align-top hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                    <td className="px-4 py-3">{log.adminId}</td>
                    <td className="px-4 py-3 font-mono text-sm">{log.action}</td>
                    <td className="px-4 py-3">{log.targetType || "—"}{log.targetId ? ` #${log.targetId}` : ""}</td>
                    <td className="max-w-md break-all px-4 py-3 text-sm text-gray-600">{log.details ? JSON.stringify(log.details) : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">暂无操作日志</td></tr>
              )}
            </tbody>
          </table>
        </Card>
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>上一页</Button>
            <span className="px-4 py-2">第 {page} / {data.totalPages} 页</span>
            <Button variant="outline" onClick={() => setPage(Math.min(data.totalPages, page + 1))} disabled={page === data.totalPages}>下一页</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
