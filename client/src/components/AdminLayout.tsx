import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Menu, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const menuItems = [
  { label: "首页", path: "/admin" },
  { label: "用户管理", path: "/admin/users" },
  { label: "信件管理", path: "/admin/letters" },
  { label: "情绪统计", path: "/admin/emotions" },
  { label: "会员管理", path: "/admin/members" },
  { label: "举报管理", path: "/admin/reports" },
  { label: "系统配置", path: "/admin/settings" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">无权限访问</h1>
          <p className="text-gray-600 mb-6">您没有管理员权限</p>
          <Button onClick={() => navigate("/")} variant="default">
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-slate-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">深夜信箱 Admin</h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-6 py-3 transition-colors ${
                location === item.path
                  ? "bg-blue-600 border-l-4 border-blue-400"
                  : "hover:bg-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-sm mb-3">
            <p className="text-gray-400">登录用户</p>
            <p className="font-semibold">{user.name || user.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full text-white border-white hover:bg-slate-800"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <div className="text-sm text-gray-600">
            欢迎来到管理员后台
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
