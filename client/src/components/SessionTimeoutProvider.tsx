import { ReactNode } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

export function SessionTimeoutProvider({ children }: { children: ReactNode }) {
  useSessionTimeout();
  return <>{children}</>;
}
