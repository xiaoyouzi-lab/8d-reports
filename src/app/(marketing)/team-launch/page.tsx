import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "8D Team Launch Service | Launch Your Online 8D Workflow",
  description: "We convert your 8D template, configure your Team workspace, train your quality team, and help deliver the first customer-ready report.",
  alternates: { canonical: "https://www.8d-reports.com/team-launch" },
}

const included = [
  "Convert one existing Word, Excel, PDF, or customer-specific 8D template",
  "Configure the Team workspace and Owner / Editor / Viewer roles",
  "Adapt customer-ready PDF and Word export formatting",
  "Help complete the first real 8D report",
  "30-60 minute team training session",
  "One month of the Team plan",
]

export default function TeamLaunchPage() {
  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">8D Team Launch</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">Launch your online 8D workflow in 7 days.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            We convert your existing customer 8D template, configure the team workspace, train your quality team, and help complete the first customer-ready report.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/custom-8d-template-setup?service=team_launch#request" className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}>
              Request Team Launch <ArrowRight className="size-4" />
            </Link>
            <span className="font-mono text-xl font-semibold">From $999</span>
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">A working process, not another empty account</h2>
            <p className="mt-4 leading-7 text-slate-600">Team Launch is designed for small manufacturing quality teams that need the next customer complaint handled without scattered Word files and email attachments.</p>
          </div>
          <ul className="space-y-3">
            {included.map((item) => <li key={item} className="flex gap-3 rounded-lg border border-slate-200 p-4 text-sm leading-6"><CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />{item}</li>)}
          </ul>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold">Bring the template you use today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">We will review the format, confirm scope, and tell you what can be launched within the base service.</p>
          <Link href="/custom-8d-template-setup?service=team_launch#request" className={cn(buttonVariants({ size: "lg" }), "mt-7 bg-white text-slate-950 hover:bg-slate-100")}>Submit your template</Link>
        </div>
      </section>
    </div>
  )
}
