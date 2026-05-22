import { getTranslations } from "next-intl/server"
import Link from "next/link"

export default async function FaqPage() {
  const t = await getTranslations("marketing")

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("faqTitle")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("faqDesc")}</p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-foreground">{faq.q}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">Ready to get started?</p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t("ctaStart")}
        </Link>
      </div>
    </div>
  )
}
