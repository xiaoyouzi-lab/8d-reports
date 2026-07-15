"use client";

import { CustomerReviewWorkspace } from "@/components/quality-cases/CustomerReviewWorkspace";
import { SupplierGuidedTask } from "@/components/quality-cases/SupplierGuidedTask";

export function ExternalTaskPage({
  token,
  view,
}: {
  token: string;
  view: "supplier" | "customer";
}) {
  return view === "supplier" ? (
    <SupplierGuidedTask token={token} />
  ) : (
    <CustomerReviewWorkspace token={token} />
  );
}
