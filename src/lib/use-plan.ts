"use client"

import { useEffect, useState } from "react";
import { PLAN_ENTITLEMENTS, type PlanEntitlements, type PlanKey, isPlanKey } from "@/lib/plans";

export function usePlan(sessionPlan?: unknown) {
  const initialPlan: PlanKey = isPlanKey(sessionPlan) ? sessionPlan : "free";
  const [plan, setPlan] = useState<PlanKey>(initialPlan);
  const [entitlements, setEntitlements] = useState<PlanEntitlements>(PLAN_ENTITLEMENTS[initialPlan]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/subscription")
        .then((res) => (res.ok ? res.json() : null))
        .then((subscription) => {
          const rawPlan: unknown = subscription?.plan;
          const nextPlan: PlanKey = isPlanKey(rawPlan) ? rawPlan : initialPlan;
          setPlan(nextPlan);
          setEntitlements(subscription?.entitlements || PLAN_ENTITLEMENTS[nextPlan]);
        })
        .catch(() => {
          setPlan(initialPlan);
          setEntitlements(PLAN_ENTITLEMENTS[initialPlan]);
        })
        .finally(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [initialPlan]);

  return {
    plan,
    entitlements,
    isPro: plan === "pro" || plan === "team",
    isTeam: plan === "team",
    loading,
  };
}
