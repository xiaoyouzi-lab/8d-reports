import type { Metadata } from "next"
import { SeoLandingPage } from "@/components/marketing/SeoLandingPage"
import { getSeoPageZh } from "@/lib/seo-pages-zh"

const page = getSeoPageZh("corrective-action-report-template")

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
  alternates: {
    canonical: "https://www.8d-reports.com/zh/corrective-action-report-template",
    languages: {
      en: "https://www.8d-reports.com/corrective-action-report-template",
      "zh-CN": "https://www.8d-reports.com/zh/corrective-action-report-template",
    },
  },
}

export default function ChineseCorrectiveActionReportTemplatePage() {
  if (!page) return null
  return <SeoLandingPage page={page} locale="zh" />
}
