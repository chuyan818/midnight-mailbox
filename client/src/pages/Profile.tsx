import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, LogOut, Crown, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const upgradeMutation = trpc.membership.upgrade.useMutation();
  const cancelMutation = trpc.membership.cancel.useMutation();

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

  const handleUpgrade = async (type: "monthly" | "yearly") => {
    try {
      await upgradeMutation.mutateAsync({ type });
      toast.success("升级成功！");
    } catch (error: any) {
      toast.error(error.message || "升级失败");
    }
  };

  const handleCancel = async () => {
    if (confirm("确定要取消会员吗？")) {
      try {
        await cancelMutation.mutateAsync();
        toast.success("已取消会员");
      } catch (error: any) {
        toast.error(error.message || "取消失败");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error: any) {
      toast.error("登出失败");
    }
  };

  const membershipInfo = {
    free: {
      name: "免费版",
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/20",
      features: [
        "每天1封信",
        "AI温暖回信",
        "基础情绪分析",
      ],
    },
    monthly: {
      name: "月会员",
      color: "text-[#FFD580]",
      bgColor: "bg-[#FFD580]/10",
      borderColor: "border-[#FFD580]/20",
      features: [
        "无限写信",
        "AI温暖回信",
        "完整情绪分析",
        "7天情绪趋势",
        "关键词提取",
      ],
    },
    yearly: {
      name: "年会员",
      color: "text-[#FFD580]",
      bgColor: "bg-[#FFD580]/10",
      borderColor: "border-[#FFD580]/20",
      features: [
        "无限写信",
        "AI温暖回信",
        "完整情绪分析",
        "7天情绪趋势",
        "关键词提取",
        "优先支持",
      ],
    },
  };

  const currentType = (profile?.membership?.membershipType || "free") as keyof typeof membershipInfo;
  const currentInfo = membershipInfo[currentType];

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
            <h1 className="text-2xl font-bold text-white">个人中心</h1>
          </div>
          <Button
            variant="outline"
            className="border-red-500 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            登出
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD580]" />
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="p-6 rounded-lg bg-white/5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">账户信息</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">用户名</p>
                  <p className="text-lg text-white font-semibold">{user?.name || "未设置"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">邮箱</p>
                  <p className="text-lg text-white font-semibold">{user?.email || "未设置"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">加入时间</p>
                  <p className="text-lg text-white font-semibold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "未知"}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Membership */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">当前会员</h2>
              <div className={`p-6 rounded-lg ${currentInfo.bgColor} border ${currentInfo.borderColor}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Crown className={`w-6 h-6 ${currentInfo.color}`} />
                    <div>
                      <h3 className={`text-xl font-bold ${currentInfo.color}`}>{currentInfo.name}</h3>
                      {profile?.membership?.membershipExpiry && (
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" />
                          有效期至 {new Date(profile.membership.membershipExpiry).toLocaleDateString("zh-CN")}
                        </p>
                      )}
                    </div>
                  </div>
                  {currentType !== "free" && (
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                      onClick={handleCancel}
                      disabled={cancelMutation.isPending as any}
                    >
                      {cancelMutation.isPending ? "取消中..." : "取消会员"}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white mb-3">包含功能：</p>
                  {currentInfo.features.map((feature, idx) => (
                    <p key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${currentInfo.color}`} />
                      {feature}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Upgrade Options */}
            {currentType === "free" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">升级会员</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monthly */}
                  <div className="p-6 rounded-lg bg-[#FFD580]/10 border border-[#FFD580]/30 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#FFD580]">月会员</h3>
                      <p className="text-3xl font-bold text-white mt-2">¥29</p>
                      <p className="text-sm text-gray-400 mt-1">/月</p>
                    </div>
                    <ul className="space-y-2">
                      {membershipInfo.monthly.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                      onClick={() => handleUpgrade("monthly")}
                      disabled={upgradeMutation.isPending as any}
                    >
                      {upgradeMutation.isPending ? "升级中..." : "升级为月会员"}
                    </Button>
                  </div>

                  {/* Yearly */}
                  <div className="p-6 rounded-lg bg-[#FFD580]/10 border border-[#FFD580]/30 space-y-4 relative">
                    <div className="absolute -top-3 -right-3 bg-[#FFD580] text-[#0B0F2F] px-3 py-1 rounded-full text-xs font-bold">
                      省¥60
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#FFD580]">年会员</h3>
                      <p className="text-3xl font-bold text-white mt-2">¥288</p>
                      <p className="text-sm text-gray-400 mt-1">/年</p>
                    </div>
                    <ul className="space-y-2">
                      {membershipInfo.yearly.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#FFD580] rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                      onClick={() => handleUpgrade("yearly")}
                      disabled={upgradeMutation.isPending as any}
                    >
                      {upgradeMutation.isPending ? "升级中..." : "升级为年会员"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">我的数据</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-3xl font-bold text-[#FFD580]">0</p>
                  <p className="text-sm text-gray-400 mt-2">总信件数</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-3xl font-bold text-[#FFD580]">0</p>
                  <p className="text-sm text-gray-400 mt-2">平均情绪评分</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                  <p className="text-3xl font-bold text-[#FFD580]">0</p>
                  <p className="text-sm text-gray-400 mt-2">连续写信天数</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10 flex-1"
                onClick={() => navigate("/report")}
              >
                查看情绪报告
              </Button>
              <Button
                className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 flex-1"
                onClick={() => navigate("/mailbox")}
              >
                查看信箱
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
