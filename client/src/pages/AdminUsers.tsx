import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Ban, CheckCircle } from "lucide-react";

export function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"user" | "admin" | undefined>();

  const { data: usersData, isLoading } = trpc.admin.getUsers.useQuery({
    page,
    pageSize: 20,
    search: search || undefined,
    role,
  });

  const banMutation = trpc.admin.banUser.useMutation();

  const handleBanUser = async (userId: number, banned: boolean) => {
    try {
      await banMutation.mutateAsync({
        userId,
        banned,
        reason: banned ? "违规行为" : undefined,
      });
      // Refresh users list
      window.location.reload();
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-2">查看和管理所有用户</p>
        </div>

        {/* Search and Filter */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="搜索用户名或邮箱..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <select
                value={role || ""}
                onChange={(e) => {
                  setRole(e.target.value as any);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">所有角色</option>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">用户名</th>
                <th className="text-left py-3 px-4 font-semibold">邮箱</th>
                <th className="text-left py-3 px-4 font-semibold">角色</th>
                <th className="text-left py-3 px-4 font-semibold">加入时间</th>
                <th className="text-left py-3 px-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : usersData?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    没有找到用户
                  </td>
                </tr>
              ) : (
                usersData?.data.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{user.name || "未设置"}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "admin" ? "管理员" : "普通用户"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBanUser(user.id, true)}
                        disabled={banMutation.isPending}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        封禁
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        {/* Pagination */}
        {usersData && usersData.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
            >
              上一页
            </Button>
            <span className="px-4 py-2">
              第 {page} / {usersData.totalPages} 页
            </span>
            <Button
              onClick={() => setPage(Math.min(usersData.totalPages, page + 1))}
              disabled={page === usersData.totalPages}
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
