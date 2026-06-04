import type { Metadata } from "next"
import Link from "next/link"
import { Archive, ArrowRight, Download, FileText, LockKeyhole } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "8D Workflow Demos | Automotive, Injection Molding, and Electronics",
  description: "Review three complete manufacturing 8D scenarios showing evidence, root cause analysis, approval, report locking, revisions, and customer-ready delivery.",
  alternates: { canonical: "https://www.8d-reports.com/demo-reports" },
}

const demos = [
  {
    title: "Automotive machining burr defect",
    scenario: "CNC aluminum housing burr found during customer incoming inspection.",
    highlights: "D0-D8, evidence, Internal Review, Approved lock, Rev.1, Activity Log",
    example: "/demo-reports/automotive",
    downloadType: "automotive",
  },
  {
    title: "Injection molding sink mark defect",
    scenario: "Visible sink marks found on an injection-molded customer housing.",
    highlights: "5-Why, Fishbone 6M, containment, process correction, approval",
    example: "/demo-reports/molding",
    downloadType: "molding",
  },
  {
    title: "Electronics intermittent LED failure",
    scenario: "LED module intermittently fails during the customer burn-in test.",
    highlights: "Failure evidence, root cause validation, revision history, final delivery",
    example: "/demo-reports/electronics",
    downloadType: "electronics",
  },
]

export default function DemoReportsPage() {
  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Team workflow demos</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">See how a quality team controls a customer-ready 8D report.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Each scenario demonstrates the report content and the governance around it: roles, approval, locking, revisions, Activity Log, and formal delivery.</p>
        </div>
      </section>
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-3">
          {demos.map((demo) => (
            <article key={demo.title} className="flex flex-col rounded-xl border border-slate-200 p-6">
              <LockKeyhole className="size-5 text-indigo-600" />
              <h2 className="mt-5 text-xl font-semibold">{demo.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{demo.scenario}</p>
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{demo.highlights}</p>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <Link href={demo.example} className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}>Review complete example <ArrowRight className="size-4" /></Link>
                <Link href={`/api/sample-reports/${demo.downloadType}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><Download className="size-4" /> Download PDF</Link>
                <Link href={`/api/sample-reports/${demo.downloadType}?format=docx`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><FileText className="size-4" /> Download Word</Link>
                <Link href={`/api/sample-reports/${demo.downloadType}?format=zip`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><Archive className="size-4" /> Download delivery ZIP</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold">Launch the same controlled workflow for your team.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Bring your existing Word, Excel, or customer-specific 8D template. We configure the workflow and help deliver the first report.</p>
          <Link href="/team-launch" className={cn(buttonVariants({ size: "lg" }), "mt-7 bg-white text-slate-950 hover:bg-slate-100")}>View Team Launch</Link>
        </div>
      </section>
    </div>
  )
}
