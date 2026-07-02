import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const today = "2026-07-01"
const siteUrl = "https://www.8d-reports.com"

function ensureDir(dir) {
  fs.mkdirSync(path.join(root, dir), { recursive: true })
}

function writeFile(file, body) {
  const fullPath = path.join(root, file)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, `${body.trim()}\n`)
}

function json(value) {
  return JSON.stringify(value)
}

const helpTopics = [
  {
    slug: "dashboard",
    title: "Dashboard",
    category: "Getting started",
    summary: "Use the dashboard to find reports, create new work, monitor quota, and manage the Team workspace when Team is enabled.",
    purpose: "The dashboard is the home base after login. It lists reports, shows report status, exposes search and quota signals, and gives Team users a place to review seats and role assignments.",
    matters: "Quality teams usually lose time hunting through email threads, file folders, and local spreadsheets. A report dashboard keeps active complaints, supplier issues, approval state, locks, and revision numbers visible before a customer asks for status.",
    when: "Use it when you start the day, need to reopen an 8D, check whether a report is approved or locked, or confirm whether your plan still allows new report creation.",
    steps: ["Log in and open Dashboard from the global header.", "Use search or the report list to find the relevant customer complaint, supplier issue, or internal defect.", "Review status, lock, revision, owner, and priority before editing.", "Create a new report only when the issue is genuinely separate from existing work.", "For Team, review member seats and invite or role controls from the workspace area."],
    example: "A supplier quality engineer filters for a customer complaint, sees Rev.1 is approved and locked, then opens the report only to export the final package instead of editing the record.",
    mistakes: ["Creating duplicate reports for the same issue instead of reopening the existing record.", "Ignoring lock and revision indicators before making changes.", "Treating quota warnings as a billing error before checking plan limits."],
    related: ["/help/create-new-report", "/help/review-workflow", "/help/team-workspace"],
    screenshot: "/help-assets/dashboard/overview.png",
    source: "audit_screenshots/04_dashboard.png",
  },
  {
    slug: "create-new-report",
    title: "Create New Report",
    category: "Report creation",
    summary: "Start a controlled 8D record with the right title, product, customer or supplier context, priority, and owner.",
    purpose: "Create New Report opens a new structured D0-D8 workspace. It should represent a real complaint, supplier corrective action, manufacturing defect, or recurring quality issue.",
    matters: "The first screen sets the reporting scope. Clear product, customer, supplier, batch, owner, and priority details make the later D0-D8 content easier to review and export.",
    when: "Use it when the issue needs a formal 8D / SCAR response, customer-ready export, evidence package, or team review path.",
    steps: ["Open Dashboard and choose New report.", "Enter a concise title that identifies the issue without exposing unnecessary private data.", "Add report number, customer or supplier reference, product, batch, owner, and priority when available.", "Save the report before writing long investigation content.", "Move into D0 and D1 before filling later steps."],
    example: "Title: Brake bracket coating peel-off, Batch B26-041. Owner: Quality Engineering. Priority: High. Customer reference: CC-2026-118.",
    mistakes: ["Opening a report before confirming the problem really needs 8D structure.", "Using vague titles like customer issue or defect.", "Skipping owner and priority, which makes review responsibility unclear."],
    related: ["/help/d0-d8-editor", "/help/dashboard", "/help/pricing-usage-limits"],
    screenshot: "/help-assets/create-new-report/new-report.png",
    source: "audit_screenshots/05_new_report.png",
  },
  {
    slug: "d0-d8-editor",
    title: "D0-D8 Editor",
    category: "Report editing",
    summary: "Complete each 8D step with structured fields, attachments, root-cause tools, review controls, and export readiness.",
    purpose: "The D0-D8 Editor is the main report workspace. It separates preparation, team, problem description, containment, cause verification, corrective action, validation, prevention, and closure.",
    matters: "Customers reject weak reports when containment, root cause, corrective action, and validation are blended together. The editor keeps the reasoning traceable.",
    when: "Use it throughout the investigation, from the first response to final closure and lessons learned.",
    steps: ["Open a report from the dashboard.", "Use the step navigation to move through D0 to D8.", "Fill required fields with factual evidence and leave unknown items explicit instead of guessing.", "Attach evidence to the step where it supports the decision.", "Save and review before export, sharing, approval, or locking."],
    example: "D3 records blocked inventory and 100 percent sorting. D4 records occurrence and escape cause. D5 records permanent actions linked to those causes.",
    mistakes: ["Putting permanent corrective action into D3 containment.", "Closing D6 without validation sample size or result.", "Inventing measurements because a field feels empty."],
    related: ["/help/root-cause", "/help/evidence-attachments", "/help/export-pdf-word-excel-zip"],
    screenshot: "/help-assets/d0-d8-editor/editor.png",
    source: "audit_screenshots/27_report_editor.png",
  },
  {
    slug: "ai-draft",
    title: "AI Draft",
    category: "AI assistance",
    summary: "Generate draft wording from material you provide, then apply only reviewed text to empty fields.",
    purpose: "AI Draft helps turn complaint emails, inspection notes, photo descriptions, and 5-Why notes into draft report fields. It does not create evidence or approve the report.",
    matters: "Drafting can save typing time, but an 8D report must still be owned by engineering judgment. The feature is intentionally positioned as an assistant.",
    when: "Use it after you have source material but before the report fields are complete. It is not a substitute for investigation, test data, or approval.",
    steps: ["Open the AI dialog from a report.", "Paste only relevant complaint notes, inspection facts, and investigation notes.", "Choose Generate draft.", "Review the draft preview carefully.", "Apply only to empty fields, then edit the wording to match verified evidence."],
    example: "Pasted material says 18 of 500 brackets failed visual coating inspection. The draft may suggest D2 wording, but the engineer must verify the count and scope before keeping it.",
    mistakes: ["Pasting sensitive unrelated data.", "Applying draft text without checking evidence.", "Treating draft wording as customer approval or root-cause verification."],
    related: ["/help/ai-quality-check", "/help/d0-d8-editor", "/help/root-cause"],
    screenshot: "/help-assets/ai-draft/ai-dialog.png",
    source: "audit_screenshots/27_report_editor.png",
  },
  {
    slug: "ai-quality-check",
    title: "AI Quality Check",
    category: "AI assistance",
    summary: "Review a report for possible gaps, missing evidence, weak reasoning, and customer rejection risks without approving it.",
    purpose: "AI Quality Check is a conservative review assistant. It can flag missing information, root-cause weaknesses, corrective-action issues, and customer rejection risks.",
    matters: "A second pass helps catch gaps before export, but final approval must remain with human reviewers and actual evidence.",
    when: "Use it after key D0-D8 fields are filled and before internal review, export, or customer submission.",
    steps: ["Open the AI dialog from the report.", "Choose Review report.", "Read readiness, score, critical issues, missing evidence, and suggestions.", "Update the report only when the suggestion is supported by actual evidence.", "If the tool says context is missing, record No relevant data rather than inventing findings."],
    example: "If D6 says action complete but has no sample size, AI Quality Check may flag validation risk. The team should add test results or state that validation evidence is not yet available.",
    mistakes: ["Calling AI output approval.", "Adding fabricated test results to satisfy a finding.", "Ignoring locked report restrictions before trying to run AI review."],
    related: ["/help/ai-draft", "/help/review-workflow", "/learn/how-ai-helps-draft-but-not-approve-8d-reports"],
    screenshot: "/help-assets/ai-quality-check/quality-check.png",
    source: "audit_screenshots/27_report_editor.png",
  },
  {
    slug: "5-why",
    title: "5-Why",
    category: "Root cause tools",
    summary: "Use the D4 5-Why table to connect the problem to a verified process or system cause.",
    purpose: "The 5-Why section helps the team document a cause chain in D4. It is a thinking aid, not a replacement for evidence.",
    matters: "Many weak reports stop at operator error. A disciplined 5-Why chain pushes toward process controls, detection gaps, and system causes.",
    when: "Use it when the team needs a concise cause chain for a customer complaint, supplier issue, or internal defect.",
    steps: ["Open D4 Root Cause in the editor.", "Write the first why answer based on the observed defect.", "Continue only as far as evidence supports the chain.", "Separate occurrence cause from escape cause in the final root-cause fields.", "Attach supporting evidence when the chain depends on test results, logs, or inspection records."],
    example: "Why did coating peel? Adhesion was weak. Why? Fixture residue remained after line change. Why? Cleaning sign-off was skipped before restart.",
    mistakes: ["Forcing exactly five levels when evidence stops earlier.", "Ending at a person instead of a process condition.", "Mixing occurrence cause and escape cause into one sentence."],
    related: ["/help/root-cause", "/help/fishbone", "/help/corrective-action"],
    screenshot: "/help-assets/5-why/five-why.png",
    source: "audit_screenshots/09_d3_step.png",
  },
  {
    slug: "fishbone",
    title: "Fishbone",
    category: "Root cause tools",
    summary: "Use Fishbone / Ishikawa 6M prompts to compare possible causes before confirming D4.",
    purpose: "Fishbone fields help organize possible causes across people, equipment, material, method, measurement, and environment.",
    matters: "A fishbone review reduces the chance that the team jumps to the first plausible cause and misses a competing process or detection factor.",
    when: "Use it for complex, recurring, or cross-functional issues where one linear 5-Why chain may be too narrow.",
    steps: ["Open D4 Root Cause.", "Fill the relevant 6M fishbone prompts.", "Mark unsupported branches as unverified instead of presenting them as facts.", "Use evidence to narrow the list to verified occurrence and escape causes.", "Attach photos, check sheets, or analysis files if the team used a separate whiteboard or worksheet."],
    example: "Material: coating batch within spec. Method: fixture cleaning sign-off skipped. Measurement: outgoing checklist did not include edge adhesion.",
    mistakes: ["Listing every imaginable cause without evidence.", "Leaving fishbone branches in the final report as if all were root causes.", "Skipping detection or escape analysis."],
    related: ["/help/5-why", "/help/root-cause", "/help/evidence-attachments"],
    screenshot: "/help-assets/fishbone/fishbone.png",
    source: "audit_screenshots/09_d3_step.png",
  },
  {
    slug: "root-cause",
    title: "Root Cause",
    category: "Root cause tools",
    summary: "Document verified occurrence and escape causes in D4 with the evidence needed to support customer review.",
    purpose: "Root Cause records why the defect happened and why current controls allowed it to reach the customer or next process.",
    matters: "Corrective actions only make sense when they trace to verified causes. Without a strong D4, D5 and D7 become generic action lists.",
    when: "Use it after containment is active and investigation evidence is available.",
    steps: ["Review D2 problem scope and D3 containment before writing D4.", "Use 5-Why, fishbone, or both when they clarify reasoning.", "Record occurrence cause and escape cause separately.", "Add verification method, evidence, and any No relevant data gaps.", "Only move to D5 once the causes are credible enough to act on."],
    example: "Occurrence cause: fixture cleaning verification was skipped after line change. Escape cause: outgoing inspection checklist did not include coating edge adhesion.",
    mistakes: ["Writing suspected cause as verified cause.", "Using lack of training as a root cause without process evidence.", "Skipping escape cause."],
    related: ["/help/5-why", "/help/fishbone", "/help/corrective-action"],
    screenshot: "/help-assets/root-cause/root-cause.png",
    source: "audit_screenshots/09_d3_step.png",
  },
  {
    slug: "containment-action",
    title: "Containment Action",
    category: "D3",
    summary: "Use D3 to protect the customer while root cause and permanent corrective action are still being verified.",
    purpose: "Containment Action records temporary actions such as stock block, sorting, customer notification, shipment hold, and added outgoing inspection.",
    matters: "Customers need to know what is being done immediately to prevent more escapes while the investigation continues.",
    when: "Use it as soon as a potential customer, supplier, or production risk is confirmed.",
    steps: ["Open D3 Containment.", "Record affected lots, stock locations, suspect dates, and customer impact.", "Assign owners and completion dates for temporary actions.", "Attach sort records, photos, or communication evidence.", "Review containment before moving to permanent corrective action."],
    example: "Blocked batch B26-041, started 100 percent visual sort, added temporary outgoing adhesion check, and notified customer service.",
    mistakes: ["Calling containment a permanent fix.", "Skipping owner or release criteria.", "Forgetting to update containment after the suspected scope changes."],
    related: ["/help/root-cause", "/help/evidence-attachments", "/help/d0-d8-editor"],
    screenshot: "/help-assets/containment-action/containment.png",
    source: "audit_screenshots/09_d3_step.png",
  },
  {
    slug: "corrective-action",
    title: "Corrective Action",
    category: "D5",
    summary: "Use D5 to select permanent actions that trace directly to verified occurrence and escape causes.",
    purpose: "Corrective Action records the chosen permanent fixes, responsible owners, dates, expected results, and review notes.",
    matters: "A customer-ready 8D must show why each action addresses a verified cause, not just that someone completed a task.",
    when: "Use it after D4 root cause is credible and before implementation validation in D6.",
    steps: ["Open D5 Corrective Action.", "Map each proposed action to a D4 occurrence or escape cause.", "Assign owner, due date, and expected result.", "Add evidence or approval notes where needed.", "Do not close D5 until the action is specific enough to validate."],
    example: "Update fixture cleaning sign-off and outgoing adhesion checklist because D4 identified missed cleaning verification and a detection gap.",
    mistakes: ["Adding generic retraining without changing the process or control.", "Choosing actions before root cause is verified.", "Leaving due dates or owners blank."],
    related: ["/help/root-cause", "/help/preventive-action", "/learn/how-to-write-an-8d-report-customers-will-accept"],
    screenshot: "/help-assets/corrective-action/corrective-action.png",
    source: "audit_screenshots/10_d4_step.png",
  },
  {
    slug: "preventive-action",
    title: "Preventive Action",
    category: "D7",
    summary: "Use D7 to prevent recurrence by extending lessons to controls, documents, training, audits, or similar processes.",
    purpose: "Preventive Action turns one fix into a system improvement. It captures control-plan changes, work instruction updates, audit changes, and deployment to similar areas.",
    matters: "Customers often look for evidence that the issue will not return in the same or related process.",
    when: "Use it after corrective actions are implemented and validation evidence shows the fix works.",
    steps: ["Open D7 Prevent Recurrence.", "Identify similar products, lines, suppliers, or processes that need the lesson.", "Record document, training, audit, PFMEA, or control-plan updates.", "Assign owners for deployment.", "Attach revised documents or audit evidence when available."],
    example: "After coating fixture cleaning was corrected, the team updated the line-change checklist and layered audit for all coating lines.",
    mistakes: ["Repeating the D5 action without system deployment.", "Claiming recurrence prevention without document or control change.", "Forgetting similar process review."],
    related: ["/help/corrective-action", "/help/review-workflow", "/help/team-workspace"],
    screenshot: "/help-assets/preventive-action/preventive-action.png",
    source: "audit_screenshots/11_d8_filled.png",
  },
  {
    slug: "evidence-attachments",
    title: "Evidence / Attachments",
    category: "Evidence",
    summary: "Attach photos, inspection records, logs, worksheets, and customer files to the D-step where they support the decision.",
    purpose: "Evidence and attachments keep supporting files inside the report workflow instead of scattered across email threads and folders.",
    matters: "A reviewer can understand why a decision was made when the file is attached to the relevant D-step.",
    when: "Use it for defect photos, containment sort records, root-cause evidence, validation results, revised instructions, and customer documents.",
    steps: ["Open the relevant D-step.", "Choose camera, photo library, or file upload when editing is allowed.", "Upload only evidence relevant to the report.", "Use clear filenames so reviewers know what each file proves.", "Before export, confirm the attachments belong in the delivery package."],
    example: "Attach coating peel photos in D2, sort sheet in D3, adhesion test result in D6, and updated checklist in D7.",
    mistakes: ["Uploading unrelated private files.", "Attaching evidence to the wrong D-step.", "Assuming attachments prove a claim without describing the result in the report text."],
    related: ["/help/export-pdf-word-excel-zip", "/help/share-link", "/help/permissions"],
    screenshot: "/help-assets/evidence-attachments/attachments.png",
    source: "audit_screenshots/27_report_editor.png",
  },
  {
    slug: "review-workflow",
    title: "Review Workflow: Draft / Internal Review / Approved / Submitted / Closed",
    category: "Team workflow",
    summary: "Use workflow states to move a report from draft work to controlled review, approval, customer submission, and closure.",
    purpose: "The workflow records the report state and helps Team users protect approved, submitted, and closed records from casual edits.",
    matters: "Review state matters when several people edit a report or when a customer asks which revision was delivered.",
    when: "Use Draft during writing, Internal Review before approval, Approved before delivery, Submitted after customer delivery, and Closed after final completion.",
    steps: ["Open the report workflow panel.", "Review missing content and knowledge readiness warnings.", "Move Draft to Internal Review when the report is ready for reviewers.", "Only owners should move reports to Approved, Submitted, or Closed.", "Recognize that approved, submitted, and closed states lock the report."],
    example: "A Team owner moves a completed Rev.0 from Internal Review to Approved. The report becomes locked before PDF, Word, or Excel export is sent.",
    mistakes: ["Using Approved before evidence review.", "Changing a locked report without recording a revision reason.", "Treating status as customer acceptance unless the customer actually accepted the report."],
    related: ["/help/lock-unlock-revision", "/help/team-workspace", "/help/ai-quality-check"],
    screenshot: "/help-assets/review-workflow/workflow.png",
    source: "audit_screenshots/27_report_editor.png",
  },
  {
    slug: "lock-unlock-revision",
    title: "Lock / Unlock / Revision",
    category: "Team workflow",
    summary: "Lock approved records, unlock only with a revision reason, and track revision numbers for changed report packages.",
    purpose: "Locking prevents edits, attachment deletion, and signature replacement after a report reaches a controlled state. Unlock for revision creates a new revision number with a required reason.",
    matters: "Revision control reduces confusion about which report was approved, submitted, or changed after customer feedback.",
    when: "Use locking when a report is approved, submitted, or closed. Use unlock only when the owner needs to revise the record.",
    steps: ["Open Workflow and activity.", "Review the current revision and lock status.", "If locked, enter a clear reason before unlocking.", "Make the required change after the report is editable again.", "Return the report through review and approval before resubmitting."],
    example: "Customer requests expanded validation evidence. Owner unlocks Rev.0 with reason, adds D6 evidence, and re-approves as Rev.1.",
    mistakes: ["Unlocking without a business reason.", "Editing a report after approval without changing revision history.", "Assuming viewers or editors can override owner workflow controls."],
    related: ["/help/review-workflow", "/help/permissions", "/help/export-pdf-word-excel-zip"],
    screenshot: "/help-assets/lock-unlock-revision/revision.png",
    source: "audit_screenshots/27_report_editor.png",
  },
  {
    slug: "team-workspace",
    title: "Team Workspace",
    category: "Team workflow",
    summary: "Use Team Workspace for shared report ownership, seats, roles, approval, locking, revisions, and activity history.",
    purpose: "Team Workspace gives small quality teams a controlled place to manage shared 8D work instead of relying on one person's files.",
    matters: "Supplier quality, process engineering, production, and managers often need different levels of access to the same report.",
    when: "Use it when multiple people need to prepare, review, approve, or view the same 8D / SCAR records.",
    steps: ["Upgrade or use a Team-enabled workspace.", "Open the Team area from the dashboard.", "Invite members up to the seat limit.", "Assign Owner, Editor, or Viewer roles.", "Use workflow and activity controls for review and revision history."],
    example: "Owner manages approval, editors prepare D0-D8 and attachments, and viewers inspect the final report without changing it.",
    mistakes: ["Giving edit access to people who only need to review.", "Leaving the owner unclear.", "Expecting complex approval matrices or SSO that are not part of the current product surface."],
    related: ["/help/permissions", "/help/review-workflow", "/help/team-launch"],
    screenshot: "/help-assets/team-workspace/team.png",
    source: "audit_screenshots/04b_dashboard_after_login.png",
  },
  {
    slug: "permissions",
    title: "Owner / Editor / Viewer permissions",
    category: "Team workflow",
    summary: "Use Owner, Editor, and Viewer roles to control who can manage workflow, edit report content, or view records.",
    purpose: "Permissions separate control from contribution. Owners manage workflow and roles, editors prepare report content, and viewers inspect without editing.",
    matters: "Role clarity protects locked reports, prevents accidental changes, and keeps customer-facing records controlled.",
    when: "Use permissions whenever a team member, supplier, customer, or manager needs access that differs from the report owner.",
    steps: ["Open Team workspace controls.", "Assign Owner for the person accountable for report control.", "Assign Editor for contributors who should update fields or evidence.", "Assign Viewer for read-only review.", "Revisit roles when an issue moves from drafting to approval."],
    example: "A process engineer is an editor during D4-D6, while a plant manager is a viewer before approval.",
    mistakes: ["Using Owner for everyone.", "Giving edit access through share links when view-only review is enough.", "Forgetting that locked reports block edit-like actions."],
    related: ["/help/team-workspace", "/help/share-link", "/help/lock-unlock-revision"],
    screenshot: "/help-assets/permissions/roles.png",
    source: "audit_screenshots/04b_dashboard_after_login.png",
  },
  {
    slug: "share-link",
    title: "Share Link",
    category: "Sharing",
    summary: "Create a view-only or eligible editable link so a reviewer can inspect or contribute without emailing file versions.",
    purpose: "Share Link creates a controlled URL for a report. Free sharing is view-only; editable sharing is available on Pro and Team when supported by permissions.",
    matters: "A link avoids sending stale Word, Excel, or PDF files around during active review.",
    when: "Use view-only links for customers, managers, or reviewers. Use editable links only when the recipient should directly update the original report.",
    steps: ["Open Share from the report.", "Choose view-only unless the collaborator must edit.", "Create or update the link.", "Copy the link and send it through your approved communication channel.", "Remove the link when it is no longer needed."],
    example: "Send a view-only link to a customer reviewer before export so they can confirm the structure without editing the source report.",
    mistakes: ["Using edit access for formal customer review.", "Keeping old links active after the review window closes.", "Assuming share links replace internal approval."],
    related: ["/help/permissions", "/help/export-pdf-word-excel-zip", "/help/review-workflow"],
    screenshot: "/help-assets/share-link/share-link.png",
    source: "audit_screenshots/16_share_link.png",
  },
  {
    slug: "export-pdf-word-excel-zip",
    title: "Export PDF / Word / Excel / ZIP",
    category: "Export",
    summary: "Export formal report packages in PDF, Word, or Excel, with attachments packaged as ZIP when present.",
    purpose: "Export turns the online report into a deliverable file. PDF is fixed, Word is editable, Excel is useful for tabular customer workflows, and ZIP packages attachments when needed.",
    matters: "Customers and internal reviewers often need a controlled file package, not just an online record.",
    when: "Use export after D0-D8 content, evidence, review state, and plan entitlements are ready.",
    steps: ["Open the report and review completion warnings.", "Choose Export.", "Select PDF, Word, or Excel based on recipient needs and plan access.", "If attachments exist, download the ZIP package that includes the selected report file and attachments.", "Do not use export as a substitute for review or approval."],
    example: "A Pro user exports no-watermark PDF and Excel for a customer package; the app downloads a ZIP because D3 and D6 attachments exist.",
    mistakes: ["Exporting before missing evidence is resolved.", "Expecting custom customer Excel templates unless Template Setup has handled that need.", "Clicking export gates without understanding plan limits."],
    related: ["/help/pricing-usage-limits", "/help/template-setup", "/learn/how-to-export-professional-8d-reports-in-pdf-word-and-excel"],
    screenshot: "/help-assets/export-pdf-word-excel-zip/export-menu.png",
    source: "audit_screenshots/13_export_menu.png",
  },
  {
    slug: "pricing-usage-limits",
    title: "Pricing / Usage Limits",
    category: "Billing",
    summary: "Understand Free, Pro, Team, and single-report export limits before creating, exporting, or sharing reports.",
    purpose: "Pricing and usage limits explain which plan supports report creation, watermark behavior, Word and Excel export, editable sharing, Team roles, and workflow controls.",
    matters: "Clear limits prevent surprise during export or collaboration, especially when a customer deadline is close.",
    when: "Check this before relying on formal export, multiple reports, Team workflow, or editable collaboration.",
    steps: ["Review the Pricing page.", "Use Free for evaluation and limited reports.", "Use Pro for regular individual report delivery.", "Use Team for shared workspace, roles, workflow, locking, revisions, and activity history.", "Use single-report export when only one selected report needs formal export."],
    example: "Free users can evaluate with limited reports and watermarked PDF. Pro, Team, or single export unlock no-watermark PDF, Word, and Excel for eligible reports.",
    mistakes: ["Assuming Free includes unlimited formal export.", "Using single export when a team needs ongoing shared workflow.", "Confusing usage limits with data loss; existing reports remain accessible."],
    related: ["/pricing", "/help/export-pdf-word-excel-zip", "/help/team-workspace"],
    screenshot: "/help-assets/pricing-usage-limits/pricing.png",
    source: "audit_screenshots/24_pricing.png",
  },
  {
    slug: "template-setup",
    title: "Template Setup",
    category: "Services",
    summary: "Use Template Setup when your customer-specific Word or Excel format needs guided online inputs or future customization.",
    purpose: "Template Setup is a service path for converting customer-specific 8D forms, merged Excel sheets, or company-controlled templates into a cleaner online workflow.",
    matters: "Some customers require exact formats. A setup path keeps that request separate from standard export behavior and avoids overpromising generic export customization.",
    when: "Use it when the standard PDF, Word, or Excel output is not enough for a customer-specific format.",
    steps: ["Open the Custom 8D Template Setup page.", "Collect sample Word or Excel templates and required customer rules.", "Remove confidential data before sharing examples.", "Submit the request through the contact path.", "Review the setup scope manually before any production use."],
    example: "A supplier has a customer Excel workbook with 5-Why, action list, and signature sections. Template Setup evaluates how to map online fields to that format.",
    mistakes: ["Assuming standard export exactly matches every customer template.", "Uploading confidential templates without review.", "Treating setup as instant automation."],
    related: ["/custom-8d-template-setup", "/help/export-pdf-word-excel-zip", "/help/team-launch"],
    screenshot: "/help-assets/template-setup/template-setup.png",
    source: "audit_screenshots/01_homepage.png",
  },
  {
    slug: "team-launch",
    title: "Team Launch",
    category: "Services",
    summary: "Use Team Launch to prepare a small quality team for shared 8D workflow, roles, review, and report delivery.",
    purpose: "Team Launch is a service path for teams that need help setting up roles, first workflows, report conventions, and practical rollout steps.",
    matters: "A shared 8D process fails when owners, editors, viewers, and review expectations are unclear. Launch support keeps the first customer complaint manageable.",
    when: "Use it before moving a small manufacturing quality team from scattered files into shared online reports.",
    steps: ["Open the Team Launch page.", "Identify team owner, editors, viewers, and first pilot issue.", "Prepare current report examples and export expectations.", "Submit a launch request without secrets or passwords.", "Manually review scope and timeline before rollout."],
    example: "A five-seat Team starts with one customer complaint pilot, assigns the quality manager as owner, and reviews export expectations before inviting editors.",
    mistakes: ["Rolling out to everyone before a pilot report.", "Skipping role ownership.", "Expecting SSO or complex approval matrices that are not currently implemented."],
    related: ["/team-launch", "/help/team-workspace", "/help/permissions"],
    screenshot: "/help-assets/team-launch/team-launch.png",
    source: "audit_screenshots/01_homepage.png",
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting: login, export, AI failure, attachments, payment",
    category: "Troubleshooting",
    summary: "Use safe troubleshooting steps for login, export, AI, attachments, and payment without exposing secrets or bypassing verification.",
    purpose: "Troubleshooting collects conservative checks for the most common support areas while respecting account security and provider boundaries.",
    matters: "Quality teams often troubleshoot under customer deadlines. A clear checklist helps separate user action, plan limits, temporary provider failures, and support escalation.",
    when: "Use it when login codes fail, export is unavailable, AI returns an error, attachments do not upload, or checkout/payment status is confusing.",
    steps: ["For login, request a fresh code and check the correct email alias without asking anyone to share verification codes.", "For export, confirm report access, plan entitlement, and completion warnings.", "For AI failure, keep the report saved and try again later; do not invent missing evidence.", "For attachments, check file type, file size, role permissions, and report lock status.", "For payment, confirm checkout status and contact support if entitlement does not update after provider confirmation."],
    example: "If AI Quality Check is temporarily unavailable, the report remains saved. Continue manual review and rerun the assistant later if needed.",
    mistakes: ["Sharing passwords, tokens, screenshots of verification codes, or payment secrets.", "Trying to bypass 2FA, CAPTCHA, scan login, or real-name verification.", "Assuming every error is data loss."],
    related: ["/help/pricing-usage-limits", "/help/permissions", "/contact"],
    screenshot: "/help-assets/troubleshooting/troubleshooting.png",
    source: "audit_screenshots/03_login_page.png",
  },
]

const learnArticles = [
  {
    slug: "what-is-8d-reports",
    title: "What is 8D Reports?",
    description: "A practical overview of 8D Reports as a structured workspace for D0-D8 problem solving, evidence, review, sharing, and export.",
    keywords: ["8D Reports", "8D report software", "8D problem solving"],
    screenshots: ["/help-assets/d0-d8-editor/editor.png"],
    sections: [
      ["The short answer", "8D Reports is a focused workspace for preparing customer-ready 8D / SCAR responses. It helps quality engineers move from a complaint or defect to D0-D8 fields, evidence, review, sharing, and formal PDF, Word, Excel, or ZIP delivery."],
      ["What it replaces", "The product is meant to reduce scattered Word files, Excel templates, email attachments, and unclear revision ownership. It does not claim to be a full QMS."],
      ["Where AI fits", "AI Draft and AI Quality Check can help with draft wording and conservative review. They do not approve, certify, create evidence, or replace engineering review."],
      ["Who it is for", "The best fit is a quality engineer, SQE, complaint handler, or small manufacturing quality team that needs a structured report record and customer-ready export."],
    ],
  },
  {
    slug: "why-not-manage-8d-reports-in-excel",
    title: "Why not manage 8D reports in Excel?",
    description: "Excel can hold an 8D template, but it becomes fragile when teams need evidence, sharing, review, locking, and repeatable export.",
    keywords: ["Excel 8D template", "8D software vs Excel", "8D report management"],
    screenshots: ["/help-assets/export-pdf-word-excel-zip/export-menu.png"],
    sections: [
      ["Excel is useful but limited", "Excel is familiar and flexible. The problem starts when photos, approvals, revisions, customer comments, and multiple contributors live outside the workbook."],
      ["Version control becomes work", "Teams often send files named final, final-v2, customer-final, and updated-final. That makes it hard to know which package was approved or submitted."],
      ["Evidence needs context", "A photo or test result is easier to review when it is attached to the D-step it supports instead of stored in a separate folder."],
      ["When Excel still matters", "Some customers require Excel. 8D Reports supports Excel export for eligible reports, and Template Setup can be reviewed when customer-specific formats matter."],
    ],
  },
  {
    slug: "how-to-write-an-8d-report-customers-will-accept",
    title: "How to write an 8D report customers will accept",
    description: "A customer-ready 8D report needs measurable problem definition, real containment, verified causes, linked actions, validation, and controlled closure.",
    keywords: ["write 8D report", "customer accepted 8D", "8D corrective action"],
    screenshots: ["/help-assets/d0-d8-editor/editor.png"],
    sections: [
      ["Start with facts", "D2 should define what failed, where it happened, when it happened, how many parts are affected, and what evidence supports the scope."],
      ["Protect the customer first", "D3 containment should explain how suspect product is blocked, sorted, rechecked, or controlled while investigation continues."],
      ["Verify root cause", "D4 should separate occurrence cause from escape cause. Use 5-Why or fishbone when they help, but do not present guesses as facts."],
      ["Link actions to causes", "D5 actions should trace back to D4. D6 should show implementation and validation results. D7 should show recurrence prevention across controls or similar processes."],
    ],
  },
  {
    slug: "8d-report-vs-scar",
    title: "8D Report vs SCAR",
    description: "8D is a structured problem-solving format, while SCAR is a supplier corrective action request that may require an 8D response.",
    keywords: ["8D vs SCAR", "supplier corrective action request", "8D report"],
    screenshots: ["/help-assets/create-new-report/new-report.png"],
    sections: [
      ["The relationship", "SCAR is the request or case from a customer or buyer asking a supplier to respond. 8D is one common structure used to prepare that response."],
      ["What a SCAR usually asks for", "A SCAR may ask for containment, root cause, corrective action, validation, due dates, evidence, and final approval."],
      ["Where 8D Reports helps", "The product gives the supplier a guided D0-D8 workspace and export path for the response package."],
      ["What it does not do", "It does not automatically submit to customer portals or bypass customer review. Final submission remains manual."],
    ],
  },
  {
    slug: "how-ai-helps-draft-but-not-approve-8d-reports",
    title: "How AI helps draft but not approve 8D reports",
    description: "AI can reduce drafting friction and flag possible gaps, but it must not approve reports, invent evidence, or replace engineering responsibility.",
    keywords: ["AI 8D report", "AI quality check", "AI draft 8D"],
    screenshots: ["/help-assets/ai-quality-check/quality-check.png"],
    sections: [
      ["Useful AI jobs", "AI Draft can help turn source notes into draft wording. AI Quality Check can identify missing information, weak reasoning, and possible customer rejection risks."],
      ["Hard boundary", "AI does not approve, certify, or create evidence. If inspection data is missing, the correct wording is No relevant data or a clear open item."],
      ["Human review remains required", "A quality engineer or authorized reviewer must decide whether the report is accurate, complete, and ready to export or submit."],
      ["Practical workflow", "Use AI after source material exists, review every suggestion against evidence, then route the report through manual review and approval."],
    ],
  },
  {
    slug: "how-supplier-quality-teams-handle-customer-complaints-faster",
    title: "How supplier quality teams handle customer complaints faster",
    description: "Supplier quality teams move faster when scope, containment, owners, evidence, and review state are visible in one report workflow.",
    keywords: ["supplier quality", "customer complaint 8D", "SCAR response"],
    screenshots: ["/help-assets/dashboard/overview.png"],
    sections: [
      ["Speed starts with scope", "The first response improves when the team knows affected product, customer reference, suspected lots, owner, and priority."],
      ["Containment needs ownership", "Temporary controls need owner, date, release criteria, and evidence so the customer sees immediate risk reduction."],
      ["Parallel work needs structure", "Process owners, SQE, production, and managers can contribute without losing the D0-D8 structure."],
      ["Faster does not mean automatic", "The goal is better preparation for manual customer review, not automated posting or submission."],
    ],
  },
  {
    slug: "how-to-export-professional-8d-reports-in-pdf-word-and-excel",
    title: "How to export professional 8D reports in PDF, Word and Excel",
    description: "Choose PDF for final records, Word for editable customer documents, Excel for tabular workflows, and ZIP when attachments are part of the package.",
    keywords: ["8D PDF export", "8D Word export", "8D Excel export"],
    screenshots: ["/help-assets/export-pdf-word-excel-zip/export-menu.png"],
    sections: [
      ["Pick the right format", "PDF is best for fixed final records. Word is useful when the recipient requires editable text. Excel is useful when tabular customer workflows matter."],
      ["Review before export", "Export should happen after D0-D8 content, evidence, and review state are ready. Completion warnings are not approval, but they are useful checks."],
      ["Attachments change the package", "When attachments exist, the selected report format and attachment files download together as a ZIP package."],
      ["Plan limits matter", "Free, Pro, Team, and single-report export have different export behavior. Check Pricing before a customer deadline."],
    ],
  },
  {
    slug: "how-team-review-approval-locking-and-revision-history-work",
    title: "How team review, approval locking and revision history work",
    description: "Team workflow helps small quality teams route reports from draft to internal review, approval, submission, closure, locking, and revision.",
    keywords: ["8D approval workflow", "8D revision history", "team quality workflow"],
    screenshots: ["/help-assets/review-workflow/workflow.png"],
    sections: [
      ["The workflow states", "Draft is for writing, Internal Review is for checking, Approved is for controlled approval, Submitted is for customer delivery, and Closed is for final completion."],
      ["Locking protects records", "Approved, submitted, and closed reports are locked against casual edits. Unlocking for revision requires an owner and a reason."],
      ["Roles matter", "Owners manage workflow, editors prepare content, and viewers inspect without editing. This keeps responsibility visible."],
      ["Activity history supports review", "Activity entries help reviewers understand field updates, attachment changes, export events, sharing, and workflow changes."],
    ],
  },
]

function helpMarkdown(topic, order) {
  return `---
title: ${topic.title}
slug: ${topic.slug}
description: ${topic.summary}
type: help
status: ready-for-review
canonical_url: ${siteUrl}/help/${topic.slug}
category: ${topic.category}
order: ${order}
target_keywords: ${json([topic.title, "8D Reports help", "8D report workflow"])}
screenshots: ${json([topic.screenshot])}
videos: ${json([])}
related: ${json(topic.related)}
last_reviewed: ${today}
---

## What this feature is

${topic.purpose}

## Why it matters

${topic.matters}

## When to use it

${topic.when}

## Step-by-step operation

${topic.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Screenshot or video reference

See the page media reference for ${topic.screenshot}. If the asset needs to be refreshed, run the Playwright capture script in scripts/capture-help-assets with an authenticated storage state.

## Example content

${topic.example}

## Common mistakes

${topic.mistakes.map((item) => `- ${item}`).join("\n")}

## Related links / next step CTA

${topic.related.map((href) => `- [${href}](${href})`).join("\n")}
`
}

function learnMarkdown(article, order) {
  const canonical = `${siteUrl}/learn/${article.slug}`
  return `---
title: ${article.title}
slug: ${article.slug}
description: ${article.description}
type: learn
status: ready-for-review
canonical_url: ${canonical}
category: Learn
order: ${order}
target_keywords: ${json(article.keywords)}
screenshots: ${json(article.screenshots)}
videos: ${json([])}
last_reviewed: ${today}
---

${article.sections.map(([title, body]) => `## ${title}\n\n${body}`).join("\n\n")}

## Related product next step

- [Open the Help Center](/help)
- [Review pricing and usage limits](/pricing)
- [Start a report](/signup)
`
}

function linkedInDraft(article) {
  const canonical = `${siteUrl}/learn/${article.slug}`
  return `---
platform: linkedin
source_slug: ${article.slug}
status: ready-for-review
canonical_url: ${canonical}
---

Short post:

${article.title}

For quality engineers and SQE teams, the hard part is usually not filling a template. It is keeping scope, evidence, root cause, corrective action, review state, and export package aligned.

Key takeaways:
- Keep containment separate from permanent corrective action.
- Treat AI Draft and AI Quality Check as assistants, not approvers.
- Preserve final publishing and customer submission as a manual review step.

Read the full article: ${canonical}

Optional carousel:
1. Problem: 8D work gets scattered across Excel, Word, email, and attachments.
2. Better workflow: D0-D8 fields, evidence, review, and export in one place.
3. AI boundary: draft and check, never approve.
4. Final step: human review, then manual publish or customer submission.
`
}

function wechatDraft(article) {
  const canonical = `${siteUrl}/learn/${article.slug}`
  return `---
platform: wechat
source_slug: ${article.slug}
status: ready-for-review
canonical_url: ${canonical}
---

# ${article.title}

很多制造企业的质量工程师并不缺 8D 模板，真正困难的是：客户投诉来了以后，问题描述、临时围堵、根因分析、纠正措施、验证证据、预防再发和最终版本，往往分散在 Excel、Word、邮件、图片文件夹和聊天记录里。

这篇文章对应官网原文：${canonical}

## 适合谁阅读

- 质量工程师、SQE、客诉处理人员
- 需要回复客户 8D / SCAR 的供应商团队
- 正在从 Excel 表格迁移到在线协作的制造企业

## 核心观点

${article.sections.map(([title, body]) => `### ${title}\n\n${body}`).join("\n\n")}

## AI 使用边界

AI Draft 可以帮助整理草稿，AI Quality Check 可以提示缺失信息、逻辑薄弱或可能被客户退回的风险。但 AI 不批准报告，不生成事实证据，不替代工程师和审核人的判断。证据缺失时，应明确写 No relevant data 或作为待补充项，而不是编造数据。

## 人工发布说明

本文仅作为微信公众号草稿包。最终标题、配图、排版、敏感信息检查和发布按钮必须由人工完成。
`
}

function zhihuDraft(article) {
  const canonical = `${siteUrl}/learn/${article.slug}`
  return `---
platform: zhihu
source_slug: ${article.slug}
status: ready-for-review
canonical_url: ${canonical}
---

问题：${article.title}

回答：

如果从质量工程师或 SQE 的实际工作看，这个问题的重点不是“有没有一个模板”，而是客户投诉、证据、根因、措施、验证和最终提交版本能不能被清楚地管理。

${article.sections.map(([title, body]) => `## ${title}\n\n${body}`).join("\n\n")}

需要注意的是，AI 可以辅助起草和检查，但不能批准 8D 报告，也不能替代现场证据、测试结果或负责人审核。

官网延伸阅读：${canonical}

说明：这是问答型草稿，发布前需要人工根据知乎语境删减产品表达，避免硬广。
`
}

function mediumDraft(article) {
  const canonical = `${siteUrl}/learn/${article.slug}`
  return `---
platform: medium
source_slug: ${article.slug}
status: ready-for-review
canonical_url: ${canonical}
---

# ${article.title}

Manufacturing quality teams rarely fail because they do not have an 8D template. They struggle because report content, evidence, review status, exports, and revision ownership are scattered across too many places.

Original article: ${canonical}

${article.sections.map(([title, body]) => `## ${title}\n\n${body}`).join("\n\n")}

## A conservative AI boundary

AI can help draft wording and flag possible gaps. It should not approve reports, invent evidence, certify compliance, or replace the responsible quality engineer. If evidence is missing, the report should say so plainly.

## Manual publishing note

This is a Medium draft package only. Final editing, links, images, tags, and publishing must be reviewed and clicked manually.
`
}

function writeOpsFiles() {
  writeFile("ops/accounts/platforms.yaml", `
platforms:
  - platform: LinkedIn
    purpose: Company updates, product education, and quality engineering posts
    account_type: Company Page
    status: application-checklist
    login_email_alias: marketing@8d-reports.com
    owner: Founder / marketing owner
    2fa_owner: Founder
    profile_url: TBD
    required_materials:
      - Company name and logo
      - Website URL
      - Short description
      - Admin personal LinkedIn account
    draft_method: Markdown draft copied manually into LinkedIn composer
    api_possible: false for v1
    secrets_location: No publishing secrets stored in repo; use 1Password if needed later
    notes: Do not automate final post, submit, or publish clicks.
  - platform: WeChat Official Account
    purpose: Chinese long-form education for manufacturing quality engineers
    account_type: Service or subscription account, to be confirmed by business registration
    status: application-checklist
    login_email_alias: cn-content@8d-reports.com
    owner: Founder / China content owner
    2fa_owner: Founder
    profile_url: TBD
    required_materials:
      - Business registration material if required
      - Operator identity verification handled manually
      - Logo, account name, intro, website link
    draft_method: Chinese Markdown copied manually into WeChat editor
    api_possible: not used in v1
    secrets_location: No AppSecret, token, password, verification code, or QR login state stored in repo
    notes: Do not bypass QR login, real-name verification, 2FA, or platform review.
  - platform: Zhihu
    purpose: Non-hard-sell Q&A answers for quality and manufacturing topics
    account_type: Personal or organization account, to be decided manually
    status: application-checklist
    login_email_alias: cn-content@8d-reports.com
    owner: Founder / China content owner
    2fa_owner: Founder
    profile_url: TBD
    required_materials:
      - Profile name
      - Bio
      - Website link if allowed
      - Manual identity checks if required
    draft_method: Q&A Markdown copied manually into Zhihu composer
    api_possible: not used in v1
    secrets_location: No password, token, cookie, or AppSecret stored in repo
    notes: Keep answers educational and avoid aggressive promotion.
  - platform: Medium
    purpose: English long-form educational articles and canonical backlinks
    account_type: Publication or individual author
    status: application-checklist
    login_email_alias: content@8d-reports.com
    owner: Founder / marketing owner
    2fa_owner: Founder
    profile_url: TBD
    required_materials:
      - Author profile
      - Publication description if used
      - Logo and website link
    draft_method: Markdown copied manually into Medium editor
    api_possible: possible but not used in v1
    secrets_location: No integration token stored in repo; use 1Password or GitHub Secrets only if future manual workflow requires it
    notes: Canonical link must point back to official Learn article.
  - platform: CSDN / Juejin
    purpose: Optional China developer and engineering distribution
    account_type: Organization or personal account
    status: optional
    login_email_alias: cn-content@8d-reports.com
    owner: Founder / China content owner
    2fa_owner: Founder
    profile_url: TBD
    required_materials:
      - Profile details
      - Manual verification materials if required
    draft_method: Manual copy package only
    api_possible: not used in v1
    secrets_location: No secrets in repo
    notes: Use only if content matches platform audience.
  - platform: Xiaohongshu
    purpose: Optional awareness content for Chinese manufacturing professionals
    account_type: Personal or business account, to be decided manually
    status: optional
    login_email_alias: cn-content@8d-reports.com
    owner: Founder / China content owner
    2fa_owner: Founder
    profile_url: TBD
    required_materials:
      - Profile name and intro
      - Visual assets
      - Manual verification if required
    draft_method: Manual copy and image package only
    api_possible: not used in v1
    secrets_location: No password, cookie, token, QR state, or AppSecret stored in repo
    notes: Do not automate posting or scrape around platform rules.
`)

  const checklistMap = {
    "linkedin-company-page": "LinkedIn Company Page",
    "wechat-official-account": "WeChat Official Account",
    "zhihu-account": "Zhihu account",
    "medium": "Medium",
    "csdn-juejin": "CSDN / Juejin optional",
    "xiaohongshu": "Xiaohongshu optional",
  }
  for (const [slug, title] of Object.entries(checklistMap)) {
    writeFile(`ops/accounts/checklists/${slug}.md`, `
# ${title} application checklist

Status: ready-for-review

## Materials

- Profile name reviewed
- Logo or avatar reviewed
- Website URL reviewed
- Public description reviewed
- Owner and 2FA owner assigned
- Required business or identity materials prepared outside the repository

## Security rules

- Do not save passwords, verification codes, cookies, tokens, AppSecret, QR login state, or API keys in the repository.
- Store any future secret only in an approved secret manager such as 1Password, Vercel Env, or GitHub Secrets.
- Do not bypass CAPTCHA, QR login, 2FA, real-name verification, or platform review.

## Manual publishing rule

- Drafts may be copied into the platform editor.
- Final submit, publish, send, or schedule clicks must be performed by a human after review.
`)
  }

  writeFile("ops/publishing/publish-checklist.md", `
# Publishing review checklist

Use this before any Help, Learn, or external platform content is manually published.

## Content state

- Status is ready-for-review.
- Canonical URL is present and correct.
- Product claims match the current product surface.
- AI Draft and AI Quality Check are described as assistance only.
- No claim says AI approves, certifies, guarantees customer acceptance, or creates evidence.
- No unsupported QMS, SSO, complex approval matrix, or automatic submission claim is present.

## Asset state

- Screenshot or video reference is present where relevant.
- Screenshots do not expose private customer data.
- Any missing screenshot is noted with the capture script path and reason.

## Platform state

- External draft links back to the official canonical URL.
- Platform-specific tone is appropriate.
- Final publish, submit, send, or schedule action is manual only.
- No platform rules are bypassed.

## Security state

- No passwords, tokens, AppSecret, API keys, cookies, verification codes, QR state, or private customer data are included.
- Account materials are stored in the approved non-repo location.
`)

  writeFile("ops/publishing/content-style-guide.md", `
# Content style guide

## Audience

Write for quality engineers, supplier quality engineers, manufacturing quality managers, complaint handlers, and process owners.

## Voice

- Practical, precise, and conservative.
- Prefer concrete workflow language over hype.
- Use customer-ready only when the article also explains evidence and human review.

## AI claims

- Say AI Draft helps draft wording from provided material.
- Say AI Quality Check can flag possible gaps, missing information, weak reasoning, and customer rejection risks.
- Do not say AI approves, certifies, guarantees acceptance, replaces engineering review, or creates evidence.
- If evidence is missing, use No relevant data or say the item is not yet available.

## Publishing

- All external platform content is a draft package.
- A human must review, edit, and click the final publishing action.
- Do not automate final publish, submit, schedule, send, verification, login, or platform review actions.
`)
}

function seedAssets() {
  for (const topic of helpTopics) {
    const target = path.join(root, "public", topic.screenshot.replace(/^\//, ""))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    const source = path.join(root, topic.source)
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target)
    } else {
      fs.writeFileSync(
        path.join(path.dirname(target), "README.md"),
        `Screenshot source missing: ${topic.source}\nRun scripts/capture-help-assets/capture-help-assets.ts with an authenticated storage state to refresh this module.\n`,
      )
    }
  }
}

for (const dir of [
  "content/help",
  "content/learn",
  "content/platform-drafts/linkedin",
  "content/platform-drafts/wechat",
  "content/platform-drafts/zhihu",
  "content/platform-drafts/medium",
  "ops/accounts/checklists",
  "ops/publishing",
]) {
  ensureDir(dir)
}

helpTopics.forEach((topic, index) => {
  writeFile(`content/help/${topic.slug}.md`, helpMarkdown(topic, index + 1))
})

learnArticles.forEach((article, index) => {
  writeFile(`content/learn/${article.slug}.md`, learnMarkdown(article, index + 1))
  writeFile(`content/platform-drafts/linkedin/${article.slug}.md`, linkedInDraft(article))
  writeFile(`content/platform-drafts/wechat/${article.slug}.md`, wechatDraft(article))
  writeFile(`content/platform-drafts/zhihu/${article.slug}.md`, zhihuDraft(article))
  writeFile(`content/platform-drafts/medium/${article.slug}.md`, mediumDraft(article))
})

writeOpsFiles()
seedAssets()

console.log(`Generated ${helpTopics.length} help docs, ${learnArticles.length} learn articles, external draft packages, ops files, and seeded help assets.`)
