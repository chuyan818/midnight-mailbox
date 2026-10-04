import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

const PRESENCE_KEY = "midnight-mailbox-presence-id";
const HEARTBEAT_INTERVAL_MS = 30_000;

function getVisitorId() {
  const existing = window.localStorage.getItem(PRESENCE_KEY);
  if (existing) return existing;
  const created = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(PRESENCE_KEY, created);
  return created;
}

export default function PresenceTracker() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const heartbeat = trpc.presence.heartbeat.useMutation();

  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  useEffect(() => {
    if (!visitorId) return;
    const sendHeartbeat = () => heartbeat.mutate({ visitorId });
    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [heartbeat.mutate, visitorId]);

  return null;
}
