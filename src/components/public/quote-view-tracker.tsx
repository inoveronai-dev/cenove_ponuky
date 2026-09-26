"use client";

import { useEffect, useRef } from "react";

function getSessionId(): string {
  const key = "mq_view_session";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export function QuoteViewTracker({ publicId }: { publicId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const payload = {
      sessionId: getSessionId(),
      referrer: document.referrer || null,
    };

    void fetch(`/api/quotes/${publicId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  }, [publicId]);

  return null;
}
