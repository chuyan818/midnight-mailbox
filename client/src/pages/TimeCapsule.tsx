import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CalendarDays,
  Check,
  Clock,
  Filter,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Unlock,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TimeCapsuleItem {
  id: number;
  content: string;
  openDate: Date;
  createdAt: Date;
  status: "pending" | "opened";
  autoReply?: string | null;
  category?: string | null;
  mood?: string | null;
}
type StatusFilter = "all" | "pending" | "opened";
type SortOrder = "soonest" | "latest";
const capsuleCategories = [
  "成长",
  "关系",
  "工作学习",
  "梦想",
  "自我照顾",
  "旅行",
  "其他",
];
const capsuleMoods = [
  "平静",
  "期待",
  "开心",
  "难过",
  "焦虑",
  "感恩",
  "疲惫",
  "勇敢",
];
const moodEmoji: Record<string, string> = {
  平静: "🌿",
  期待: "✨",
  开心: "😊",
  难过: "🌧️",
  焦虑: "🌊",
  感恩: "🤍",
  疲惫: "🌙",
  勇敢: "🕯️",
};
const DAY_MS = 24 * 60 * 60 * 1000;
const datePresets = [
  { label: "7天后", days: 7 },
  { label: "30天后", days: 30 },
  { label: "90天后", days: 90 },
  { label: "1年后", days: 365 },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function addDays(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((date.getTime() - today.getTime()) / DAY_MS));
}
function progressPercent(createdAt: Date, openDate: Date) {
  const total = openDate.getTime() - createdAt.getTime();
  if (total <= 0) return 100;
  return Math.min(
    100,
    Math.max(0, ((Date.now() - createdAt.getTime()) / total) * 100)
  );
}

export default function TimeCapsule() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("soonest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formData, setFormData] = useState({
    content: "",
    openDate: "",
    autoReply: "",
    category: "",
    mood: "",
  });
  const [dateError, setDateError] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const minOpenDate = addDays(1);
  const minOpenDateObject = new Date(`${minOpenDate}T12:00:00`);

  const listQuery = trpc.social.timeCapsule.list.useQuery(
    { status: "all" },
    { enabled: isAuthenticated }
  );
  const createMutation = trpc.social.timeCapsule.create.useMutation();
  const deleteMutation = trpc.social.timeCapsule.delete.useMutation();
  const openMutation = trpc.social.timeCapsule.open.useMutation();

  const capsules = useMemo<TimeCapsuleItem[]>(
    () =>
      (listQuery.data?.data ?? []).map(capsule => ({
        id: capsule.id,
        content: capsule.content,
        openDate: new Date(capsule.openDate),
        createdAt: new Date(capsule.createdAt),
        status: capsule.status as "pending" | "opened",
        autoReply: capsule.autoReply,
        category: capsule.category,
        mood: capsule.mood,
      })),
    [listQuery.data]
  );

  const visibleCapsules = useMemo(
    () =>
      capsules
        .filter(
          capsule =>
            (statusFilter === "all" || capsule.status === statusFilter) &&
            (categoryFilter === "all" || capsule.category === categoryFilter)
        )
        .sort((a, b) => {
          const difference = a.openDate.getTime() - b.openDate.getTime();
          return sortOrder === "soonest" ? difference : -difference;
        }),
    [capsules, categoryFilter, sortOrder, statusFilter]
  );

  const analytics = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const moodCounts = new Map<string, number>();
    capsules.forEach(capsule => {
      if (capsule.category)
        categoryCounts.set(
          capsule.category,
          (categoryCounts.get(capsule.category) ?? 0) + 1
        );
      if (capsule.mood)
        moodCounts.set(capsule.mood, (moodCounts.get(capsule.mood) ?? 0) + 1);
    });
    return {
      total: capsules.length,
      opened: capsules.filter(capsule => capsule.status === "opened").length,
      categorized: capsules.filter(capsule => capsule.category).length,
      withMood: capsules.filter(capsule => capsule.mood).length,
      categories: Array.from(categoryCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      moods: Array.from(moodCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [capsules]);

  if (!isAuthenticated)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
        <Card className="mx-4 max-w-md border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <Lock className="mx-auto mb-4 h-12 w-12 text-[#FFD580]" />
          <h2 className="mb-2 text-2xl font-bold">需要登录</h2>
          <p className="mb-6 text-gray-400">
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

  const handleOpenDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, openDate: value }));
    setDateError(
      value && value < minOpenDate ? "请至少选择明天，给这封信留一点时间" : ""
    );
  };
  const handleCalendarSelect = (date?: Date) => {
    if (!date) return;
    handleOpenDateChange(toDateInputValue(date));
    setDatePickerOpen(false);
  };
  const handleCreateCapsule = async () => {
    if (!formData.content.trim() || !formData.openDate || dateError) {
      toast.error(dateError || "请填写信件内容和打开日期");
      return;
    }
    try {
      await createMutation.mutateAsync({
        content: formData.content.trim(),
        openDate: new Date(`${formData.openDate}T23:59:59`),
        autoReply: formData.autoReply.trim() || undefined,
        category: formData.category || undefined,
        mood: formData.mood || undefined,
      });
      toast.success("时间胶囊已保存");
      setFormData({
        content: "",
        openDate: "",
        autoReply: "",
        category: "",
        mood: "",
      });
      setDateError("");
      setShowForm(false);
      await listQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "创建时间胶囊失败");
    }
  };
  const handleDeleteCapsule = async (id: number) => {
    if (!window.confirm("确定删除这枚时间胶囊吗？删除后无法恢复。")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("时间胶囊已删除");
      await listQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "删除时间胶囊失败");
    }
  };
  const handleOpenCapsule = async (capsule: TimeCapsuleItem) => {
    if (capsule.status !== "pending" || daysUntil(capsule.openDate) > 0) return;
    try {
      await openMutation.mutateAsync({ id: capsule.id });
      toast.success("时间胶囊已打开");
      await listQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "打开时间胶囊失败");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F2F]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">时间胶囊</h1>
            <p className="mt-1 text-sm text-gray-400">写信给未来的自己</p>
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
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        {!showForm && (
          <Button
            className="mb-8 min-h-12 w-full bg-[#FFD580] font-semibold text-[#0B0F2F] hover:bg-yellow-400 md:w-auto md:px-6"
            onClick={() => setShowForm(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            创建新胶囊
          </Button>
        )}
        {showForm && (
          <Card className="mb-8 border border-white/10 bg-white/5 p-5 backdrop-blur-sm md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">创建时间胶囊</h2>
                <p className="mt-1 text-sm text-gray-400">
                  写下现在的心情，留给未来的自己。
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭创建表单"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  给未来的自己写点什么
                </label>
                <textarea
                  value={formData.content}
                  onChange={e =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="写下你的心声、梦想或鼓励..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD580] focus:outline-none"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="capsule-category"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    分类标签（可选）
                  </label>
                  <select
                    id="capsule-category"
                    value={formData.category}
                    onChange={e =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0B0F2F]/70 px-4 text-white focus:border-[#FFD580] focus:outline-none focus:ring-2 focus:ring-[#FFD580]/30"
                  >
                    <option value="">选择这封信属于什么</option>
                    {capsuleCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="capsule-mood"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    写信时的心情（可选）
                  </label>
                  <select
                    id="capsule-mood"
                    value={formData.mood}
                    onChange={e =>
                      setFormData({ ...formData, mood: e.target.value })
                    }
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0B0F2F]/70 px-4 text-white focus:border-[#FFD580] focus:outline-none focus:ring-2 focus:ring-[#FFD580]/30"
                  >
                    <option value="">选择此刻的心情</option>
                    {capsuleMoods.map(mood => (
                      <option key={mood} value={mood}>
                        {moodEmoji[mood]} {mood}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-2xl border border-[#FFD580]/20 bg-[#FFD580]/5 p-4 sm:p-5">
                <div className="mb-3 flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[#FFD580]/15 p-2 text-[#FFD580]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <label
                      htmlFor="capsule-open-date"
                      className="block text-sm font-semibold text-white"
                    >
                      什么时候打开这封信？
                    </label>
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      选择一个未来的日期，到那天再回来读给自己听。
                    </p>
                  </div>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {datePresets.map(preset => {
                    const value = addDays(preset.days);
                    const active = formData.openDate === value;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => handleOpenDateChange(value)}
                        className={`min-h-10 rounded-xl border px-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD580] ${active ? "border-[#FFD580] bg-[#FFD580] text-[#0B0F2F]" : "border-white/15 bg-white/5 text-gray-200 hover:border-[#FFD580]/60 hover:bg-[#FFD580]/10"}`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      id="capsule-open-date"
                      type="button"
                      aria-label="选择时间胶囊打开日期"
                      aria-describedby="capsule-date-help capsule-date-error"
                      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0B0F2F]/70 px-4 text-left transition hover:border-[#FFD580]/70 focus:border-[#FFD580] focus:outline-none focus:ring-2 focus:ring-[#FFD580]/30"
                    >
                      <span className="flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 shrink-0 text-[#FFD580]" />
                        <span
                          className={
                            formData.openDate ? "text-white" : "text-gray-500"
                          }
                        >
                          {formData.openDate
                            ? formatDate(
                                new Date(`${formData.openDate}T12:00:00`)
                              )
                            : "点击选择打开日期"}
                        </span>
                      </span>
                      <span className="text-xs text-[#FFD580]">打开日历</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-auto border-[#FFD580]/20 bg-[#111638] p-2 text-white shadow-2xl"
                  >
                    <div className="mb-1 px-2 pt-1 text-xs text-gray-400">
                      至少从明天开始选择
                    </div>
                    <Calendar
                      mode="single"
                      selected={
                        formData.openDate
                          ? new Date(`${formData.openDate}T12:00:00`)
                          : undefined
                      }
                      onSelect={handleCalendarSelect}
                      disabled={{ before: minOpenDateObject }}
                      defaultMonth={
                        formData.openDate
                          ? new Date(`${formData.openDate}T12:00:00`)
                          : minOpenDateObject
                      }
                      captionLayout="dropdown"
                      fromDate={minOpenDateObject}
                      initialFocus
                      className="[--cell-size:2.5rem] bg-transparent text-white"
                    />
                  </PopoverContent>
                </Popover>
                {formData.openDate ? (
                  <div
                    id="capsule-date-help"
                    className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2.5 text-sm"
                  >
                    <span className="text-gray-300">
                      {formatDate(new Date(`${formData.openDate}T12:00:00`))}
                    </span>
                    <span className="shrink-0 font-semibold text-[#FFD580]">
                      {daysUntil(new Date(`${formData.openDate}T00:00:00`))}{" "}
                      天后
                    </span>
                  </div>
                ) : (
                  <p
                    id="capsule-date-help"
                    className="mt-3 text-xs text-gray-500"
                  >
                    也可以点击上方快捷选项，马上设定一个日期。
                  </p>
                )}
                {dateError && (
                  <p
                    id="capsule-date-error"
                    role="alert"
                    className="mt-2 text-xs text-red-300"
                  >
                    {dateError}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  打开时的AI回复（可选）
                </label>
                <textarea
                  value={formData.autoReply}
                  onChange={e =>
                    setFormData({ ...formData, autoReply: e.target.value })
                  }
                  placeholder="给未来的自己留一句温柔的回复..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD580] focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <Button
                  className="min-h-11 bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                  onClick={handleCreateCapsule}
                  disabled={
                    createMutation.isPending ||
                    !formData.content.trim() ||
                    !formData.openDate ||
                    !!dateError
                  }
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  创建胶囊
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 border-white/20 text-gray-300"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </Card>
        )}

        {capsules.length > 0 && (
          <section
            aria-labelledby="capsule-analytics-title"
            className="mb-6 space-y-4"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="capsule-analytics-title"
                  className="text-xl font-semibold"
                >
                  你的情绪与主题轨迹
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  从你写给未来的信里，看见最近在意的事。
                </p>
              </div>
              <span className="hidden text-xs text-gray-500 sm:block">
                基于全部时间胶囊
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["全部胶囊", analytics.total, "封"],
                ["已打开", analytics.opened, "封"],
                ["已分类", analytics.categorized, "封"],
                ["有心情记录", analytics.withMood, "封"],
              ].map(([label, value, unit]) => (
                <Card
                  key={String(label)}
                  className="border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#FFD580]">
                    {value}
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      {unit}
                    </span>
                  </p>
                </Card>
              ))}
            </div>
            {analytics.categories.length > 0 || analytics.moods.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="border-white/10 bg-white/5 p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-gray-200">分类分布</h3>
                    <span className="text-xs text-gray-500">按封数</span>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.categories}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          stroke="#8b93ad"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={62}
                          stroke="#8b93ad"
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,213,128,0.08)" }}
                          contentStyle={{
                            background: "#111638",
                            border: "1px solid rgba(255,213,128,0.25)",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                          formatter={(value: number) => [`${value} 封`, "数量"]}
                        />
                        <Bar
                          dataKey="count"
                          fill="#FFD580"
                          radius={[0, 5, 5, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="border-white/10 bg-white/5 p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-gray-200">心情分布</h3>
                    <span className="text-xs text-gray-500">已记录的心情</span>
                  </div>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.moods}
                        margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#8b93ad"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={52}
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke="#8b93ad"
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,213,128,0.08)" }}
                          contentStyle={{
                            background: "#111638",
                            border: "1px solid rgba(255,213,128,0.25)",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                          formatter={(value: number) => [`${value} 封`, "数量"]}
                        />
                        <Bar
                          dataKey="count"
                          radius={[5, 5, 0, 0]}
                          maxBarSize={28}
                        >
                          {analytics.moods.map(item => (
                            <Cell
                              key={item.name}
                              fill={
                                moodEmoji[item.name] ? "#A7D8C9" : "#FFD580"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-[#FFD580]/25 bg-[#FFD580]/5 p-5 text-sm text-gray-400">
                为胶囊添加分类或心情后，这里会逐渐形成你的专属情绪画像。
              </Card>
            )}
          </section>
        )}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Filter className="h-4 w-4 text-[#FFD580]" />
            筛选胶囊
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              aria-label="筛选状态"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="min-h-10 rounded-xl border border-white/15 bg-[#0B0F2F] px-3 text-sm text-gray-200 focus:border-[#FFD580] focus:outline-none"
            >
              <option value="all">全部</option>
              <option value="pending">待打开</option>
              <option value="opened">已打开</option>
            </select>
            <select
              aria-label="按分类筛选"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="min-h-10 rounded-xl border border-white/15 bg-[#0B0F2F] px-3 text-sm text-gray-200 focus:border-[#FFD580] focus:outline-none"
            >
              <option value="all">所有分类</option>
              {capsuleCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              aria-label="排序方式"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="min-h-10 rounded-xl border border-white/15 bg-[#0B0F2F] px-3 text-sm text-gray-200 focus:border-[#FFD580] focus:outline-none"
            >
              <option value="soonest">按打开日期升序</option>
              <option value="latest">按打开日期降序</option>
            </select>
          </div>
        </div>

        {listQuery.isLoading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-gray-400">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#FFD580]" />
            正在加载你的时间胶囊...
          </div>
        )}
        {listQuery.isError && (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-6 text-center">
            <p className="mb-4 text-red-200">时间胶囊加载失败，请稍后重试。</p>
            <Button
              variant="outline"
              className="border-red-200/30 text-red-100"
              onClick={() => listQuery.refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重新加载
            </Button>
          </div>
        )}
        {!listQuery.isLoading &&
          !listQuery.isError &&
          capsules.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#FFD580]/30 bg-[#FFD580]/5 px-6 py-14 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-[#FFD580]/70" />
              <h2 className="mb-2 text-xl font-semibold">还没有时间胶囊</h2>
              <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-gray-400">
                给未来的自己写一封信吧。选择一个打开日期，让这份心意在合适的时间回来找你。
              </p>
              <Button
                className="bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                创建第一枚胶囊
              </Button>
            </div>
          )}
        {!listQuery.isLoading &&
          !listQuery.isError &&
          capsules.length > 0 &&
          visibleCapsules.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
              <p className="mb-4 text-gray-300">这个筛选条件下没有胶囊</p>
              <Button
                variant="outline"
                className="border-white/20 text-gray-200"
                onClick={() => setStatusFilter("all")}
              >
                查看全部
              </Button>
            </div>
          )}

        <div className="space-y-4">
          {visibleCapsules.map(capsule => {
            const ready =
              capsule.status === "pending" && daysUntil(capsule.openDate) === 0;
            const days = daysUntil(capsule.openDate);
            const progress =
              capsule.status === "opened"
                ? 100
                : progressPercent(capsule.createdAt, capsule.openDate);
            return (
              <Card
                key={capsule.id}
                className={`border p-5 transition-all sm:p-6 ${ready ? "border-[#FFD580]/50 bg-gradient-to-r from-[#FFD580]/20 to-[#FFC857]/10" : "border-white/10 bg-white/5"}`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-3 flex-1 whitespace-pre-wrap break-words text-gray-300">
                      {capsule.content}
                    </p>
                    {(capsule.category || capsule.mood) && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {capsule.category && (
                          <span className="rounded-full border border-[#FFD580]/25 bg-[#FFD580]/10 px-2 py-1 text-[11px] text-[#FFE2A3]">
                            #{capsule.category}
                          </span>
                        )}
                        {capsule.mood && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300">
                            {moodEmoji[capsule.mood] || ""} {capsule.mood}
                          </span>
                        )}
                      </div>
                    )}
                    {capsule.status === "opened" && (
                      <span className="shrink-0 rounded-full bg-green-400/15 px-2.5 py-1 text-xs text-green-300">
                        已打开
                      </span>
                    )}
                  </div>
                  {capsule.status === "pending" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={
                            ready
                              ? "font-semibold text-[#FFD580]"
                              : "text-gray-400"
                          }
                        >
                          {ready
                            ? "✨ 今天可以打开"
                            : `距离打开还有 ${days} 天`}
                        </span>
                        <span className="text-gray-500">
                          {formatDate(capsule.openDate)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FFD580] to-[#FFC857] transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {Math.round(progress)}% 的等待旅程已完成
                      </p>
                    </div>
                  )}
                  {capsule.status === "opened" && capsule.autoReply && (
                    <div className="rounded-xl border border-[#FFD580]/20 bg-[#FFD580]/10 p-4">
                      <p className="mb-1 text-xs text-gray-400">给现在的你</p>
                      <p className="text-sm leading-6 text-gray-300">
                        {capsule.autoReply}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">
                      创建于 {formatDate(capsule.createdAt)}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      {capsule.status === "pending" && ready && (
                        <Button
                          size="sm"
                          className="min-h-10 bg-[#FFD580] text-[#0B0F2F] hover:bg-yellow-400"
                          onClick={() => handleOpenCapsule(capsule)}
                          disabled={openMutation.isPending}
                        >
                          <Unlock className="mr-1 h-4 w-4" />
                          打开
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-10 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDeleteCapsule(capsule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
