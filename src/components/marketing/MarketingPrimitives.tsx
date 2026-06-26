import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}

export function PageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("bg-white text-slate-950", className)}>{children}</div>
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn("py-14 sm:py-16 lg:py-20", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  )
}

export function SectionHeader({
  title,
  description,
  className,
}: {
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  )
}

export function PageHero({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string
  description: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section className={cn("border-b border-slate-200 bg-white", className)}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
        <div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {description}
          </p>
          {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
        {children ? <div className="min-w-0">{children}</div> : null}
      </div>
    </section>
  )
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href: string }>
}) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" /> : null}
            {index === items.length - 1 ? (
              <span className="text-slate-700">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-indigo-700">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function breadcrumbJsonLd(items: Array<{ label: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href,
    })),
  }
}
