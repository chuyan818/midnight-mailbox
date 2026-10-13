import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Save } from "lucide-react";
import { useLocation } from "wouter";

export function AdminSettings() {
  const [, navigate] = useLocation();
  const { data: configsData, isLoading } = trpc.admin.getSystemConfigs.useQuery();
  const updateMutation = trpc.admin.updateSystemConfig.useMutation();

  const [configs, setConfigs] = useState<Record<string, string>>({});

  const handleConfigChange = (key: string, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveConfig = async (key: string, value: string) => {
    try {
      await updateMutation.mutateAsync({
        key: key as "max_letter_length" | "daily_letter_limit" | "maintenance_mode" | "ai_response_enabled",
        value,
      });
      alert("配置已保存");
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("保存失败");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">系统配置</h1>
          <p className="text-gray-600 mt-2">管理系统全局配置</p>
        </div>

        {/* Configs */}
        {isLoading ? (
          <Card className="p-6 text-center text-gray-500">加载中...</Card>
        ) : (
          <div className="space-y-4">
            {configsData?.configs.map((config: any) => (
              <Card key={config.key} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{config.description}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      配置键: {config.key}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {config.type}
                  </span>
                </div>

                <div className="space-y-3">
                  {config.type === "boolean" ? (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={config.key}
                          value="true"
                          checked={
                            (configs[config.key] || config.value) === "true"
                          }
                          onChange={(e) =>
                            handleConfigChange(config.key, e.target.value)
                          }
                        />
                        <span>启用</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={config.key}
                          value="false"
                          checked={
                            (configs[config.key] || config.value) === "false"
                          }
                          onChange={(e) =>
                            handleConfigChange(config.key, e.target.value)
                          }
                        />
                        <span>禁用</span>
                      </label>
                    </div>
                  ) : (
                    <Input
                      type={config.type === "number" ? "number" : "text"}
                      value={configs[config.key] || config.value}
                      onChange={(e) =>
                        handleConfigChange(config.key, e.target.value)
                      }
                      placeholder={config.value}
                    />
                  )}

                  <Button
                    onClick={() =>
                      handleSaveConfig(
                        config.key,
                        configs[config.key] || config.value
                      )
                    }
                    disabled={updateMutation.isPending}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存配置
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Operation Logs */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">操作日志</h2>
          <p className="text-gray-600 text-sm mb-4">
            所有管理员操作都会被记录在操作日志中，用于审计和追踪
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/admin/logs")}>
            查看操作日志
          </Button>
        </Card>
      </div>
    </AdminLayout>
  );
}
