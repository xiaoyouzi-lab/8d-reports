import type { Metadata } from "next";
import Link from "next/link";
import { seoPages, type SeoPage, type SeoPageType } from "@/content/seo-pages";

const baseUrl = "https://www.8d-reports.com";

export const metadata: Metadata = {
  title: "8D Quality Resources",
  description:
    "Browse professional 8D examples, 8D templates, 5 Why examples, fishbone examples, corrective actions, and preventive actions for quality teams.",
  alternates: {
    canonical: `${baseUrl}/resources`,
  },
};

const groups: {
  type: SeoPageType;
  title: string;
  description: string;
}[] = [
  {
    type: "8d-example",
    title: "8D Examples",
    description:
      "Complete 8D report examples with D0-D8 wording, containment, root cause, corrective action, prevention, and verification details.",
  },
  {
    type: "8d-template",
    title: "8D Templates",
    description:
      "Structured 8D template pages for customer reports, supplier corrective actions, regulated complaints, and manufacturing investigations.",
  },
  {
    type: "5why-example",
    title: "5 Why Examples",
    description:
      "Root-cause chains that show why the problem happened, why it escaped, and why the selected corrective action is credible.",
  },
  {
    type: "fishbone-example",
    title: "Fishbone Examples",
    description:
      "6M fishbone analysis pages covering Man, Machine, Method, Material, Measurement, and Environment prompts.",
  },
  {
    type: "corrective-action",
    title: "Corrective Actions",
    description:
      "Corrective action examples with ownership, due dates, verification evidence, and effectiveness checks.",
  },
  {
    type: "preventive-action",
    title: "Preventive Actions",
    description:
      "Preventive action examples focused on recurrence prevention, control-plan updates, audits, and lessons learned.",
  },
];

function pagesByType(type: SeoPageType): SeoPage[] {
  return seoPages.filter((page) => page.type === type);
}

export default function ResourcesPage() {
  const total = seoPages.length;

  return (
    <div className="bg-white text-slate-950">
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Quality resources
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Professional 8D, 5 Why, fishbone, corrective action, and preventive
            action resources
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Browse {total} practical pages written for quality engineers,
            supplier quality teams, process owners, and quality managers who
            need clear examples rather than generic headings.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-14 px-4 sm:px-6">
          {groups.map((group) => {
            const pages = pagesByType(group.type);

            return (
              <section key={group.type} id={group.type}>
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {group.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {group.description}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {pages.length} pages
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pages.map((page) => (
                    <Link
                      key={page.slug}
                      href={`/${page.slug}`}
                      className="rounded-lg border border-slate-200 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                        /{page.slug}
                      </p>
                      <h3 className="mt-3 text-base font-semibold text-slate-950">
                        {page.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {page.metaDescription}
                      </p>
                      <p className="mt-4 text-xs leading-5 text-slate-500">
                        Scope: {page.professional.affectedScope}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
