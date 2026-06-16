import type { Metadata } from "next"
import { SeoLandingPage } from "@/components/marketing/SeoLandingPage"
import { getSeoPage } from "@/lib/seo-pages"

const page = getSeoPage("supplier-8d-report")

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
  alternates: { canonical: "https://www.8d-reports.com/supplier-8d-report" },
}

export default function SupplierEightDReportPage() {
  if (!page) return null
  return <SeoLandingPage page={page} />
}
