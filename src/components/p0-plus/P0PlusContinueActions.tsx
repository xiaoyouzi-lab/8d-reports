"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

function readError(body: unknown) {
  if (typeof body === "object" && body !== null && typeof (body as { error?: unknown }).error === "string") {
    return (body as { error: string }).error;
  }
  return "Could not create the report. Please try again.";
}

function readRedirectPath(body: unknown) {
  if (typeof body === "object" && body !== null && typeof (body as { redirectPath?: unknown }).redirectPath === "string") {
    return (body as { redirectPath: string }).redirectPath;
  }
  return null;
}

export function P0PlusContinueActions({
  token,
  previewPath,
}: {
  token: string;
  previewPath: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConvert() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/p0-plus/preview/${encodeURIComponent(token)}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readError(body));
        setLoading(false);
        return;
      }

      const redirectPath = readRedirectPath(body);
      if (!redirectPath) {
        setError("The report was created, but the redirect target was missing. Open your dashboard to find it.");
        setLoading(false);
        return;
      }

      window.location.assign(redirectPath);
    } catch {
      setError("Could not create the report. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleConvert}
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating report..." : "Create editable report"}
        {!loading ? <ArrowRight className="size-4" /> : null}
      </button>
      <Link
        href={previewPath}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Back to preview
      </Link>
    </div>
  );
}
