import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, FileSpreadsheet, FileText, Workflow, Wrench } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CustomTemplateRequestForm } from "@/components/marketing/CustomTemplateRequestForm"

export const metadata: Metadata = {
  title: "Custom 8D Template Setup | Convert Word and Excel 8D Templates",
  description:
    "Convert your company Word, Excel, or customer-specific 8D template into a reusable online 8D workflow for factory-floor reporting, sharing, and export.",
  alternates: {
    canonical: "https://www.8d-reports.com/custom-8d-template-setup",
  },
}

const inputs = [
  {
    icon: FileText,
    title: "Company Word template",
    text: "Keep your current sections, required fields, approval wording, customer-facing language, and branded export structure.",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel 8D workbook",
    text: "Turn scattered sheets, merged cells, checklists, 5-Why tables, and action lists into guided online inputs.",
  },
  {
    icon: Wrench,
    title: "Customer-specific format",
    text: "Support supplier portals or customer-requested 8D layouts when your team must follow a fixed external format.",
  },
]

const deliverables = [
  "Reusable online D0-D8 workflow based on your existing template",
  "Mapped fields for problem description, containment, root cause, corrective action, verification, and prevention",
  "Attachment areas placed in the right 8D steps",
  "Export layout aligned with the agreed customer or internal format",
  "Basic validation for required fields before formal completion",
  "One review round for wording, field order, and export presentation",
]

const notIncluded = [
  "Custom ERP, QMS, or supplier portal integration",
  "AI-generated report drafting",
  "Multi-level approval workflow beyond the current Team workspace",
  "Legal or regulatory approval of your template content",
]

const process = [
  {
    step: "1",
    title: "Send the template",
    text: "Share the Word, Excel, PDF, or screenshots you currently use, plus any customer instructions that must be preserved.",
  },
  {
    step: "2",
    title: "Map the workflow",
    text: "We identify fields, required evidence, tables, attachment areas, and export expectations across D0-D8.",
  },
  {
    step: "3",
    title: "Build the online version",
    text: "The template becomes a reusable workflow your team can fill in from a phone, tablet, or desktop.",
  },
  {
    step: "4",
    title: "Review and launch",
    text: "You check the online flow and exported report, then we adjust field labels, order, and presentation before use.",
  },
]

export default async function Custom8DTemplateSetupPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const requestType = service === "team_launch" ? "team_launch" : service === "assisted_8d" ? "assisted_8d" : "template_setup";
  const isAssisted = requestType === "assisted_8d";

  return (
    <div className="font-sans">
      <section className="border-b border-slate-200 bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Custom 8D template setup
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {isAssisted
                ? "Get help delivering your first customer-ready 8D or SCAR."
                : "Turn your existing 8D template into a reusable online workflow."}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {isAssisted
                ? "Share the format, customer requirement, and timeline for the first report you need to deliver. This is inquiry-only and does not require checkout."
                : "We convert your company's Word, Excel, or customer-specific 8D template into a reusable online workflow so reports can be filled out on the factory floor, shared for review, and exported in a consistent format."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#request"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 bg-[#4F46E5] px-6 hover:bg-[#4338CA]",
                )}
              >
                Request setup
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-slate-300 px-6",
                )}
              >
                Compare plans
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Workflow className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Starting at</p>
                <p className="font-mono text-3xl font-semibold text-slate-950">
                  {requestType === "team_launch" ? "From $999" : isAssisted ? "From $799" : "From $499"}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-950">Best fit for</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Quality teams with a customer-mandated 8D format</li>
                <li>Suppliers who must submit reports in a fixed template</li>
                <li>Companies moving from Excel/Word to online 8D reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="request" className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <CustomTemplateRequestForm initialRequestType={requestType} />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              What we can convert
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              The goal is not to force your team into a generic form. The goal
              is to preserve the structure people already trust while making it
              faster to complete, share, search, and export.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {inputs.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <item.icon className="h-6 w-6 text-indigo-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Included in the setup
            </h2>
            <ul className="mt-6 space-y-3">
              {deliverables.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Not included in the base setup
            </h2>
            <ul className="mt-6 space-y-3">
              {notIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Larger integrations or approval flows can be scoped separately
              after the base template is working.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Setup process
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {process.map((item) => (
              <div key={item.step} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600 font-mono text-sm font-semibold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Ready to make your 8D template reusable?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Send the template you use today. We will confirm whether it fits
              the base setup or needs a separate custom scope.
              {" "}
              <Link href="/security" className="font-medium text-white underline underline-offset-4">
                Review security and data privacy.
              </Link>
            </p>
          </div>
          <Link
            href="#request"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 shrink-0 bg-white px-6 text-slate-950 hover:bg-slate-100",
            )}
          >
            Contact for setup
          </Link>
        </div>
      </section>
    </div>
  )
}
