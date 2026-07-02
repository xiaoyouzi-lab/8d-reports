import Link from "next/link"

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#workflow" },
      { label: "Sample report", href: "/sample-report" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "8D template", href: "/8d-report-template" },
      { label: "8D examples", href: "/8d-report-example" },
      { label: "Learn", href: "/learn" },
      { label: "5 Why", href: "/5-why-root-cause-template" },
      { label: "Fishbone", href: "/fishbone-diagram-example/manufacturing-defect" },
      { label: "Corrective action", href: "/corrective-action-report-template" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Docs", href: "/docs" },
      { label: "FAQ", href: "/faq" },
      { label: "Security", href: "/security" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              8D
            </span>
            <span>8D Reports</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            A lightweight 8D response and delivery workspace for quality
            engineers, SQEs, and small manufacturing quality teams.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {link.label}
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
          © 2026 8D Reports. A focused 8D response and delivery workspace.
        </p>
      </div>
    </footer>
  )
}
