import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Lock, Unlock, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface TimeCapsuleItem {
  id: number;
  content: string;
  openDate: string;
  createdDate: string;
  isOpened: boolean;
  autoReply?: string;
}

export default function TimeCapsule() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    openDate: "",
    autoReply: "",
  });
  const [capsules, setCapsules] = useState<TimeCapsuleItem[]>([
    {
      id: 1,
      content: "亲爱的未来的我，希望你已经度过了这个困难的时期。记住，你比你想象的要强大。",
      openDate: "2026-06-29",
      createdDate: "2026-03-29",
      isOpened: false,
      autoReply: "我已经打开了这个胶囊，感谢过去的自己。",
    },
    {
      id: 2,
      content: "三个月后的我，希望你已经完成了那个项目。相信自己！",
      openDate: "2026-04-29",
      createdDate: "2026-03-29",
      isOpened: false,
    },
  ]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white flex items-center justify-center">
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 max-w-md text-center">
          <Lock className="w-12 h-12 text-[#FFD580] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">需要登录</h2>
          <p className="text-gray-400 mb-6">
            时间胶囊是一个私密的功能，需要登录后才能使用
          </p>
          <Button
            className="w-full bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            登录账户
          </Button>
        </Card>
      </div>
    );
  }

  const handleCreateCapsule = () => {
    if (!formData.content || !formData.openDate) {
      alert("请填写所有必填项");
      return;
    }

    const newCapsule: TimeCapsuleItem = {
      id: capsules.length + 1,
      content: formData.content,
      openDate: formData.openDate,
      createdDate: new Date().toISOString().split("T")[0],
      isOpened: false,
      autoReply: formData.autoReply || undefined,
    };

    setCapsules([...capsules, newCapsule]);
    setFormData({ content: "", openDate: "", autoReply: "" });
    setShowForm(false);
  };

  const handleDeleteCapsule = (id: number) => {
    setCapsules(capsules.filter((c) => c.id !== id));
  };

  const daysUntilOpen = (openDate: string) => {
    const now = new Date();
    const open = new Date(openDate);
    const diff = Math.ceil((open.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const unopenedCapsules = capsules.filter((c) => !c.isOpened);
  const openedCapsules = capsules.filter((c) => c.isOpened);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0F2F]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">时间胶囊</h1>
            <p className="text-gray-400 text-sm mt-1">
              写信给未来的自己
            </p>
          </div>
          <Button
            variant="outline"
            className="border-[#FFD580] text-[#FFD580] hover:bg-[#FFD580]/10"
            onClick={() => navigate("/")}
          >
            返回首页
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Create Button */}
        {!showForm && (
          <Button
            className="w-full md:w-auto bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400 font-semibold py-6 mb-8"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            创建新胶囊
          </Button>
        )}

        {/* Create Form */}
        {showForm && (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 md:p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">创建时间胶囊</h2>
            <div className="space-y-4">
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  给未来的自己写点什么
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="写下你的心声、梦想或鼓励..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD580] resize-none"
                  rows={6}
                />
              </div>

              {/* Open Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  打开日期
                </label>
                <input
                  type="date"
                  value={formData.openDate}
                  onChange={(e) =>
                    setFormData({ ...formData, openDate: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFD580]"
                />
              </div>

              {/* Auto Reply */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  打开时的AI回复（可选）
                </label>
                <textarea
                  value={formData.autoReply}
                  onChange={(e) =>
                    setFormData({ ...formData, autoReply: e.target.value })
                  }
                  placeholder="当胶囊打开时，系统会自动生成一条AI回复..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD580] resize-none"
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1 bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                  onClick={handleCreateCapsule}
                >
                  创建胶囊
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-gray-300"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Unopened Capsules */}
        {unopenedCapsules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FFD580]" />
              待打开的胶囊 ({unopenedCapsules.length})
            </h2>
            <div className="space-y-4">
              {unopenedCapsules.map((capsule) => {
                const days = daysUntilOpen(capsule.openDate);
                const isReady = days <= 0;

                return (
                  <Card
                    key={capsule.id}
                    className={`backdrop-blur-sm border transition-all ${
                      isReady
                        ? "bg-gradient-to-r from-[#FFD580]/20 to-[#FFC857]/10 border-[#FFD580]/50"
                        : "bg-white/5 border-white/10"
                    } p-6 hover:border-[#FFD580]/30`}
                  >
                    <div className="space-y-4">
                      {/* Content Preview */}
                      <p className="text-gray-300 line-clamp-3">
                        {capsule.content}
                      </p>

                      {/* Divider */}
                      <div className="h-px bg-white/10" />

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">
                            创建于 {capsule.createdDate}
                          </p>
                          <p className={`text-sm font-medium ${
                            isReady ? "text-[#FFD580]" : "text-gray-400"
                          }`}>
                            {isReady
                              ? "✨ 已可打开"
                              : `还需 ${days} 天`}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {isReady && (
                            <Button
                              size="sm"
                              className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                            >
                              <Unlock className="w-4 h-4 mr-1" />
                              打开
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteCapsule(capsule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Opened Capsules */}
        {openedCapsules.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-400" />
              已打开的胶囊 ({openedCapsules.length})
            </h2>
            <div className="space-y-4">
              {openedCapsules.map((capsule) => (
                <Card
                  key={capsule.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-6"
                >
                  <div className="space-y-4">
                    <p className="text-gray-300">{capsule.content}</p>
                    {capsule.autoReply && (
                      <>
                        <div className="h-px bg-white/10" />
                        <div className="bg-[#FFD580]/10 border border-[#FFD580]/20 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-2">AI回复：</p>
                          <p className="text-gray-300">{capsule.autoReply}</p>
                        </div>
                      </>
                    )}
                    <div className="text-xs text-gray-500">
                      打开于 {capsule.openDate}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {capsules.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-6">
              还没有创建时间胶囊，开始写信给未来的自己吧
            </p>
            <Button
              className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              创建第一个胶囊
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
