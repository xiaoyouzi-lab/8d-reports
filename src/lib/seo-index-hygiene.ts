export const SITE_URL = "https://www.8d-reports.com";

export const INDEXABLE_STATIC_PATHS = [
  "/",
  "/sample-report",
  "/resources",
  "/pricing",
  "/custom-8d-template-setup",
  "/team-launch",
  "/demo-reports",
  "/demo-reports/automotive",
  "/demo-reports/molding",
  "/demo-reports/electronics",
  "/8d-report-review-service",
  "/security",
  "/faq",
  "/docs",
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
] as const;

export function canonicalUrl(path: string) {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
