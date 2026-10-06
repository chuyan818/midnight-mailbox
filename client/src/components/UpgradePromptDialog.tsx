import { useState } from "react";
import { Check, X } from "lucide-react";
import PayPalSubscriptionButton, { type PayPalPlanType } from "@/components/PayPalSubscriptionButton";
import { pageTranslations } from "@/lib/page-translations";

type ProfileCopy = (typeof pageTranslations)[keyof typeof pageTranslations]["profile"];

interface UpgradePromptDialogProps {
  open: boolean;
  copy: ProfileCopy;
  onClose: () => void;
  onApproved: (subscriptionId: string, planType: PayPalPlanType) => void | Promise<void>;
  onFailed?: () => void;
}

const BENEFITS = [
  "upgradeFeatureLetters",
  "upgradeFeatureSupport",
  "upgradeFeatureAnalysis",
  "upgradeFeatureThemes",
] as const;

export default function UpgradePromptDialog({ open, copy, onClose, onApproved, onFailed }: UpgradePromptDialogProps) {
  const [planType, setPlanType] = useState<PayPalPlanType>("yearly");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upgrade-dialog-title">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#FFD580]/30 bg-[#151a3d] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#FFD580]/80">Midnight Mailbox</p>
            <h2 id="upgrade-dialog-title" className="mt-2 text-xl font-bold text-white sm:text-2xl">{copy.upgradeDialogTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">{copy.upgradeDialogDescription}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label={copy.upgradeClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-sm font-semibold text-[#FFD580]">{copy.upgradeBenefitsTitle}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((benefitKey) => (
              <div key={benefitKey} className="flex items-start gap-2 text-sm text-white/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>{copy[benefitKey]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="paypal-plan-selector">
          <button type="button" onClick={() => setPlanType("monthly")} className={`rounded-xl border p-4 text-left transition-all duration-200 ${planType === "monthly" ? "border-[#FFD580]/70 bg-[#FFD580]/10 shadow-[0_0_24px_rgba(255,213,128,0.12)]" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}>
            <p className="text-sm font-semibold text-white">{copy.upgradeMonthly}</p>
            <p className="mt-2 text-xs leading-5 text-white/60">{copy.upgradeFeatureLetters}</p>
            <p className="mt-1 text-xs leading-5 text-white/60">{copy.upgradeFeatureThemes}</p>
          </button>
          <button type="button" onClick={() => setPlanType("yearly")} className={`rounded-xl border p-4 text-left transition-all duration-200 ${planType === "yearly" ? "border-[#FFD580]/70 bg-[#FFD580]/10 shadow-[0_0_24px_rgba(255,213,128,0.12)]" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#FFD580]">{copy.upgradeYearly}</p>
              <span className="rounded-full bg-[#FFD580]/20 px-2 py-1 text-[10px] text-[#FFD580]">{copy.upgradeRecommended}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/75">{copy.upgradeFeatureSupport}</p>
            <p className="mt-1 text-xs leading-5 text-white/75">{copy.upgradeFeatureAnalysis}</p>
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-[#FFD580]/20 bg-black/10 p-3">
          <PayPalSubscriptionButton
            planType={planType}
            onApproved={onApproved}
            onFailed={onFailed}
            copy={copy}
            heading={copy.providerPaypal}
            description={copy.paymentPendingMessage}
          />
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-white/65 transition hover:bg-white/10 hover:text-white">
          {copy.upgradeClose}
        </button>
      </div>
    </div>
  );
}
