import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function PlanCard({
  name,
  price,
  period,
  description,
  features,
  recommended,
  children,
}: {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  recommended?: boolean
  children: ReactNode
}) {
  return (
    <article
      className={cn(
        "relative rounded-lg border bg-white p-6",
        recommended ? "border-2 border-indigo-600" : "border-slate-200",
      )}
    >
      {recommended ? (
        <span className="absolute right-5 top-5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          Recommended
        </span>
      ) : null}
      <h2 className="text-lg font-semibold text-slate-950">{name}</h2>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-mono text-4xl font-semibold text-slate-950">
          {price}
        </span>
        <span className="text-sm text-slate-500">/{period}</span>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
        {description}
      </p>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-8">{children}</div>
    </article>
  )
}
