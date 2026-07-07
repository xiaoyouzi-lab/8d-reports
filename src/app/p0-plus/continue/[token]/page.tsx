import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { P0PlusContinueActions } from "@/components/p0-plus/P0PlusContinueActions";
import { getSessionUser } from "@/lib/api-helpers";
import { getP0PlusContinuationState } from "@/lib/p0-plus/convert";
import { isP0PlusPreviewEnabled } from "@/lib/p0-plus/config";
import {
  getP0PlusContinueLoginPath,
  getP0PlusPreviewPath,
} from "@/lib/p0-plus/paths";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Save 8D Draft Preview",
  description: "Confirm saving a P0+ 8D draft preview as an editable report.",
  robots: { index: false, follow: false },
};

function formatExpiresAt(value: Date) {
  return value.toISOString();
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              8D
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-950">8D Reports</span>
          </Link>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            P0+ confirmation
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>
    </main>
  );
}

function SafeUnavailable() {
  return (
    <Shell>
      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
          Preview unavailable
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          This preview is no longer available
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The preview may have expired or the link may be incorrect. Generate a new preview to continue.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Start a new preview
        </Link>
      </section>
    </Shell>
  );
}

export default async function P0PlusContinuePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!isP0PlusPreviewEnabled()) notFound();

  const { token } = await params;
  const user = await getSessionUser();
  if (!user) redirect(getP0PlusContinueLoginPath(token));

  const state = await getP0PlusContinuationState({ token, userId: user.id });
  if (state.kind === "unavailable") return <SafeUnavailable />;

  const previewPath = getP0PlusPreviewPath(token);
  const expiresAt = formatExpiresAt(state.expiresAt);

  if (state.kind === "already_converted") {
    return (
      <Shell>
        <section className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
              Already saved
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              This preview is already an editable report
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{state.summary}</p>
            <p className="mt-4 text-xs leading-5 text-slate-500">Preview expires at {expiresAt}.</p>
          </div>
          <aside className="rounded-lg border border-indigo-100 bg-white p-4">
            <Link
              href={state.redirectPath}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to report
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={previewPath}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to preview
            </Link>
          </aside>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
            Confirm report creation
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Save this AI draft as an editable 8D report
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This will create a report in your account using only verified safe fields from the preview. Missing or
            uncertain information will remain blank or marked for review.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Preview title</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{state.title}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Expires</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{expiresAt}</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Summary</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{state.summary}</p>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <p className="text-sm leading-6 text-amber-900">
              Editing, saving, sharing, and exporting happen only after report creation. AI does not approve the
              report, certify compliance, or replace the quality owner.
            </p>
          </div>
        </div>

        <aside className="rounded-lg border border-indigo-100 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">Create report after confirmation</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The preview stays read-only until you choose to create an editable report.
          </p>
          <div className="mt-4">
            <P0PlusContinueActions token={token} previewPath={previewPath} />
          </div>
        </aside>
      </section>
    </Shell>
  );
}
