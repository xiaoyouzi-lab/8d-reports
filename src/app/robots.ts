import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/reports/"] },
    sitemap: "https://8d-reports.vercel.app/sitemap.xml",
  }
}
