import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: { shape?: string; color?: string; layout?: string; label?: string; height?: number };
        createSubscription: (data: unknown, actions: { subscription: { create: (input: { plan_id: string }) => Promise<string> } }) => Promise<string>;
        onClick?: () => void;
        onApprove: (data: { subscriptionID?: string }) => void | Promise<void>;
        onCancel?: () => void;
        onError?: (error: unknown) => void;
      }) => { render: (selector: string) => Promise<void> };
    };
  }
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "BAAYBLuXWAsSCiV36z-hShXpFEaY9gYmUg5esI_n4W5796X-K2HO-OTg4WDGi-7YqGm0RS4worre4erQng";
const PAYPAL_PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_ID || "P-72U41601JC0053143NLAFGMY";
const PAYPAL_SCRIPT_ID = "paypal-subscription-sdk";

export interface PayPalCopy {
  paymentSubmitted: string;
  paymentCancelled: string;
  paymentUnavailable: string;
  paymentButtonLoading: string;
  paymentConfirming: string;
  paymentLoadFailed: string;
}

interface PayPalSubscriptionButtonProps {
  onApproved?: (subscriptionId: string) => void | Promise<void>;
  onFailed?: () => void;
  copy: PayPalCopy;
  heading?: string;
  description?: string;
}

export default function PayPalSubscriptionButton({ onApproved, onFailed, copy, heading, description }: PayPalSubscriptionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderButton = async () => {
      if (!window.paypal || !containerRef.current || renderedRef.current || cancelled) return;
      renderedRef.current = true;
      try {
        await window.paypal.Buttons({
          style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe", height: 48 },
          onClick: () => setProcessing(true),
          createSubscription: (_data, actions) => actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
          onApprove: async (data) => {
            if (!data.subscriptionID) {
              setProcessing(false);
              toast.error(copy.paymentUnavailable);
              return;
            }
            try {
              await onApproved?.(data.subscriptionID);
              toast.success(copy.paymentSubmitted);
            } catch (error) {
              console.error("PayPal pending registration error", error);
              onFailed?.();
              toast.error(copy.paymentUnavailable);
            } finally {
              setProcessing(false);
            }
          },
          onCancel: () => {
            setProcessing(false);
            toast(copy.paymentCancelled);
          },
          onError: (error) => {
            setProcessing(false);
            console.error("PayPal subscription error", error);
            onFailed?.();
            toast.error(copy.paymentUnavailable);
          },
        }).render("#paypal-subscription-button");
        if (!cancelled) setLoading(false);
      } catch (error) {
        renderedRef.current = false;
        setLoading(false);
        console.error("PayPal SDK render error", error);
        toast.error(copy.paymentLoadFailed);
      }
    };

    if (window.paypal) {
      void renderButton();
      return () => { cancelled = true; };
    }

    let script = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = PAYPAL_SCRIPT_ID;
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&vault=true&intent=subscription`;
      script.dataset.sdkIntegrationSource = "button-factory";
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderButton);
    script.addEventListener("error", () => {
      if (!cancelled) {
        setLoading(false);
        toast.error(copy.paymentLoadFailed);
      }
    });

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderButton);
    };
  }, [copy, onApproved]);

  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#FFD580]/45 bg-gradient-to-br from-[#FFD580]/15 via-white/[0.06] to-transparent p-4 shadow-[0_12px_40px_rgba(255,213,128,0.12)] transition-all duration-300 hover:border-[#FFD580]/70 hover:shadow-[0_16px_48px_rgba(255,213,128,0.2)]" data-testid="paypal-subscription">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFD580] text-sm font-black text-[#0B0F2F] shadow-lg">P</div>
        <div>
          {heading && <p className="text-sm font-bold text-white">{heading}</p>}
          {description && <p className="mt-1 text-xs leading-5 text-white/60">{description}</p>}
        </div>
      </div>
      {(loading || processing) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[#0B0F2F]/65 backdrop-blur-[1px]" data-testid="paypal-loading">
          <div className="flex items-center gap-2 rounded-full bg-[#1C1F4A] px-3 py-2 text-xs text-white/85 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-[#FFD580]" aria-hidden="true" />
            <span>{loading ? copy.paymentButtonLoading : copy.paymentConfirming}</span>
          </div>
        </div>
      )}
      <div ref={containerRef} id="paypal-subscription-button" />
    </div>
  );
}
