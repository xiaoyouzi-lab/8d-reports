import type { Metadata } from "next"
import {
  Breadcrumbs,
  JsonLd,
  PageShell,
  Section,
  SectionHeader,
  breadcrumbJsonLd,
} from "@/components/marketing/MarketingPrimitives"
import { ResourcesExplorer, type ResourceCardData } from "@/components/marketing/ResourcesExplorer"
import { seoPages } from "@/content/seo-pages"
import { siteUrl } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "8D Templates, Examples, and Root-Cause Tools",
  description:
    "Browse practical 8D templates, complete examples, 5 Why examples, fishbone examples, corrective actions, and preventive action resources.",
  alternates: { canonical: `${siteUrl}/resources` },
  openGraph: {
    title: "8D Templates, Examples, and Root-Cause Tools",
    description:
      "Practical resources for quality engineers, SQEs, and manufacturing quality teams.",
    url: `${siteUrl}/resources`,
    type: "website",
  },
}

const categoryLabel: Record<string, string> = {
  "8d-example": "Complete example",
  "8d-template": "8D template",
  "5why-example": "Root cause tool",
  "fishbone-example": "Root cause tool",
  "corrective-action": "Corrective action",
  "preventive-action": "Preventive action",
}

const breadcrumbItems = [
  { label: "Home", href: siteUrl },
  { label: "Resources", href: `${siteUrl}/resources` },
]

const manualResources: ResourceCardData[] = [
  {
    href: "/8d-report-template",
    title: "8D Report Template",
    description:
      "A copyable D0-D8 structure with online template actions, common mistakes, and format guidance.",
    category: "8D template",
    categoryKey: "8d-template",
  },
  {
    href: "/sample-report",
    title: "Complete 8D Example",
    description:
      "A finished 8D report example from containment to verified corrective action.",
    category: "Complete example",
    categoryKey: "8d-example",
  },
]

const featured: ResourceCardData[] = [
  manualResources[0],
  manualResources[1],
  {
    href: "/8d-report-example/supplier-quality",
    title: "Supplier 8D Example",
    description:
      "A supplier corrective action example with incoming inspection failure, containment, and supplier control-plan follow-up.",
    category: "Complete example",
    categoryKey: "8d-example",
  },
  {
    href: "/8d-report-example/customer-complaint",
    title: "Customer Complaint 8D",
    description:
      "A practical customer complaint response with field logs, containment, firmware correction, and verification.",
    category: "Complete example",
    categoryKey: "8d-example",
  },
  {
    href: "/5-why-example/customer-complaint",
    title: "5 Why Example",
    description:
      "A root-cause chain that connects the complaint, escape point, and corrective action.",
    category: "Root cause tool",
    categoryKey: "5why-example",
  },
  {
    href: "/fishbone-diagram-example/manufacturing-defect",
    title: "Fishbone Example",
    description:
      "A 6M fishbone example for structuring possible manufacturing defect causes.",
    category: "Root cause tool",
    categoryKey: "fishbone-example",
  },
]

const generatedResources: ResourceCardData[] = seoPages.map((page) => ({
  href: `/${page.slug}`,
  title: page.title,
  description: page.metaDescription,
  category: categoryLabel[page.type] || "Resource",
  categoryKey: page.type,
}))

const resources = [...manualResources, ...generatedResources].filter(
  (resource, index, all) => all.findIndex((item) => item.href === resource.href) === index,
)

export default function ResourcesPage() {
  return (
    <PageShell>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Practical 8D templates, examples, and root-cause tools.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Find reusable structures for customer complaints, supplier issues,
            root-cause analysis, corrective actions, and prevention work. The
            resource list is curated for scanning rather than exposing internal
            URL slugs.
          </p>
        </div>
      </section>

      <Section>
        <ResourcesExplorer featured={featured} resources={resources} />
      </Section>

      <Section className="border-t border-slate-200 bg-slate-50">
        <SectionHeader
          title="All resource URLs remain available"
          description="The resources page now starts with the most useful items, but existing SEO pages remain live, crawlable, and included in the sitemap."
        />
      </Section>
    </PageShell>
  )
}
