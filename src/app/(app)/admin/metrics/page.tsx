import { notFound } from "next/navigation";
import { and, gte, inArray, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { analyticsEvents, customTemplateRequests } from "@/lib/db/schema";
import { isServiceAdmin } from "@/lib/service-requests";

type MetricKey =
  | "pageViews"
  | "demoDownloads"
  | "templateSetupSubmissions"
  | "contactSubmissions"
  | "signupCount"
  | "exportAttempts"
  | "pricingCtaClicks";

type MetricRow = {
  key: MetricKey;
  label: string;
  description: string;
  days7: number;
  days30: number;
};

const eventMetrics: Array<{
  key: Exclude<MetricKey, "templateSetupSubmissions">;
  label: string;
  description: string;
  eventNames: string[];
}> = [
  {
    key: "pageViews",
    label: "Page views",
    description: "SEO and demo page view events.",
    eventNames: ["seo_page_view", "demo_report_viewed"],
  },
  {
    key: "demoDownloads",
    label: "Demo downloads",
    description: "PDF, Word, Excel, and ZIP demo download clicks.",
    eventNames: ["demo_report_downloaded", "sample_download"],
  },
  {
    key: "contactSubmissions",
    label: "Contact submissions",
    description: "Contact form submissions recorded as conversion intent.",
    eventNames: ["contact_form_submitted"],
  },
  {
    key: "signupCount",
    label: "Signup count",
    description: "Completed signup events.",
    eventNames: ["signup_completed"],
  },
  {
    key: "exportAttempts",
    label: "Export attempts",
    description: "Report export attempts across PDF, Word, and Excel.",
    eventNames: ["export_attempted"],
  },
  {
    key: "pricingCtaClicks",
    label: "Pricing CTA clicks",
    description: "Professional service, plan, upgrade, and single export CTA clicks.",
    eventNames: ["pricing_service_cta_clicked", "pricing_plan_clicked", "upgrade_clicked", "single_export_clicked"],
  },
];

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function countEvents(eventNames: string[], days: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(and(
      inArray(analyticsEvents.eventName, eventNames),
      gte(analyticsEvents.createdAt, since(days)),
    ));
  return Number(row?.count || 0);
}

async function countTemplateRequests(days: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customTemplateRequests)
    .where(gte(customTemplateRequests.createdAt, since(days)));
  return Number(row?.count || 0);
}

async function buildMetrics(): Promise<MetricRow[]> {
  const rows: MetricRow[] = await Promise.all(eventMetrics.map(async (metric) => ({
    key: metric.key,
    label: metric.label,
    description: metric.description,
    days7: await countEvents(metric.eventNames, 7),
    days30: await countEvents(metric.eventNames, 30),
  })));

  rows.splice(2, 0, {
    key: "templateSetupSubmissions",
    label: "Template setup submissions",
    description: "Template Setup, Team Launch, and Assisted 8D / SCAR leads saved in the service request table.",
    days7: await countTemplateRequests(7),
    days30: await countTemplateRequests(30),
  });

  return rows;
}

export default async function AdminMetricsPage() {
  const user = await getSessionUser();
  if (!user || !isServiceAdmin(user.email)) notFound();

  const metrics = await buildMetrics();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Revenue evidence metrics
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          A compact view of whether visitors click, download demos, submit setup
          requests, sign up, and attempt exports. Metrics use existing
          application events and saved service leads.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-950">Metric</th>
              <th className="px-4 py-3 font-semibold text-slate-950">Last 7 days</th>
              <th className="px-4 py-3 font-semibold text-slate-950">Last 30 days</th>
              <th className="px-4 py-3 font-semibold text-slate-950">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.key} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-4 font-medium text-slate-950">{metric.label}</td>
                <td className="px-4 py-4 font-mono text-lg font-semibold text-slate-950">{metric.days7}</td>
                <td className="px-4 py-4 font-mono text-lg font-semibold text-slate-950">{metric.days30}</td>
                <td className="px-4 py-4 text-slate-600">{metric.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
