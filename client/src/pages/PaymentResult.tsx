import { useEffect, useMemo } from "react";
import { CheckCircle2, CircleAlert, Loader2, ArrowRight, Home } from "lucide-react";
import { useLocation, useSearchParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { pageTranslations } from "@/lib/page-translations";
import LanguageSelector from "@/components/LanguageSelector";

export default function PaymentResult() {
  const [, navigate] = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const copy = pageTranslations[language].profile;
  const requestedStatus = searchParams.get("status");
  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const membershipStatus = profileQuery.data?.membership?.paymentStatus === "none" && profileQuery.data.membership.membershipType !== "free"
    ? "active"
    : profileQuery.data?.membership?.paymentStatus;

  useEffect(() => {
    if (!isAuthenticated || membershipStatus !== "pending") return;
    const timer = window.setInterval(() => void profileQuery.refetch(), 3000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, membershipStatus, profileQuery.refetch]);

  const status = useMemo(() => {
    if (membershipStatus === "active") return "active";
    if (membershipStatus === "failed") return "failed";
    if (requestedStatus === "failed") return "failed";
    return "pending";
  }, [membershipStatus, requestedStatus]);

  const isActive = status === "active";
  const isFailed = status === "failed";
  const title = isActive ? copy.paymentActive : isFailed ? copy.paymentFailed : copy.paymentPending;
  const message = isActive ? copy.paymentActiveMessage : isFailed ? copy.paymentFailedMessage : copy.paymentPendingMessage;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0B0F2F] via-[#1C1F4A] to-[#0B0F2F] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-xl flex-col justify-center">
        <div className="mb-8 flex justify-end"><LanguageSelector compact /></div>
        <section className={`rounded-3xl border p-6 text-center shadow-2xl backdrop-blur-md transition-all duration-500 sm:p-10 ${
          isActive ? "border-emerald-300/35 bg-emerald-400/10 shadow-emerald-950/30" : isFailed ? "border-rose-300/35 bg-rose-400/10 shadow-rose-950/30" : "border-[#FFD580]/35 bg-white/[0.06] shadow-[#FFD580]/10"
        }`} data-testid={`payment-result-${status}`}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            {isActive ? <CheckCircle2 className="h-11 w-11 text-emerald-300" aria-hidden="true" /> : isFailed ? <CircleAlert className="h-11 w-11 text-rose-300" aria-hidden="true" /> : <Loader2 className="h-11 w-11 animate-spin text-[#FFD580]" aria-hidden="true" />}
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-[#FFD580]/80">PayPal</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/70">{message}</p>
          {status === "pending" && <p className="mt-4 text-xs text-white/45">{copy.paymentPendingMessage}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isFailed && <button type="button" onClick={() => navigate("/profile?payment=retry")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFD580] px-5 py-3 text-sm font-bold text-[#0B0F2F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFC857]">{copy.paymentRetry}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
            <button type="button" onClick={() => navigate("/profile")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-white/80 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10">{copy.subscriptionManagement}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => navigate("/")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/55 transition duration-200 hover:bg-white/10 hover:text-white"><Home className="h-4 w-4" aria-hidden="true" />{copy.upgradeClose}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
