import type { Metadata } from "next"
import { SeoLandingPage } from "@/components/marketing/SeoLandingPage"
import { getSeoPage } from "@/lib/seo-pages"

const page = getSeoPage("5-why-root-cause-template")

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description,
}

export default function FiveWhyRootCauseTemplatePage() {
  if (!page) return null
  return <SeoLandingPage page={page} />
}
