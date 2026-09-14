"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { localizedHref } from "@/lib/i18n-routes"

const columns = [
  {
    titleKey: "product",
    links: [
      { labelKey: "howItWorks", href: "/#workflow" },
      { labelKey: "sampleReport", href: "/sample-report" },
      { labelKey: "pricing", href: "/pricing" },
    ],
  },
  {
    titleKey: "resources",
    links: [
      { labelKey: "8dTemplate", href: "/8d-report-template" },
      { labelKey: "8dExamples", href: "/8d-report-example" },
      { labelKey: "learn", href: "/learn" },
      { labelKey: "fiveWhy", href: "/5-why-root-cause-template" },
      { labelKey: "fishbone", href: "/fishbone-diagram-example/manufacturing-defect" },
      { labelKey: "correctiveAction", href: "/corrective-action-report-template" },
    ],
  },
  {
    titleKey: "help",
    links: [
      { labelKey: "helpCenter", href: "/help" },
      { labelKey: "docs", href: "/docs" },
      { labelKey: "faq", href: "/faq" },
      { labelKey: "security", href: "/security" },
      { labelKey: "contact", href: "/contact" },
    ],
  },
  {
    titleKey: "legal",
    links: [
      { labelKey: "privacy", href: "/privacy" },
      { labelKey: "terms", href: "/terms" },
    ],
  },
] as const

export function MarketingFooter() {
  const t = useTranslations("nav")
  const locale = useLocale()

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_2fr]">
        <div>
          <Link href={localizedHref("/", locale)} className="inline-flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              8D
            </span>
            <span>8D Reports</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            {t("tagline")}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.titleKey}>
              <h2 className="text-sm font-semibold text-white">{t(column.titleKey)}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={localizedHref(link.href, locale)}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4">
        <p className="mx-auto max-w-6xl text-xs text-slate-400">
          {t("copyright")}
        </p>
      </div>
    </footer>
  )
}
