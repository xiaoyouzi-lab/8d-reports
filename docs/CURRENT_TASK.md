# Current Task

## Task Name

Implement standard XLSX export for normal 8D reports.

## Background

The latest product audit found that PDF, Word, and ZIP evidence package exports are implemented, but no dedicated `.xlsx` report export route or workbook generator was found.

The product context and some marketing/SEO positioning mention Excel export support. This creates a trust risk if standard Excel export is not actually available.

For manufacturing quality engineers, supplier quality engineers, and complaint handlers, Excel is an important working format. A standard XLSX export should exist for normal 8D reports.

## Goal

Implement a standard `.xlsx` export for normal 8D reports.

The export should generate a clear, practical Excel workbook containing the report metadata and D0-D8 content.

## Non-Goals

Do not implement customer-specific Excel templates.

Do not implement custom company-controlled Excel layouts.

Do not implement macros.

Do not implement complex formulas.

Do not implement charts.

Do not implement a self-service template builder.

Do not change authentication logic.

Do not change payment logic unless needed only to reuse existing export entitlement checks.

Do not change database schema.

Do not change environment variables.

Do not refactor unrelated export code.

## Scope

Likely affected areas:

- export library
- report export menu
- report export API route
- entitlement checks
- tests or verification
- documentation / DEV_LOG

Codex should inspect the existing PDF, Word, and ZIP export implementations before choosing the final implementation approach.

## Requirements

1. Add a standard XLSX export capability for normal reports.

2. The workbook should include at minimum:

   - Report title
   - Report number
   - Report type
   - Priority
   - Status / workflow status if available
   - Created date / updated date if available
   - Customer / supplier / product / part information if available
   - D0-D8 sections
   - Containment actions
   - Root cause analysis
   - Corrective actions
   - Verification / validation content
   - Preventive actions
   - Closure / approval-related fields if available
   - Attachment/evidence list if available

3. The workbook should be readable and practical, not just a raw JSON dump.

4. Use one workbook with clearly named sheets. Suggested sheets:

   - Summary
   - D0-D8 Report
   - Actions
   - Evidence

   Codex may adjust sheet names if the existing data model suggests a better structure.

5. Add a clear export entry in the existing export UI.

6. Add or reuse an API route for XLSX export.

   Preferred route if consistent with the existing architecture:

   - `/api/reports/[id]/export/xlsx`

7. Reuse existing report access checks and export entitlement checks.

8. If the product currently restricts Word/no-watermark export by plan, align XLSX export with the closest existing export entitlement pattern. Do not invent a new monetization rule.

9. If a new dependency is required for workbook generation, Codex may add one lightweight, standard XLSX library, but must explain why in `docs/DEV_LOG.md`.

10. If an existing dependency already supports XLSX generation, prefer using the existing dependency.

11. Update product documentation if necessary to clarify:

   - Standard PDF / Word / Excel export is supported for normal 8D report outputs.
   - Customer-specific Excel templates may require future customization.

12. Update `docs/DEV_LOG.md` after completion.

## Acceptance Criteria

The task is complete only if:

- [ ] A normal 8D report can be exported as `.xlsx`.
- [ ] The generated workbook opens in Excel-compatible software.
- [ ] The workbook contains report metadata and D0-D8 content.
- [ ] The export is available from the existing export UI.
- [ ] Access checks are preserved.
- [ ] Existing PDF export is not broken.
- [ ] Existing Word export is not broken.
- [ ] Existing ZIP evidence package export is not broken.
- [ ] No unrelated application code is changed.
- [ ] No database schema is changed.
- [ ] No environment variables are changed.
- [ ] Build/lint/type checks are run if available.
- [ ] `docs/DEV_LOG.md` is updated with changed files, verification, risks, and unfinished items.

## Risk Areas

- Export entitlement behavior may be inconsistent with existing PDF/Word rules.
- Workbook generation may require a new dependency.
- Report data may include optional or missing fields.
- Large reports with many attachments should not break export.
- Marketing copy must not imply support for customer-specific Excel templates.

## Completion Report Required

After finishing, update `docs/DEV_LOG.md` with:

- task name
- changed files
- implementation summary
- workbook structure
- export route
- entitlement behavior
- tests/checks run
- risks
- unfinished items
- suggested next task
