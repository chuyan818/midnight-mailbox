import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  open: "待处理",
  in_progress: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

export default function AdminSupport() {
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");
  const [responseDrafts, setResponseDrafts] = useState<Record<number, string>>({});
  const ticketsQuery = trpc.support.adminList.useQuery({ status: statusFilter });
  const metricsQuery = trpc.support.adminMetrics.useQuery();
  const updateTicket = trpc.support.adminUpdate.useMutation({
    onSuccess: async () => {
      await Promise.all([ticketsQuery.refetch(), metricsQuery.refetch()]);
      toast.success("工单状态已更新");
    },
    onError: (error) => toast.error(error.message || "更新工单失败"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">客服工单</h1>
          <p className="mt-1 text-gray-500">处理高级会员请求并追踪首响时效</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            ["全部", metricsQuery.data?.total ?? 0],
            ["待处理", metricsQuery.data?.open ?? 0],
            ["处理中", metricsQuery.data?.inProgress ?? 0],
            ["已解决", metricsQuery.data?.resolved ?? 0],
            ["平均首响", metricsQuery.data?.averageResponseTimeHours == null ? "—" : `${metricsQuery.data.averageResponseTimeHours}h`],
          ].map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900">工单列表</h2>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="all">全部状态</option>
              <option value="open">待处理</option>
              <option value="in_progress">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>

          {ticketsQuery.isLoading ? (
            <p className="text-gray-500">正在加载工单...</p>
          ) : ticketsQuery.data?.length ? (
            <div className="space-y-4">
              {ticketsQuery.data.map((ticket) => {
                const draft = responseDrafts[ticket.id] ?? ticket.response ?? "";
                const nextStatus = ticket.status === "open" ? "in_progress" : ticket.status;
                return (
                  <div key={ticket.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">#{ticket.id} {ticket.subject}</h3>
                        <p className="mt-1 text-xs text-gray-500">用户 {ticket.userId} · {ticket.category} · {new Date(ticket.createdAt).toLocaleString("zh-CN")}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{STATUS_LABELS[ticket.status]}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{ticket.description}</p>
                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                      <textarea value={draft} onChange={(event) => setResponseDrafts((prev) => ({ ...prev, [ticket.id]: event.target.value }))} placeholder="填写给用户的回复（可选）" rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="flex flex-wrap items-end gap-2">
                        <Button disabled={updateTicket.isPending} onClick={() => updateTicket.mutate({ ticketId: ticket.id, status: nextStatus as "open" | "in_progress" | "resolved" | "closed", response: draft || undefined })}>开始处理</Button>
                        <Button disabled={updateTicket.isPending} variant="outline" onClick={() => updateTicket.mutate({ ticketId: ticket.id, status: "resolved", response: draft || undefined })}>标记解决</Button>
                      </div>
                    </div>
                    {ticket.responseTimeHours != null && <p className="mt-2 text-xs text-gray-500">首响耗时 {ticket.responseTimeHours} 小时</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">当前筛选下没有工单。</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
