import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"];

export function AdminEmotions() {
  const [days, setDays] = useState(30);

  const { data: emotionStats, isLoading } = trpc.admin.getEmotionStats.useQuery({
    days,
  });

  const chartData = emotionStats
    ? Object.entries(emotionStats.emotionDistribution).map(([emotion, count]) => ({
        name: emotion,
        value: count,
      }))
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">情绪统计</h1>
          <p className="text-gray-600 mt-2">分析用户情绪分布</p>
        </div>

        {/* Time Range Selector */}
        <Card className="p-6">
          <div className="flex gap-4">
            {[7, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg ${
                  days === d
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                最近 {d} 天
              </button>
            ))}
          </div>
        </Card>

        {/* Stats Summary */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">统计周期</p>
              <p className="text-2xl font-bold mt-2">{emotionStats?.period}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">总信件数</p>
              <p className="text-2xl font-bold mt-2">{emotionStats?.total || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">情绪类型数</p>
              <p className="text-2xl font-bold mt-2">
                {Object.keys(emotionStats?.emotionDistribution || {}).length}
              </p>
            </div>
          </div>
        </Card>

        {/* Charts */}
        {isLoading ? (
          <Card className="p-6 text-center text-gray-500">加载中...</Card>
        ) : chartData.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            没有情绪数据
          </Card>
        ) : (
          <>
            {/* Bar Chart */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">情绪分布柱状图</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Pie Chart */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">情绪占比饼图</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: ${value}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Detailed Table */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">详细统计</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">情绪类型</th>
                    <th className="text-left py-3 px-4 font-semibold">数量</th>
                    <th className="text-left py-3 px-4 font-semibold">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={item.name} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                COLORS[index % COLORS.length],
                            }}
                          />
                          {item.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{item.value}</td>
                      <td className="py-3 px-4">
                        {(
                          ((item.value / (emotionStats?.total || 1)) * 100)
                        ).toFixed(1)}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
