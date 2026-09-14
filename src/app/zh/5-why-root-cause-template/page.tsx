import type { Metadata } from "next"
import { SeoLandingPage } from "@/components/marketing/SeoLandingPage"
import { getSeoPageZh } from "@/lib/seo-pages-zh"

const page = getSeoPageZh("5-why-root-cause-template")

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
  alternates: {
    canonical: "https://www.8d-reports.com/zh/5-why-root-cause-template",
    languages: {
      en: "https://www.8d-reports.com/5-why-root-cause-template",
      "zh-CN": "https://www.8d-reports.com/zh/5-why-root-cause-template",
    },
  },
}

export default function ChineseFiveWhyRootCauseTemplatePage() {
  if (!page) return null
  return <SeoLandingPage page={page} locale="zh" />
}
