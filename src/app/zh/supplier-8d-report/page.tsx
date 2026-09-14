import type { Metadata } from "next"
import { SeoLandingPage } from "@/components/marketing/SeoLandingPage"
import { getSeoPageZh } from "@/lib/seo-pages-zh"

const page = getSeoPageZh("supplier-8d-report")

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
  alternates: {
    canonical: "https://www.8d-reports.com/zh/supplier-8d-report",
    languages: {
      en: "https://www.8d-reports.com/supplier-8d-report",
      "zh-CN": "https://www.8d-reports.com/zh/supplier-8d-report",
    },
  },
}

export default function ChineseSupplierEightDReportPage() {
  if (!page) return null
  return <SeoLandingPage page={page} locale="zh" />
}
