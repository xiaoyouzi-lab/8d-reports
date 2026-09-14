export const SITE_URL = "https://www.8d-reports.com";

export const INDEXABLE_STATIC_PATHS = [
  "/",
  "/sample-report",
  "/resources",
  "/pricing",
  "/demo-reports",
  "/demo-reports/automotive",
  "/demo-reports/molding",
  "/demo-reports/electronics",
  "/ai-8d-report-check",
  "/security",
  "/faq",
  "/help",
  "/learn",
  "/docs",
  "/docs/getting-started",
  "/docs/create-report",
  "/docs/edit-d0-d8",
  "/docs/attachments",
  "/docs/export-and-zip",
  "/docs/sharing",
  "/docs/team-workflow",
  "/docs/plans-and-billing",
  "/docs/security-and-data",
  "/docs/ai-quality-check",
  "/contact",
  "/privacy",
  "/terms",
] as const;

export const LEGACY_SEO_REDIRECTS = [
  { source: "/8d-example", destination: "/8d-report-example" },
  { source: "/8d-example/:slug", destination: "/8d-report-example/:slug" },
  { source: "/8d-examples/:slug", destination: "/8d-report-example/:slug" },
  { source: "/8d-report-examples/:slug", destination: "/8d-report-example/:slug" },
  { source: "/8d-template", destination: "/8d-report-template" },
  { source: "/8d-template/:slug", destination: "/8d-report-template/:slug" },
  { source: "/8d-templates/:slug", destination: "/8d-report-template/:slug" },
  { source: "/demo-report", destination: "/demo-reports" },
  { source: "/demo-report/:type", destination: "/demo-reports/:type" },
  { source: "/8d-report-sample", destination: "/sample-report" },
  { source: "/sample-8d-report", destination: "/sample-report" },
  { source: "/custom-8d-template-setup", destination: "/pricing" },
  { source: "/team-launch", destination: "/pricing" },
  { source: "/8d-report-review-service", destination: "/ai-8d-report-check" },
  { source: "/help/template-setup", destination: "/help/export-pdf-word-excel-zip" },
  { source: "/help/team-launch", destination: "/help/team-workspace" },
] as const;

export function canonicalUrl(path: string) {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
