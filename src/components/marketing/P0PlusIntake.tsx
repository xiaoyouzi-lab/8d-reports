"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import {
  P0_PLUS_OUTPUT_LANGUAGE_OPTIONS,
  submitP0PlusIntake,
  type P0PlusOutputLanguage,
} from "@/lib/p0-plus/preview-ui";

const exampleBefore = [
  "Production line found flash / excess material on injection molded parts.",
  "Supplier A mentioned. Photos are available.",
  "Lot and defect quantity still need confirmation.",
].join(" ");

export function P0PlusIntake() {
  const [rawInput, setRawInput] = useState("");
  const [outputLanguage, setOutputLanguage] = useState<P0PlusOutputLanguage>("en");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await submitP0PlusIntake({ rawInput, outputLanguage });
    if (result.ok) {
      window.location.assign(result.redirectPath);
      return;
    }

    setError(result.message);
    setIsSubmitting(false);
  }

  return (
    <section
      aria-label="P0+ guest 8D preview"
      className="rounded-lg border border-indigo-100 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Turn messy quality notes into a structured 8D report.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Paste complaint emails, production feedback, inspection notes, supplier updates, or rough case details.
            AI drafts the report, checks missing evidence, and tells you what to do next.
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Quality case notes</span>
          <textarea
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder="Production line found flash / excess material on injection molded parts from Supplier A. Photos are available, but lot and defect quantity still need confirmation..."
            className="mt-2 min-h-[190px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            aria-describedby="p0-plus-intake-note"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Output language</span>
            <select
              value={outputLanguage}
              onChange={(event) => setOutputLanguage(event.target.value as P0PlusOutputLanguage)}
              className="mt-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              {P0_PLUS_OUTPUT_LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Generating..." : "Generate 8D Draft"}
            <ArrowRight className="size-4" />
          </button>
        </div>

        {error ? (
          <div role="alert" className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <p id="p0-plus-intake-note" className="text-xs leading-5 text-slate-500">
          No signup required to preview. Sign in to edit, save, share, or export.
        </p>
      </form>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Before</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{exampleBefore}</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">After</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-indigo-950">
            <li>D2 draft with confirmed facts separated from assumptions.</li>
            <li>Readiness risks for containment, root cause, and evidence.</li>
            <li>Next actions by owner, priority, and linked D step.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
