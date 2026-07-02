import fs from "node:fs"
import path from "node:path"
import { chromium, type Page } from "playwright"

type CaptureModule = {
  slug: string
  route: string
  file: string
  requiresReportId?: boolean
  open?: (page: Page) => Promise<void>
}

function getArg(name: string) {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

const baseUrl = (getArg("--base-url") || process.env.HELP_CAPTURE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "")
const storageState = getArg("--storage-state") || process.env.HELP_CAPTURE_STORAGE_STATE
const reportId = getArg("--report-id") || process.env.HELP_CAPTURE_REPORT_ID
const outputRoot = path.join(process.cwd(), "public/help-assets")

const reportRoute = () => (reportId ? `/reports/${reportId}` : "/dashboard")

const modules: CaptureModule[] = [
  { slug: "dashboard", route: "/dashboard", file: "overview.png" },
  { slug: "create-new-report", route: "/reports/new", file: "new-report.png" },
  { slug: "d0-d8-editor", route: reportRoute(), file: "editor.png", requiresReportId: true },
  {
    slug: "ai-draft",
    route: reportRoute(),
    file: "ai-dialog.png",
    requiresReportId: true,
    open: async (page) => {
      await page.getByRole("button", { name: /^AI$/ }).click({ timeout: 5000 })
    },
  },
  {
    slug: "ai-quality-check",
    route: reportRoute(),
    file: "quality-check.png",
    requiresReportId: true,
    open: async (page) => {
      await page.getByRole("button", { name: /^AI$/ }).click({ timeout: 5000 })
    },
  },
  {
    slug: "export-pdf-word-excel-zip",
    route: reportRoute(),
    file: "export-menu.png",
    requiresReportId: true,
    open: async (page) => {
      await page.getByRole("button", { name: /export/i }).click({ timeout: 5000 })
    },
  },
  {
    slug: "review-workflow",
    route: reportRoute(),
    file: "workflow.png",
    requiresReportId: true,
    open: async (page) => {
      await page.getByRole("button", { name: /workflow/i }).click({ timeout: 5000 })
    },
  },
  { slug: "team-workspace", route: "/dashboard", file: "team.png" },
]

async function stabilize(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
      [data-sonner-toaster], .fixed.bottom-0, .fixed.bottom-4 {
        display: none !important;
      }
    `,
  })
}

async function captureModule(page: Page, item: CaptureModule) {
  if (item.requiresReportId && !reportId) {
    console.warn(`Skipping ${item.slug}: provide --report-id or HELP_CAPTURE_REPORT_ID for report-specific captures.`)
    return
  }

  await page.goto(`${baseUrl}${item.route}`, { waitUntil: "domcontentloaded" })
  await stabilize(page)
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})

  if (page.url().includes("/login")) {
    console.warn(`Warning: ${item.slug} redirected to login. Provide --storage-state with an authenticated Playwright state.`)
  }

  if (item.open) {
    try {
      await item.open(page)
      await page.waitForTimeout(500)
    } catch (error) {
      console.warn(`Could not open UI state for ${item.slug}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const dir = path.join(outputRoot, item.slug)
  fs.mkdirSync(dir, { recursive: true })
  await page.screenshot({
    path: path.join(dir, item.file),
    fullPage: true,
    animations: "disabled",
  })
  console.log(`Captured ${item.slug}/${item.file}`)
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    storageState: storageState && fs.existsSync(storageState) ? storageState : undefined,
  })
  const page = await context.newPage()

  for (const item of modules) {
    await captureModule(page, item)
  }

  await browser.close()
  console.log("Help asset capture complete. Final review and publishing remain manual.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
