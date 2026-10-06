import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_WARNING_MS = 5 * 60 * 1000;
export const SESSION_WARNING_TOAST_ID = "session-timeout-warning";

interface UseSessionTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
}

/** Automatically signs an authenticated user out after a period of inactivity. */
export function useSessionTimeout({
  timeoutMs = SESSION_TIMEOUT_MS,
  warningMs = SESSION_WARNING_MS,
}: UseSessionTimeoutOptions = {}) {
  const { isAuthenticated, logout } = useAuth();
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutRef = useRef(logout);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    warningTimer.current = null;
    logoutTimer.current = null;
  }, []);

  const scheduleTimeout = useCallback(() => {
    clearTimers();
    toast.dismiss(SESSION_WARNING_TOAST_ID);
    if (!isAuthenticated) return;

    const safeWarningMs = Math.min(Math.max(warningMs, 0), timeoutMs);
    warningTimer.current = setTimeout(() => {
      toast.warning("长时间没有操作，5分钟后将自动退出登录", {
        id: SESSION_WARNING_TOAST_ID,
        duration: safeWarningMs,
      });
    }, timeoutMs - safeWarningMs);

    logoutTimer.current = setTimeout(async () => {
      toast.dismiss(SESSION_WARNING_TOAST_ID);
      toast.info("由于长时间未操作，你已被安全退出");
      await logoutRef.current();
      window.location.assign("/");
    }, timeoutMs);
  }, [clearTimers, isAuthenticated, timeoutMs, warningMs]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    let activityFrame: number | null = null;
    const handleActivity = () => {
      if (activityFrame !== null) return;
      activityFrame = window.requestAnimationFrame(() => {
        activityFrame = null;
        scheduleTimeout();
      });
    };

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    scheduleTimeout();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      if (activityFrame !== null) window.cancelAnimationFrame(activityFrame);
      clearTimers();
      toast.dismiss(SESSION_WARNING_TOAST_ID);
    };
  }, [clearTimers, isAuthenticated, scheduleTimeout]);
}
