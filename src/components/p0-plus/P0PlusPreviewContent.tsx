import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, HelpCircle, ShieldAlert } from "lucide-react";
import {
  P0_PLUS_DRAFT_FIELD_NAMES,
  P0_PLUS_SOURCE_STATUSES,
  type P0PlusDraftStepId,
  type P0PlusEvidenceItem,
  type P0PlusField,
  type P0PlusNextAction,
  type P0PlusPreviewResponse,
  type P0PlusRiskLevel,
  type P0PlusSourceStatus,
} from "@/lib/p0-plus/schema";
import { cn } from "@/lib/utils";

const draftStepTitles: Record<P0PlusDraftStepId, string> = {
  D0: "D0 Plan",
  D1: "D1 Team",
  D2: "D2 Problem Description",
  D3: "D3 Containment",
  D4: "D4 Root Cause",
  D5: "D5 Corrective Action",
  D6: "D6 Verification",
  D7: "D7 Prevention",
  D8: "D8 Closure",
};

const sourceStatusTone: Record<P0PlusSourceStatus, string> = {
  provided: "border-emerald-200 bg-emerald-50 text-emerald-700",
  extracted: "border-sky-200 bg-sky-50 text-sky-700",
  inferred: "border-amber-200 bg-amber-50 text-amber-800",
  missing: "border-rose-200 bg-rose-50 text-rose-700",
  needs_confirmation: "border-orange-200 bg-orange-50 text-orange-800",
  conflicting: "border-red-200 bg-red-50 text-red-700",
  not_applicable: "border-slate-200 bg-slate-50 text-slate-600",
};

const riskTone: Record<P0PlusRiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-rose-200 bg-rose-50 text-rose-700",
};

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sourceStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function StatusBadge({ status }: { status: P0PlusSourceStatus }) {
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold", sourceStatusTone[status])}>
      {sourceStatusLabel(status)}
    </span>
  );
}

function RiskBadge({ risk }: { risk: P0PlusRiskLevel }) {
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold", riskTone[risk])}>
      {risk} risk
    </span>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 py-8">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FieldRow({ label, field }: { label: string; field: P0PlusField }) {
  const displayValue = String(field.value || "").trim() || "No relevant data";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <StatusBadge status={field.sourceStatus} />
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{displayValue}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{field.rationale}</p>
    </div>
  );
}

function EvidenceList({ items }: { items: P0PlusEvidenceItem[] }) {
  if (items.length === 0) {
    return <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">No relevant data.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <article key={`${item.label}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {item.stepId ? `${item.stepId} · ` : ""}
              {item.label}
            </p>
            <StatusBadge status={item.sourceStatus} />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail || "No relevant data"}</p>
        </article>
      ))}
    </div>
  );
}

function NextActions({ actions }: { actions: P0PlusNextAction[] }) {
  if (actions.length === 0) {
    return <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">No next actions were generated.</p>;
  }

  return (
    <div className="grid gap-3">
      {actions.map((action, index) => (
        <article key={`${action.actionType}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
                {action.linkedStepId} · {action.actionType}
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-950">{action.title}</h3>
            </div>
            <StatusBadge status={action.sourceStatus} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{action.detail}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-800">Reason:</span> {action.reason}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">Owner: {action.suggestedOwner}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">Priority: {action.priority}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">Linked step: {action.linkedStepId}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function DraftPreview({ preview }: { preview: P0PlusPreviewResponse }) {
  return (
    <div className="space-y-4">
      {(Object.keys(P0_PLUS_DRAFT_FIELD_NAMES) as P0PlusDraftStepId[]).map((stepId) => {
        const stepFields = preview.draft[stepId] as Record<string, P0PlusField>;
        return (
          <article key={stepId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-950">{draftStepTitles[stepId]}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {P0_PLUS_DRAFT_FIELD_NAMES[stepId].map((fieldName) => (
                <FieldRow key={fieldName} label={humanize(fieldName)} field={stepFields[fieldName]} />
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function P0PlusPreviewPageContent({
  preview,
  tokenExpiresAt,
  outputLanguage,
  continuePath,
}: {
  preview: P0PlusPreviewResponse;
  tokenExpiresAt: string;
  outputLanguage: string;
  continuePath: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              8D
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-950">8D Reports</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Read-only preview
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {outputLanguage}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
              P0+ AI quality preview
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {preview.conversion.recommendedReportTitle || "Structured 8D draft preview"}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              This is a read-only preview generated from the submitted notes. It separates known facts from gaps,
              checks readiness, and lists the next actions needed before customer submission.
            </p>
          </div>
          <aside className="rounded-lg border border-indigo-100 bg-white p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Sign in to edit and export this report</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  After signing in, you can save this preview as an editable report.
                </p>
              </div>
            </div>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(continuePath)}`}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Sign in to edit and export this report
              <ArrowRight className="size-4" />
            </Link>
            <p className="mt-3 text-xs leading-5 text-slate-500">Preview expires at {tokenExpiresAt}.</p>
          </aside>
        </section>

        <Section title="Case Summary">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">Summary</p>
              <p className="mt-2 text-base leading-7 text-slate-800">{preview.inputSummary.caseSummary}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">Source Status Legend</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {P0_PLUS_SOURCE_STATUSES.map((status) => (
                  <StatusBadge key={status} status={status} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Known Facts
              </h3>
              <EvidenceList items={preview.inputSummary.knownFacts} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-950">Assumptions</h3>
              <EvidenceList items={preview.inputSummary.assumptions} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-950">Conflicts</h3>
              <EvidenceList items={preview.inputSummary.conflicts} />
            </div>
          </div>
        </Section>

        <Section title="D0-D8 Draft Preview" description="Each field keeps its source status so inferred or missing content is not treated as fact.">
          <DraftPreview preview={preview} />
        </Section>

        <Section title="Readiness Check">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">Overall Risk</p>
              <div className="mt-3">
                <RiskBadge risk={preview.readiness_check.overall_risk} />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">Score</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{preview.readiness_check.score}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">Authenticated Edit Readiness</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {preview.readiness_check.canStartAuthenticatedEdit ? "Ready to start editing after sign in." : "Needs more context before editing."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {preview.readiness_check.section_checks.map((check, index) => (
              <article key={`${check.stepId}-${check.checkType}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {check.stepId} · {humanize(check.checkType)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {check.status.replace(/_/g, " ")}
                    </span>
                    <RiskBadge risk={check.risk} />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{check.finding}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-800">Recommended fix:</span> {check.recommended_fix}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                  {check.required_evidence.map((evidence) => (
                    <li key={evidence}>{evidence}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Missing Information">
          <EvidenceList items={preview.missingInformation} />
        </Section>

        <Section title="Required Evidence">
          <div className="grid gap-3 md:grid-cols-2">
            {preview.requiredEvidence.map((item, index) => (
              <article key={`${item.stepId}-${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">{item.stepId}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.whyItMatters}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                  {item.examples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Clarification Questions">
          <div className="grid gap-3 md:grid-cols-2">
            {preview.inputSummary.clarificationQuestions.map((question, index) => (
              <article key={`${question.question}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 size-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{question.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{question.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        Linked step: {question.linkedStepId}
                      </span>
                      <StatusBadge status={question.sourceStatus} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Customer Submission Risks">
          <EvidenceList items={preview.readiness_check.customer_submission_risks} />
        </Section>

        <Section title="Recommended Fixes">
          <EvidenceList items={preview.readiness_check.recommended_fixes} />
        </Section>

        <Section title="Next Actions" description="These actions identify who should do what next, why it matters, and which D step it supports.">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ClipboardList className="size-4 text-indigo-600" />
            Quality workflow navigation
          </div>
          <NextActions actions={preview.next_actions} />
        </Section>
      </div>
    </main>
  );
}
