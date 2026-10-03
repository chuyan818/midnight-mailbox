import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: { shape?: string; color?: string; layout?: string; label?: string };
        createSubscription: (data: unknown, actions: { subscription: { create: (input: { plan_id: string }) => Promise<string> } }) => Promise<string>;
        onApprove: (data: { subscriptionID?: string }) => void;
        onCancel?: () => void;
        onError?: (error: unknown) => void;
      }) => { render: (selector: string) => Promise<void> };
    };
  }
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "BAAYBLuXWAsSCiV36z-hShXpFEaY9gYmUg5esI_n4W5796X-K2HO-OTg4WDGi-7YqGm0RS4worre4erQng";
const PAYPAL_PLAN_ID = "P-72U41601JC0053143NLAFGMY";
const PAYPAL_SCRIPT_ID = "paypal-subscription-sdk";

interface PayPalSubscriptionButtonProps {
  onApproved?: (subscriptionId: string) => void;
}

export default function PayPalSubscriptionButton({ onApproved }: PayPalSubscriptionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const renderButton = async () => {
      if (!window.paypal || !containerRef.current || renderedRef.current || cancelled) return;
      renderedRef.current = true;
      setLoading(false);
      try {
        await window.paypal.Buttons({
          style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe" },
          createSubscription: (_data, actions) => actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
          onApprove: (data) => {
            if (data.subscriptionID) onApproved?.(data.subscriptionID);
            toast.success("PayPal 订阅已提交，等待服务端确认会员状态");
          },
          onCancel: () => toast("PayPal 订阅已取消"),
          onError: (error) => {
            console.error("PayPal subscription error", error);
            toast.error("PayPal 订阅暂时无法完成，请稍后重试");
          },
        }).render("#paypal-subscription-button");
      } catch (error) {
        renderedRef.current = false;
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
    <div className="mt-4 rounded-lg border border-white/10 bg-black/10 p-3" data-testid="paypal-subscription">
      {loading && <p className="mb-2 text-center text-xs text-white/50">正在加载 PayPal…</p>}
      <div ref={containerRef} id="paypal-subscription-button" />
    </div>
  );
}
