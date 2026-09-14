import type { Metadata } from "next"
import { SeoLandingPage } from "@/components/marketing/SeoLandingPage"
import { getSeoPageZh } from "@/lib/seo-pages-zh"

const page = getSeoPageZh("8d-report-example")

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
  alternates: {
    canonical: "https://www.8d-reports.com/zh/8d-report-example",
    languages: {
      en: "https://www.8d-reports.com/8d-report-example",
      "zh-CN": "https://www.8d-reports.com/zh/8d-report-example",
    },
  },
}

export default function ChineseEightDReportExamplePage() {
  if (!page) return null
  return <SeoLandingPage page={page} locale="zh" />
}
