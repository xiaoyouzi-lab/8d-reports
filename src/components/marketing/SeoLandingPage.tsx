import Link from "next/link"
import { ArrowRight, Check, FileText, Search, ShieldCheck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import type { SeoPage } from "@/lib/seo-pages"
import { cn } from "@/lib/utils"

export type SeoLandingLocale = "en" | "zh"

// The legacy SEO landing renderer is shared by the English pages in
// src/app/(marketing)/* and their Simplified Chinese mirrors under
// src/app/zh/*. The default locale stays "en", so existing English pages keep
// byte-for-byte identical copy; the zh mirror overrides only the shared page
// chrome (buttons, section headings, feature blurbs) and localizes the two
// internal links.
const COPY = {
  en: {
    signupHref: "/signup",
    sampleHref: "/sample-report",
    primaryCta: "Create free 8D report",
    sampleCta: "View sample report",
    needTitle: "What quality teams need from this workflow",
    needBody:
      "The goal is not to replace quality judgment. It is to make the report easier to complete, review, export, and reuse.",
    checklistTitle: "Practical checklist",
    createTitle: "Create the first report free",
    createBody:
      "Free includes 3 lifetime reports and the complete editor. Upgrade when no-watermark export, Word and Excel export, company logo, editable sharing, or deep historical search becomes valuable.",
    startCta: "Start free",
    exampleCta: "See example",
    faqTitle: "Questions quality teams ask",
  },
  zh: {
    signupHref: "/signup",
    sampleHref: "/zh/sample-report",
    primaryCta: "免费创建 8D 报告",
    sampleCta: "查看示例报告",
    needTitle: "质量团队需要从这一工作流得到什么",
    needBody:
      "目标不是取代质量判断，而是让报告更容易完成、评审、导出和复用。",
    checklistTitle: "实用检查清单",
    createTitle: "免费创建第一份报告",
    createBody:
      "免费版包含 3 份终身报告和完整编辑器。当无水印导出、Word 和 Excel 导出、公司 Logo、可编辑分享或深度历史检索变得有价值时再升级。",
    startCta: "免费开始",
    exampleCta: "查看示例",
    faqTitle: "质量团队常问的问题",
  },
} as const

const FEATURES = [
  {
    icon: FileText,
    title: { en: "Structured report", zh: "结构化报告" },
    text: { en: "D0-D8 sections keep the investigation readable.", zh: "D0-D8 分区让调查清晰可读。" },
  },
  {
    icon: ShieldCheck,
    title: { en: "Evidence attached", zh: "证据与附件" },
    text: { en: "Photos and files stay tied to the relevant step.", zh: "照片与文件绑定到相关步骤。" },
  },
  {
    icon: Search,
    title: { en: "Reusable history", zh: "知识库复用" },
    text: { en: "Pro search helps find similar past issues.", zh: "检索类似历史问题，减少从零开始。" },
  },
] as const

export function SeoLandingPage({
  page,
  locale = "en",
}: {
  page: SeoPage
  locale?: SeoLandingLocale
}) {
  const copy = COPY[locale]

  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {page.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={copy.signupHref}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
                )}
              >
                {copy.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={copy.sampleHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-slate-300 px-6"
                )}
              >
                {copy.sampleCta}
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Report #8D-2026-014
                  </p>
                  <p className="text-base font-semibold text-slate-950">
                    Guided D0-D8 report
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Saved
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["D2", "Describe the problem clearly"],
                  ["D3", "Contain affected products"],
                  ["D4", "Verify root cause"],
                  ["D5", "Define corrective action"],
                  ["D7", "Prevent recurrence"],
                ].map(([step, text]) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                      {step}
                    </span>
                    <span className="text-sm text-slate-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.needTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {copy.needBody}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((item) => (
              <div key={item.title[locale]} className="rounded-lg border border-slate-200 p-5">
                <item.icon className="h-5 w-5 text-indigo-600" />
                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  {item.title[locale]}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {copy.checklistTitle}
            </h2>
            <div className="mt-6 space-y-3">
              {page.checklist.map((item) => (
                <div key={item} className="flex gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              {copy.createTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {copy.createBody}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={copy.signupHref}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 bg-indigo-600 px-6 hover:bg-indigo-700"
                )}
              >
                {copy.startCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={copy.sampleHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-indigo-200 bg-white px-6"
                )}
              >
                {copy.exampleCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {page.faq.map((item) => (
              <article key={item.question} className="rounded-lg bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-950">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
