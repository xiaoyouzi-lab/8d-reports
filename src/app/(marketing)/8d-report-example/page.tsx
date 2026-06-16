import type { Metadata } from "next"
import { SeoLandingPage } from "@/components/marketing/SeoLandingPage"
import { getSeoPage } from "@/lib/seo-pages"

const page = getSeoPage("8d-report-example")

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
  alternates: { canonical: "https://www.8d-reports.com/8d-report-example" },
}

export default function EightDReportExamplePage() {
  if (!page) return null
  return <SeoLandingPage page={page} />
}
