"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { SeoPage } from "@/content/seo-pages";

type SeoTrackingProps = {
  page: SeoPage;
};

function eventMetadata(page: SeoPage, ctaType?: string) {
  return {
    page_type: page.type,
    slug: page.slug,
    industry: page.industry,
    problem_type: page.problemType,
    cta_type: ctaType,
  };
}

export function SeoPageViewTracker({ page }: SeoTrackingProps) {
  useEffect(() => {
    trackEvent("seo_page_view", eventMetadata(page));
  }, [page]);

  return null;
}

export function SeoPrimaryCta({ page, label = "Create Free 8D Report" }: SeoTrackingProps & { label?: string }) {
  const href = `/signup?intent=create-report&source=seo&slug=${encodeURIComponent(page.slug)}`;

  return (
    <Link
      href={href}
      onClick={() => {
        trackEvent("seo_cta_click", eventMetadata(page, "create_report"));
        trackEvent("seo_signup_click", eventMetadata(page, "create_report"));
      }}
      className={cn(
        buttonVariants({ variant: "default", size: "lg" }),
        "h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
      )}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function SeoTemplateCta({ page, label = "Use This Template" }: SeoTrackingProps & { label?: string }) {
  const href = `/signup?intent=use-template&source=seo&slug=${encodeURIComponent(page.slug)}`;

  return (
    <Link
      href={href}
      onClick={() => {
        trackEvent("seo_template_click", eventMetadata(page, "use_template"));
        trackEvent("seo_signup_click", eventMetadata(page, "use_template"));
      }}
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "h-11 border-slate-300 bg-white px-6"
      )}
    >
      {label}
    </Link>
  );
}

