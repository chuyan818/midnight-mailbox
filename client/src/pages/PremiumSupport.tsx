import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../_core/hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { trpc } from "@/lib/trpc";
import { isSupportRequestValid } from "@/lib/support-form";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock, Mail, MessageSquare, Phone } from "lucide-react";

const SUPPORT_BENEFITS = [
  { title: "优先响应", description: "我们承诺在24小时内回复您的所有问题。", icon: <Clock className="w-6 h-6" /> },
  { title: "专属客服", description: "您的工单会进入高级会员优先队列。", icon: <MessageSquare className="w-6 h-6" /> },
  { title: "多渠道支持", description: "通过站内工单和邮件获得持续帮助。", icon: <Phone className="w-6 h-6" /> },
  { title: "技术支持", description: "获得优先的技术支持，解决使用问题或功能建议。", icon: <AlertCircle className="w-6 h-6" /> },
  { title: "反馈优先", description: "您的功能建议和反馈将被优先考虑。", icon: <CheckCircle2 className="w-6 h-6" /> },
  { title: "账户安全", description: "客服会在处理账户问题时进行必要的安全核验。", icon: <Mail className="w-6 h-6" /> },
];

const STATUS_LABELS: Record<string, string> = {
  open: "待处理",
  in_progress: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

export const PremiumSupport: React.FC = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({ subject: "", category: "technical", message: "" });

  const eligibilityQuery = trpc.support.eligibility.useQuery(undefined, { enabled: Boolean(user) });
  const ticketsQuery = trpc.support.listMine.useQuery(undefined, {
    enabled: Boolean(user) && eligibilityQuery.data?.eligible === true,
  });
  const createTicket = trpc.support.create.useMutation({
    onSuccess: async () => {
      setFormData({ subject: "", category: "technical", message: "" });
      await ticketsQuery.refetch();
      toast.success("工单已提交，客服团队会在24小时内回复");
    },
    onError: (error) => toast.error(error.message || "工单提交失败，请稍后重试"),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSupportRequestValid(formData.subject, formData.message)) {
      toast.error("请填写标题，并输入至少5个字的问题描述");
      return;
    }
    await createTicket.mutateAsync({
      subject: formData.subject,
      description: formData.message,
      category: formData.category as "technical" | "feedback" | "billing" | "other",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">高级会员优先客服支持</h1>
          <p className="text-xl text-gray-300">享受24小时优先响应和专属客服代表的个性化服务</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {SUPPORT_BENEFITS.map((benefit) => (
            <Card key={benefit.title} className="bg-white/10 backdrop-blur border-white/20 p-6 hover:bg-white/15 transition-colors">
              <div className="flex gap-4">
                <div className="text-yellow-400 flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-300 text-sm">{benefit.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="bg-white/10 backdrop-blur border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">联系我们</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Mail className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">邮件支持</h3>
              <p className="text-gray-300 text-sm">support@midnight-mailbox.com</p>
              <p className="text-gray-400 text-xs mt-2">24小时内回复</p>
            </div>
            <div className="text-center">
              <Phone className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">电话支持</h3>
              <p className="text-gray-300 text-sm">400-800-8888</p>
              <p className="text-gray-400 text-xs mt-2">工作日 9:00-18:00</p>
            </div>
            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">在线工单</h3>
              <p className="text-gray-300 text-sm">站内提交并跟踪</p>
              <p className="text-gray-400 text-xs mt-2">实时查看进度</p>
            </div>
          </div>
        </Card>

        {!user ? (
          <Card className="bg-white/10 backdrop-blur border-white/20 p-8 text-center">
            <p className="text-gray-300 mb-4">请先登录以提交客服支持请求</p>
            <Button onClick={() => navigate("/user-login")} className="bg-yellow-400 text-gray-900 font-semibold px-8 py-2 rounded-lg hover:bg-yellow-300">
              登录
            </Button>
          </Card>
        ) : eligibilityQuery.isLoading ? (
          <Card className="bg-white/10 backdrop-blur border-white/20 p-8 text-center text-gray-300">正在检查会员权益...</Card>
        ) : !eligibilityQuery.data?.eligible ? (
          <Card className="bg-white/10 backdrop-blur border-white/20 p-8 text-center">
            <p className="text-gray-300 mb-4">优先客服工单仅对有效高级会员开放。</p>
            <Button onClick={() => navigate("/profile")} className="bg-yellow-400 text-gray-900 font-semibold px-8 py-2 rounded-lg hover:bg-yellow-300">
              返回个人中心
            </Button>
          </Card>
        ) : (
          <>
            <Card className="bg-white/10 backdrop-blur border-white/20 p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">提交支持请求</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2" htmlFor="support-category">问题分类</label>
                  <select id="support-category" value={formData.category} onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-400">
                    <option value="technical" className="bg-gray-900">技术问题</option>
                    <option value="feedback" className="bg-gray-900">功能建议</option>
                    <option value="billing" className="bg-gray-900">账单问题</option>
                    <option value="other" className="bg-gray-900">其他问题</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2" htmlFor="support-subject">问题标题</label>
                  <input id="support-subject" value={formData.subject} onChange={(event) => setFormData((prev) => ({ ...prev, subject: event.target.value }))} placeholder="请简要描述您的问题" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400" required />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2" htmlFor="support-message">详细描述</label>
                  <textarea id="support-message" value={formData.message} onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))} placeholder="请详细描述您的问题或建议" rows={6} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 resize-none" required />
                </div>
                <Button type="submit" disabled={createTicket.isPending} className="w-full bg-yellow-400 text-gray-900 font-semibold py-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50">
                  {createTicket.isPending ? "提交中..." : "提交请求"}
                </Button>
              </form>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">我的工单</h2>
                <span className="text-sm text-gray-400">共 {ticketsQuery.data?.length ?? 0} 条</span>
              </div>
              {ticketsQuery.isLoading ? (
                <p className="text-gray-300">正在加载工单...</p>
              ) : ticketsQuery.data?.length ? (
                <div className="space-y-3">
                  {ticketsQuery.data.map((ticket) => (
                    <div key={ticket.id} className="rounded-lg border border-white/15 bg-black/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-white">{ticket.subject}</h3>
                        <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-xs text-yellow-200">{STATUS_LABELS[ticket.status]}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                      <p className="mt-3 text-xs text-gray-400">提交于 {new Date(ticket.createdAt).toLocaleString("zh-CN")}</p>
                      {ticket.response && <p className="mt-3 rounded bg-white/10 p-3 text-sm text-green-200">客服回复：{ticket.response}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">还没有客服工单，遇到问题时可以随时联系我们。</p>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default PremiumSupport;
