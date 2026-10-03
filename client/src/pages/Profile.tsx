import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation, useSearchParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Settings,
  Mail,
  TrendingUp,
  Clock,
  Globe,
  Bell,
  Lock,
  HelpCircle,
  Info,
  LogOut,
  History,
} from "lucide-react";
import { toast } from "sonner";
import MembershipBadge from "@/components/MembershipBadge";
import { getBadgeLabel, getBadgeTier } from "@/lib/membership-tier";
import { useLanguage, translations, type Language } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";
import LanguageSelector from "@/components/LanguageSelector";
import UpgradePromptDialog from "@/components/UpgradePromptDialog";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchParams] = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const profileText = translations[language].profile;
  const extra = pageTranslations[language].profile;
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("notificationsEnabled") !== "false");

  const profileQuery = trpc.user.getProfile.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );
  const { data: profile, isLoading } = profileQuery;
  const paymentStatus = profile?.membership?.paymentStatus === "none" && profile.membership.membershipType !== "free"
    ? "active"
    : profile?.membership?.paymentStatus || "none";
  const previousPaymentStatus = useRef(paymentStatus);

  const badgeTier = getBadgeTier(profile?.membership?.membershipType);
  const badgeLabel = getBadgeLabel(badgeTier);
  const remindersQuery = trpc.membershipReminder.getPendingReminders.useQuery(undefined, { enabled: isAuthenticated });
  const markReminderRead = trpc.membershipReminder.markReminderAsRead.useMutation({
    onSuccess: () => remindersQuery.refetch(),
  });
  const registerPayPalPending = trpc.paypal.registerPending.useMutation({
    onSuccess: () => profileQuery.refetch(),
  });
  const historyQuery = trpc.paypal.history.useQuery(undefined, { enabled: isAuthenticated });
  const cancelPayPal = trpc.paypal.cancel.useMutation({
    onSuccess: async () => {
      setShowCancelConfirm(false);
      await Promise.all([profileQuery.refetch(), historyQuery.refetch()]);
      toast.success(extra.cancelSuccess);
    },
    onError: () => toast.error(extra.cancelFailed),
  });

  useEffect(() => {
    if (!isAuthenticated || paymentStatus !== "pending") return;
    const timer = window.setInterval(() => void profileQuery.refetch(), 3000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, paymentStatus, profileQuery.refetch]);

  useEffect(() => {
    if (previousPaymentStatus.current === "pending" && paymentStatus === "active") {
      toast.success(extra.paymentActiveMessage);
      navigate("/payment-result?status=success");
    } else if (previousPaymentStatus.current === "pending" && paymentStatus === "failed") {
      toast.error(extra.paymentFailedMessage);
    }
    previousPaymentStatus.current = paymentStatus;
  }, [extra.paymentActiveMessage, extra.paymentFailedMessage, navigate, paymentStatus]);

  useEffect(() => {
    if (searchParams.get("payment") === "retry") setShowUpgradeDialog(true);
  }, [searchParams]);
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">请先登录</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-[#FFD580] text-[#0B0F2F]"
          >
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error: any) {
      toast.error("登出失败");
    }
  };

  const handlePayPalApproved = async (subscriptionId: string) => {
    await registerPayPalPending.mutateAsync({ subscriptionId });
    await profileQuery.refetch();
  };

  const handleUpgradeApproved = async (subscriptionId: string) => {
    await handlePayPalApproved(subscriptionId);
    setShowUpgradeDialog(false);
    navigate("/payment-result?status=success");
  };

  const handleCancelPayPal = () => {
    if (!profile?.membership?.paypalSubscriptionId || cancelPayPal.isPending) return;
    cancelPayPal.mutate();
  };

  const paymentStatusLabel = paymentStatus === "pending"
    ? extra.paymentPending
    : paymentStatus === "active"
      ? extra.paymentActive
      : paymentStatus === "failed"
        ? extra.paymentFailed
        : extra.paymentNone;
  const paymentStatusMessage = paymentStatus === "pending"
    ? extra.paymentPendingMessage
    : paymentStatus === "active"
      ? extra.paymentActiveMessage
      : paymentStatus === "failed"
        ? extra.paymentFailedMessage
        : extra.paymentNoneMessage;
  const paymentStatusClass = paymentStatus === "active"
    ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
    : paymentStatus === "failed"
      ? "border-rose-300/30 bg-rose-400/10 text-rose-100"
      : paymentStatus === "pending"
        ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
        : "border-white/10 bg-white/5 text-white/75";
  const hasPayPalSubscription = Boolean(profile?.membership?.paypalSubscriptionId);
  const autoRenewEnabled = profile?.membership?.autoRenew !== false;
  const historyStatusLabels: Record<string, string> = {
    pending: extra.historyStatusPending,
    completed: extra.historyStatusCompleted,
    failed: extra.historyStatusFailed,
    cancelled: extra.historyStatusCancelled,
    expired: extra.historyStatusExpired,
  };

  const displayName = profile?.user?.name || user?.name || "深夜朋友";
  const initials = displayName.trim().slice(0, 1).toUpperCase();
  const languageLabels: Record<Language, string> = { zh: "中文 (简体)", en: "English", ja: "日本語", ko: "한국어" };

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setShowLanguageMenu(false);
    toast.success("语言设置已保存");
  };

  const toggleNotifications = () => {
    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    localStorage.setItem("notificationsEnabled", String(nextValue));
    toast.success(nextValue ? "通知已开启" : "通知已关闭");
  };

  const settingsLabels = {
    zh: { language: "语言设置", notifications: "通知设置", privacy: "隐私设置", help: "帮助与反馈", about: "关于深夜信箱" },
    en: { language: "Language", notifications: "Notifications", privacy: "Privacy", help: "Help & Feedback", about: "About Midnight Mailbox" },
    ja: { language: "言語設定", notifications: "通知設定", privacy: "プライバシー", help: "ヘルプとフィードバック", about: "深夜信箱について" },
    ko: { language: "언어 설정", notifications: "알림 설정", privacy: "개인정보 보호", help: "도움말 및 피드백", about: "심야 우편함 정보" },
  }[language];

  const handleSettingsItem = (setting: string) => {
    if (setting === "language") {
      setShowLanguageMenu((visible) => !visible);
    } else if (setting === "notifications") {
      toggleNotifications();
    } else if (setting === "privacy") {
      navigate("/security-settings");
    } else if (setting === "help") {
      navigate("/premium-support");
    } else if (setting === "about") {
      setShowAbout(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] text-white">
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
            <h1 className="text-2xl font-bold">{profileText.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector compact />
            <button type="button" onClick={() => document.getElementById("profile-settings")?.scrollIntoView({ behavior: "smooth" })} className="p-2 hover:bg-white/10 rounded-lg transition" aria-label={profileText.settings}>
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {remindersQuery.data?.reminders.map((reminder) => (
          <div key={reminder.id} className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-[#FFD580]/30 bg-[#FFD580]/10 p-4 text-sm">
            <div>
              <p className="font-semibold text-[#FFD580]">{extra.expiryTitle}</p>
              <p className="mt-1 text-white/70">{extra.expiryMessage.replace("{when}", reminder.reminderType === "expiry_today" ? extra.expiryToday : reminder.reminderType === "expiry_3days" ? extra.expiry3 : extra.expiry7)}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => markReminderRead.mutate({ reminderId: reminder.id })} className="shrink-0 text-[#FFD580] hover:bg-[#FFD580]/10">{extra.understood}</Button>
          </div>
        ))}
        {/* 用户信息卡片 */}
        <div className="mb-8 p-6 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-start gap-4">
            {/* 头像 */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD580] to-[#FF9F43] flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <span className="text-xl font-bold text-[#0B0F2F]">{initials}</span>
            </div>

            {/* 用户信息 */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold">{extra.greeting}，{displayName}</h2>
                <span>👋</span>
                <MembershipBadge tier={badgeTier} size="small" />
              </div>
              <p className="text-xs text-white/60 mb-2">{extra.days.replace("{days}", "23")}</p>
              <p className="text-xs text-white/70">{extra.mood} <span>🌙</span></p>
            </div>

            {/* 引用语 */}
            <div className="text-right text-xs text-white/50 max-w-xs">
              <p className="italic mb-1">
                "你是否写过了，但仍请我救了？谢谢你一直在这里。"
              </p>
              <p>— 你的信箱</p>
            </div>
          </div>
        </div>

        {/* 统计数据区 - 4列网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button type="button" onClick={() => navigate("/mailbox")} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
            <Mail size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">28</p>
            <p className="text-xs text-white/60">{extra.totalLetters}</p>
          </button>
          <button type="button" onClick={() => navigate("/report")} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
            <TrendingUp size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">8.7</p>
            <p className="text-xs text-white/60">{extra.averageMood}</p>
          </button>
          <button type="button" onClick={() => navigate("/mailbox")} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
            <Mail size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">12</p>
            <p className="text-xs text-white/60">{extra.unread}</p>
          </button>
          <button type="button" onClick={() => toast.info("最近活跃时间已是最新记录")} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center hover:bg-white/10 transition">
            <Clock size={18} className="mx-auto mb-2 text-[#FFD580]" />
            <p className="text-xl font-bold">23:45</p>
            <p className="text-xs text-white/60">{extra.lastActive}</p>
          </button>
        </div>

        {/* 情绪热盐图和本周统计 - 2列 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 情绪热盐图 */}
          <div className="lg:col-span-2 p-6 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold mb-4">{extra.moodTrend}</h3>

            {/* 情绪趋势图 */}
            <div className="mb-4">
              <div className="flex items-end justify-between gap-1 h-20">
                {[
                  { date: "5/16", value: 6.5 },
                  { date: "5/17", value: 7.2 },
                  { date: "5/18", value: 6.8 },
                  { date: "5/19", value: 8.1 },
                  { date: "5/20", value: 7.9 },
                  { date: "5/21", value: 8.5 },
                  { date: extra.today, value: 8.7 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-[#FFD580] to-[#FF9F43] rounded-t-sm transition-all hover:opacity-80"
                      style={{
                        height: `${(item.value / 10) * 100}%`,
                        minHeight: "2px",
                      }}
                    />
                    <span className="text-xs text-white/50">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 情绪分布 */}
            <div className="space-y-2">
                {[
                { emoji: "😊", label: extra.happy, value: 72 },
                { emoji: "😐", label: extra.calm, value: 56 },
                { emoji: "😢", label: extra.low, value: 34 },
              ].map((mood) => (
                <div key={mood.label} className="flex items-center gap-2">
                  <span className="text-sm">{mood.emoji}</span>
                  <span className="text-xs text-white/70 w-8">{mood.label}</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFD580] to-[#FF9F43]"
                      style={{ width: `${mood.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 本周统计 */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">{extra.weeklyLetters}</p>
              <p className="text-2xl font-bold mb-1">4 {extra.lettersUnit}</p>
              <p className="text-xs text-[#FFD580]">{extra.weekChange} +20%</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">{extra.hours}</p>
              <p className="text-2xl font-bold mb-1">3.2 {extra.hoursUnit}</p>
              <p className="text-xs text-[#FFD580]">{extra.weekChange} +15%</p>
            </div>
          </div>
        </div>

        {/* 当前版本和升级建议 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/60 mb-2">{profileText.membershipType}</p>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-lg font-bold">{badgeLabel}</p>
              <MembershipBadge tier={badgeTier} size="small" />
            </div>
            <p className="text-xs text-white/50">
              {badgeTier === "free" ? profileText.free : profileText.membership}
            </p>
            {badgeTier === "premium" ? (
              <Button
                type="button"
                onClick={() => navigate("/premium-support")}
                className="mt-3 h-8 bg-[#FFD580] text-xs text-[#0B0F2F] hover:bg-[#FFC857]"
              >
                {extra.prioritySupport}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setShowUpgradeDialog(true)}
                className="mt-3 h-8 bg-[#FFD580] text-xs text-[#0B0F2F] hover:bg-[#FFC857]"
              >
                {extra.upgradeDialogTitle}
              </Button>
            )}
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between" data-testid="membership-payment-card">
            <div>
              <p className="text-sm font-semibold text-white/85">{extra.subscriptionManagement}</p>
              <p className="mt-1 text-xs text-white/50">{extra.paymentStatusTitle}</p>
              <div className={`rounded-lg border px-3 py-2 ${paymentStatusClass}`} data-testid={`payment-status-${paymentStatus}`}>
                <p className="text-sm font-semibold">{paymentStatusLabel}</p>
                <p className="mt-1 text-xs opacity-85">{paymentStatusMessage}</p>
              </div>
              {paymentStatus === "active" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/65">
                  <span className="rounded-full border border-[#FFD580]/30 bg-[#FFD580]/10 px-2.5 py-1 text-[#FFD580]">{extra.providerPaypal}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{profile?.membership?.membershipType === "yearly" ? extra.upgradeYearly : extra.upgradeMonthly}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{autoRenewEnabled ? extra.autoRenewOn : extra.autoRenewOff}</span>
                </div>
              )}
              {paymentStatus === "active" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-white/60">{extra.benefitDesc}</p>
                  {hasPayPalSubscription && (
                    <>
                      <p className="text-xs text-white/50">{autoRenewEnabled ? extra.autoRenewOn : `${extra.autoRenewOff} · ${extra.subscriptionCancelled}`}</p>
                      {autoRenewEnabled ? (
                        <Button type="button" variant="outline" onClick={() => setShowCancelConfirm(true)} className="h-8 border-white/15 bg-transparent text-xs text-white/75 hover:bg-white/10">
                          {extra.cancelSubscription}
                        </Button>
                      ) : (
                        <div>
                          <p className="mb-2 text-xs text-white/50">{extra.subscriptionRenewDescription}</p>
                          <Button type="button" onClick={() => setShowUpgradeDialog(true)} className="h-8 bg-[#FFD580] text-xs text-[#0B0F2F] hover:bg-[#FFC857]">
                            {extra.subscriptionRenew}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : paymentStatus === "pending" ? (
                <p className="mt-3 text-xs text-white/50">{extra.paymentPendingMessage}</p>
              ) : (
                <Button type="button" onClick={() => setShowUpgradeDialog(true)} className="mt-4 w-full bg-[#FFD580] text-[#0B0F2F] hover:bg-[#FFC857]">
                  {paymentStatus === "failed" ? extra.paymentRetry : extra.upgradeDialogTitle}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 支付历史 */}
        <section className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6" data-testid="payment-history">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-[#FFD580]" />
            <h3 className="text-sm font-semibold">{extra.historyTitle}</h3>
          </div>
          {historyQuery.isLoading ? (
            <p className="text-sm text-white/50">{extra.historyLoading}</p>
          ) : historyQuery.data?.length ? (
            <div className="space-y-2">
              {historyQuery.data.map((record) => (
                <div key={record.id} className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-black/10 p-3 text-xs sm:grid-cols-5 sm:items-center">
                  <div>
                    <p className="text-white/45">{extra.historyDate}</p>
                    <p className="mt-1 text-white/80">{new Date(record.createdAt).toLocaleDateString(language)}</p>
                  </div>
                  <div>
                    <p className="text-white/45">{extra.historyPlan}</p>
                    <p className="mt-1 text-white/80">{record.membershipType === "yearly" ? extra.upgradeYearly : extra.upgradeMonthly}</p>
                  </div>
                  <div>
                    <p className="text-white/45">{extra.historyAmount}</p>
                    <p className="mt-1 text-white/80">{record.amount === "0.00" ? "—" : `${record.currency} ${record.amount}`}</p>
                  </div>
                  <div>
                    <p className="text-white/45">{extra.historyProvider}</p>
                    <p className="mt-1 text-white/80">{record.provider === "paypal" ? extra.providerPaypal : record.provider}</p>
                  </div>
                  <div>
                    <p className="text-white/45">{extra.historyStatus}</p>
                    <p className="mt-1 font-medium text-[#FFD580]">{historyStatusLabels[record.status] || record.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">{extra.historyEmpty}</p>
          )}
        </section>

        {/* 更多设置 */}
        <div id="profile-settings" className="mb-8 p-6 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold mb-4">{profileText.settings}</h3>
          <div className="space-y-2">
            {[
              { icon: Globe, id: "language", label: settingsLabels.language, value: languageLabels[language] },
              { icon: Bell, id: "notifications", label: settingsLabels.notifications, value: notificationsEnabled ? "On" : "Off" },
              { icon: Lock, id: "privacy", label: settingsLabels.privacy },
              { icon: HelpCircle, id: "help", label: settingsLabels.help },
              { icon: Info, id: "about", label: settingsLabels.about, value: "v1.2.0" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSettingsItem(item.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-[#FFD580]" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-xs text-white/50">{item.value}</span>
                    )}
                    <span className="text-white/30">›</span>
                  </div>
                </button>
              );
            })}
          </div>
          {showLanguageMenu && (
            <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-white/10 bg-black/10 p-3">
              {(["zh", "en", "ja", "ko"] as Language[]).map((option) => (
                <button key={option} type="button" onClick={() => handleLanguageChange(option)} className="rounded-md border border-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/10">
                  {languageLabels[option]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 登出按钮 */}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          {extra.logout}
        </Button>
        {showAbout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" role="dialog" aria-modal="true" aria-label="关于深夜信箱">
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#151a3d] p-6 text-center shadow-2xl">
              <h2 className="text-lg font-semibold">{pageTranslations[language].home.brand}</h2>
              <p className="mt-2 text-sm text-white/70">{extra.aboutText}</p>
              <p className="mt-1 text-xs text-white/40">版本 v1.2.0</p>
              <Button type="button" onClick={() => setShowAbout(false)} className="mt-5 bg-[#FFD580] text-[#0B0F2F] hover:bg-[#FFC857]">{extra.gotIt}</Button>
            </div>
          </div>
        )}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-subscription-title">
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#151a3d] p-6 shadow-2xl">
              <h2 id="cancel-subscription-title" className="text-lg font-semibold">{extra.confirmCancelSubscription}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">{extra.cancelSubscriptionDescription}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCancelConfirm(false)} className="border-white/15 bg-transparent text-white/75 hover:bg-white/10">
                  {extra.keepSubscription}
                </Button>
                <Button type="button" onClick={handleCancelPayPal} disabled={cancelPayPal.isPending} className="bg-rose-500/80 text-white hover:bg-rose-500">
                  {cancelPayPal.isPending ? extra.cancelPending : extra.cancelSubscription}
                </Button>
              </div>
            </div>
          </div>
        )}
        <UpgradePromptDialog
          open={showUpgradeDialog}
          copy={extra}
          onClose={() => setShowUpgradeDialog(false)}
          onApproved={handleUpgradeApproved}
          onFailed={() => navigate("/payment-result?status=failed")}
        />
      </div>
    </div>
  );
}
