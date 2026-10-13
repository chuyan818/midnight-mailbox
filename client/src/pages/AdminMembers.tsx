import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DollarSign } from "lucide-react";

export function AdminMembers() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();

  const { data: ordersData, isLoading } = trpc.admin.getVipOrders.useQuery({
    page,
    pageSize: 20,
    status,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">会员管理</h1>
          <p className="text-gray-600 mt-2">查看VIP订单和收入统计</p>
        </div>

        {/* Revenue Summary */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">总订单数</p>
              <p className="text-3xl font-bold mt-2">{ordersData?.total || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">总收入</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                ¥{(ordersData?.totalRevenue || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">平均订单金额</p>
              <p className="text-3xl font-bold mt-2">
                ¥
                {(
                  (ordersData?.totalRevenue || 0) / (ordersData?.total || 1)
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="p-6 overflow-x-auto">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">订单列表</h2>
            <select value={status || ""} onChange={(event) => { setStatus(event.target.value || undefined); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2">
              <option value="">全部状态</option>
              <option value="pending">处理中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">订单ID</th>
                <th className="text-left py-3 px-4 font-semibold">用户ID</th>
                <th className="text-left py-3 px-4 font-semibold">金额</th>
                <th className="text-left py-3 px-4 font-semibold">套餐</th>
                <th className="text-left py-3 px-4 font-semibold">状态</th>
                <th className="text-left py-3 px-4 font-semibold">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : ordersData?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    没有找到订单
                  </td>
                </tr>
              ) : (
                ordersData?.data.map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      {order.id}
                    </td>
                    <td className="py-3 px-4">{order.userId}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">
                      ¥{parseFloat(order.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {order.planType || "标准套餐"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "completed" ? "已完成" : "处理中"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        {/* Pagination */}
        {ordersData && ordersData.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              上一页
            </Button>
            <span className="px-4 py-2">
              第 {page} / {ordersData.totalPages} 页
            </span>
            <Button
              onClick={() =>
                setPage(Math.min(ordersData.totalPages, page + 1))
              }
              disabled={page === ordersData.totalPages}
              variant="outline"
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
