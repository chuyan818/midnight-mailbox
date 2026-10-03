import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: { shape?: string; color?: string; layout?: string; label?: string };
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

interface PayPalSubscriptionButtonProps {
  onApproved?: (subscriptionId: string) => void | Promise<void>;
}

export default function PayPalSubscriptionButton({ onApproved }: PayPalSubscriptionButtonProps) {
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
          style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe" },
          onClick: () => setProcessing(true),
          createSubscription: (_data, actions) => actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
          onApprove: async (data) => {
            if (!data.subscriptionID) {
              setProcessing(false);
              toast.error("PayPal 未返回订阅编号");
              return;
            }
            try {
              await onApproved?.(data.subscriptionID);
              toast.success("订阅已提交，正在等待 PayPal 确认");
            } catch (error) {
              console.error("PayPal pending registration error", error);
              toast.error("订阅登记失败，请稍后重试");
            } finally {
              setProcessing(false);
            }
          },
          onCancel: () => {
            setProcessing(false);
            toast("PayPal 订阅已取消");
          },
          onError: (error) => {
            setProcessing(false);
            console.error("PayPal subscription error", error);
            toast.error("PayPal 订阅暂时无法完成，请稍后重试");
          },
        }).render("#paypal-subscription-button");
        if (!cancelled) setLoading(false);
      } catch (error) {
        renderedRef.current = false;
        setLoading(false);
        console.error("PayPal SDK render error", error);
        toast.error("PayPal 按钮加载失败");
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
        toast.error("PayPal SDK 加载失败，请检查账号和地区配置");
      }
    });

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderButton);
    };
  }, [onApproved]);

  return (
    <div className="relative mt-4 rounded-lg border border-white/10 bg-black/10 p-3" data-testid="paypal-subscription">
      {(loading || processing) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[#0B0F2F]/65 backdrop-blur-[1px]" data-testid="paypal-loading">
          <div className="flex items-center gap-2 rounded-full bg-[#1C1F4A] px-3 py-2 text-xs text-white/85 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-[#FFD580]" aria-hidden="true" />
            <span>{loading ? "正在加载 PayPal…" : "正在确认订阅…"}</span>
          </div>
        </div>
      )}
      <div ref={containerRef} id="paypal-subscription-button" />
    </div>
  );
}
