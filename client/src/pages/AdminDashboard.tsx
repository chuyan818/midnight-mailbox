import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Users, Mail, AlertCircle, TrendingUp, CreditCard, Flag } from "lucide-react";

export function AdminDashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();

  const statCards = [
    {
      title: "总用户数",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-500",
      path: "/admin/users",
    },
    {
      title: "总信件数",
      value: stats?.totalLetters || 0,
      icon: Mail,
      color: "bg-green-500",
      path: "/admin/letters",
    },
    {
      title: "待处理举报",
      value: stats?.pendingReports || 0,
      icon: AlertCircle,
      color: "bg-red-500",
      path: "/admin/reports",
    },
    {
      title: "今日新用户",
      value: stats?.newUsersToday || 0,
      icon: TrendingUp,
      color: "bg-purple-500",
      path: "/admin/users",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-600 mt-2">欢迎来到深夜信箱管理后台</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(stat.path)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">
                      {isLoading ? "-" : stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate("/admin/users")}
              variant="outline"
              className="h-auto py-4"
            >
              <Users className="w-5 h-5 mr-2" />
              <div className="text-left">
                <p className="font-semibold">用户管理</p>
                <p className="text-xs text-gray-600">查看和管理用户</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/admin/letters")}
              variant="outline"
              className="h-auto py-4"
            >
              <Mail className="w-5 h-5 mr-2" />
              <div className="text-left">
                <p className="font-semibold">信件管理</p>
                <p className="text-xs text-gray-600">审核和删除信件</p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/admin/reports")}
              variant="outline"
              className="h-auto py-4"
            >
              <Flag className="w-5 h-5 mr-2" />
              <div className="text-left">
                <p className="font-semibold">举报管理</p>
                <p className="text-xs text-gray-600">处理用户举报</p>
              </div>
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">系统统计</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">总信件数</span>
              <span className="font-semibold">{stats?.totalLetters || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">总用户数</span>
              <span className="font-semibold">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">待处理举报</span>
              <span className="font-semibold text-red-600">
                {stats?.pendingReports || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
