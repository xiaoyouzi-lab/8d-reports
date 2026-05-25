"use client"

import { useEffect, useState } from "react";

export function usePlan(sessionPlan?: unknown) {
  const initialPlan = sessionPlan === "pro" ? "pro" : "free";
  const [plan, setPlan] = useState<"free" | "pro">(initialPlan);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/subscription")
        .then((res) => (res.ok ? res.json() : null))
        .then((subscription) => {
          const status = subscription?.status;
          const active = status === "active" || status === "trialing";
          setPlan(active ? "pro" : initialPlan);
        })
        .catch(() => setPlan(initialPlan))
        .finally(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [initialPlan]);

  return { plan, isPro: plan === "pro", loading };
}
