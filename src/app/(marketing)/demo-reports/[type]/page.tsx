import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, CheckCircle2, Download, FileText, History, LockKeyhole } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TeamWorkflowFeedbackForm } from "@/components/marketing/TeamWorkflowFeedbackForm";
import { DEMO_REPORTS, getDemoReport } from "@/lib/demo-reports";
import { cn } from "@/lib/utils";

const workflowByType: Record<string, Array<{ title: string; detail: string }>> = {
  automotive: [
    { title: "Internal Review", detail: "Quality and process engineering reviewed the tool-life study and seeded-defect challenge." },
    { title: "Approved and locked", detail: "The initial customer package was approved and protected against edits." },
    { title: "Unlocked for Rev.1", detail: "Owner recorded the customer request for updated verification evidence before unlocking." },
    { title: "Approved Rev.1", detail: "Three-lot validation evidence was added and the report was locked again." },
  ],
  molding: [
    { title: "Internal Review", detail: "Molding, tooling, and quality reviewed the DOE and customer cosmetic boundary sample." },
    { title: "Approved and locked", detail: "The approved recipe, cooling-flow result, and validation evidence were frozen as Rev.0." },
  ],
  electronics: [
    { title: "Internal Review", detail: "SMT engineering and quality reviewed cross-sections, AOI criteria, and burn-in results." },
    { title: "Approved Rev.1", detail: "The first evidence package was approved and locked." },
    { title: "Unlocked for Rev.2", detail: "Customer requested expanded thermal-cycle evidence; the owner recorded the reason." },
    { title: "Submitted to Customer", detail: "Rev.2 was approved, submitted, and locked as the final delivery package." },
  ],
};

export function generateStaticParams() {
  return Object.keys(DEMO_REPORTS).map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const demo = DEMO_REPORTS[type];
  if (!demo) return {};
  return {
    title: `${demo.title} | Controlled 8D Workflow Demo`,
    description: `Review the complete D0-D8 content, evidence, approval, locking, revision history, and delivery package for this ${demo.industry} scenario.`,
    alternates: { canonical: `https://www.8d-reports.com/demo-reports/${type}` },
  };
}

const reportSections = [
  ["D1 Team", (data: ReturnType<typeof getDemoReport>["reportData"]) => `${data.teamLeader}; ${data.teamMembers}`],
  ["D2 Problem Description", (data: ReturnType<typeof getDemoReport>["reportData"]) => data.problemDescription],
  ["D3 Containment", (data: ReturnType<typeof getDemoReport>["reportData"]) => `${data.containmentDescription}\n\nVerification: ${data.containmentVerification}`],
  ["D4 Root Cause", (data: ReturnType<typeof getDemoReport>["reportData"]) => `Occurrence: ${data.rootCauseOccurrence}\n\nEscape: ${data.rootCauseEscape}\n\nSystem: ${data.rootCauseSystem}\n\nConfirmed: ${data.confirmedRootCause}`],
  ["D5 Corrective Action", (data: ReturnType<typeof getDemoReport>["reportData"]) => `${data.selectedCorrectiveAction}\n\nRationale: ${data.correctiveRationale}`],
  ["D6 Implementation and Verification", (data: ReturnType<typeof getDemoReport>["reportData"]) => `${data.implementationPlan}\n\nMethod: ${data.validationMethod}\n\nResults: ${data.validationResults}`],
  ["D7 Prevention", (data: ReturnType<typeof getDemoReport>["reportData"]) => `${data.systemChanges}\n\n${data.horizontalDeployment}`],
  ["D8 Closure and Approval", (data: ReturnType<typeof getDemoReport>["reportData"]) => `${data.lessonsLearned}\n\nPrepared: ${data.preparedBy} · Reviewed: ${data.reviewedBy} · Approved: ${data.approverName}`],
] as const;

export default async function DemoReportPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const demo = DEMO_REPORTS[type];
  if (!demo) notFound();
  const data = demo.reportData;
  const images = demo.evidenceFiles.filter((file) => file.publicPath);

  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/demo-reports" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="size-4" /> All workflow demos
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">{demo.industry} · {demo.revision}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{demo.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{demo.workflowSummary}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/api/sample-reports/${type}`} className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-700")}><Download className="size-4" /> PDF</Link>
                <Link href={`/api/sample-reports/${type}?format=docx`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><FileText className="size-4" /> Word</Link>
                <Link href={`/api/sample-reports/${type}?format=zip`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}><Archive className="size-4" /> Delivery ZIP</Link>
              </div>
            </div>
            <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-6 text-sm">
              {[
                ["Report", data.reportNumber],
                ["Customer", data.customerName],
                ["Product", data.productName],
                ["Lot", data.batchNumber],
                ["Priority", data.priority],
                ["Approval", `${data.preparedBy} / ${data.reviewedBy} / ${data.approverName}`],
              ].map(([label, value]) => <div key={label} className="grid grid-cols-[90px_1fr] gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><dt className="font-medium text-slate-500">{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.62fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold tracking-tight">Complete D0-D8 report content</h2>
            {reportSections.map(([title, value]) => (
              <article key={title} className="border-b border-slate-200 py-5">
                <h3 className="text-lg font-semibold text-indigo-700">{title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{value(data)}</p>
              </article>
            ))}
          </div>
          <aside className="space-y-8">
            <div>
              <div className="flex items-center gap-2"><History className="size-5 text-indigo-600" /><h2 className="text-xl font-semibold">Workflow activity</h2></div>
              <ol className="mt-5 space-y-3">
                {(workflowByType[type] || []).map((item) => <li key={item.title} className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 text-emerald-600" />{item.title}</div><p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p></li>)}
              </ol>
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-950 p-4 text-xs leading-5 text-white"><LockKeyhole className="size-4 shrink-0 text-indigo-300" />Approved, submitted, and closed reports are locked. Only the Owner can unlock for revision, with a required reason.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Evidence package</h2>
              <div className="mt-4 space-y-4">
                {images.map((file) => (
                  <figure key={file.filename} className="overflow-hidden rounded-lg border border-slate-200">
                    <Image src={file.publicPath!} alt={`${demo.title} evidence: ${file.filename}`} width={1200} height={900} className="aspect-[4/3] w-full object-cover" />
                    <figcaption className="p-3 text-xs text-slate-600">{file.stepId}: {file.filename}</figcaption>
                  </figure>
                ))}
                <ul className="space-y-2 text-xs text-slate-600">
                  {demo.evidenceFiles.filter((file) => !file.publicPath).map((file) => <li key={file.filename} className="rounded-md bg-slate-50 p-3">{file.stepId}: {file.filename}</li>)}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <TeamWorkflowFeedbackForm demoType={type} />
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold">Use this controlled workflow with your own team.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Create, review, approve, lock, revise, and deliver customer-ready 8D reports without scattered document versions.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/pricing" className={cn(buttonVariants({ size: "lg" }), "bg-white text-slate-950 hover:bg-slate-100")}>Review Team pricing</Link>
            <Link href="/team-launch" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-slate-600 bg-transparent text-white hover:bg-slate-900 hover:text-white")}>Book Team Launch</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
