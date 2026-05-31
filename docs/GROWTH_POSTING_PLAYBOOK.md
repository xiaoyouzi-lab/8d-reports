# 8D Reports Growth Execution Playbook For Codex

This document is written for Codex to execute future growth work with the user.

The user has approved this direction:

- Do SEO first.
- Use neutral third-party-style discussion posts instead of direct LinkedIn outreach.
- Avoid cold DMs.
- Keep the product promise focused on the current version: complete 8D reports, attachments, export, sharing, Free vs Pro, and historical search.

## North Star

Primary outcome:

- Get qualified users to create, save, and export one usable 8D report.

30-day target:

- 30 registered users.
- 15 users create their first report.
- 8 successful exports.
- 5+ Pro feature gate triggers.
- 3-5 Pro users.

## Current Funnel To Protect

When doing growth work, do not send traffic to a vague page. Prefer these paths:

1. Discussion post or search result.
2. SEO page or sample report page.
3. User clicks create free report.
4. User signs in.
5. User creates a report.
6. User saves and exports.
7. User hits Pro value through watermark, Word export, logo, unlimited reports, editable share, or deep search.

## Core Links

- Home: `https://8d-reports.com/`
- Sample report: `https://8d-reports.com/sample-report`
- 8D template: `https://8d-reports.com/8d-report-template`
- 8D example: `https://8d-reports.com/8d-report-example`
- Supplier 8D: `https://8d-reports.com/supplier-8d-report`
- Corrective action template: `https://8d-reports.com/corrective-action-report-template`
- 5-Why template: `https://8d-reports.com/5-why-root-cause-template`

## Positioning Rules

Use this short positioning:

> Free for trying and occasional reports. Pro for formal delivery and searchable historical 8D knowledge.

Emphasize:

- Free includes the complete D0-D8 editor.
- Free includes 5 lifetime reports.
- Free PDF export has watermark.
- Pro unlocks unlimited reports, no-watermark PDF, Word export, company logo, editable sharing, and deep historical search.
- AI report drafting is coming later and should only be treated as interest validation for now.

Do not claim:

- That the product replaces quality engineering judgment.
- That AI approves or completes formal reports automatically.
- That current version includes full QMS, team approval workflow, SCAR automation, or supplier portals.

## Weekly Codex Execution Loop

Every week, Codex should execute this sequence when the user asks for growth work:

1. Check the live site.
   - Confirm home, sample report, pricing, and current SEO pages load.
   - Confirm CTAs go to login or pricing as intended.
   - Confirm Vercel Analytics or local event data can be read.

2. Check current metrics.
   - Run the local metrics dashboard if database access is available.
   - Record: visits, signups, report_created, report_saved, export_succeeded, upgrade_clicked, checkout_started, checkout_completed.
   - Compare the last 7 days with the previous 7 days.

3. Choose one growth experiment.
   - One new SEO page, or
   - One community post topic, or
   - One landing page improvement.
   - Do not run many vague changes at the same time.

4. Prepare publishable output.
   - For SEO: create the page, metadata, internal links, and sitemap entry.
   - For community posts: produce final post text, title options, target communities, and UTM links.
   - For landing improvements: make the smallest change that improves activation or trust.

5. Verify and ship.
   - Run `npm run lint`.
   - Run `npx tsc --noEmit`.
   - Run `npx next build --webpack`.
   - If code changed, commit and push when the user asks.

6. Follow up.
   - After 24-72 hours, compare metrics.
   - Keep what improves qualified visits or report creation.
   - Rewrite or stop what only brings unqualified traffic.

## First 14 Days Execution Plan

### Day 1: Baseline And Sample Report

Codex actions:

- Confirm `/sample-report` is live.
- Confirm it is in `sitemap.xml`.
- Check that the homepage links to it.
- Run the local metrics dashboard and write down baseline numbers.

User action:

- Post one neutral discussion using Template 1.

Measure:

- Visits to `/sample-report`.
- Clicks from sample page to login.
- Signups.
- Report creation.

### Day 3: Historical Search Discussion

Codex actions:

- Generate final post text for historical search.
- Add UTM links.
- Check whether the sample page or homepage needs a clearer deep-search section.

User action:

- Publish in one suitable community.
- Reply to comments with questions, not sales replies.

Measure:

- Visits to home or sample page.
- `deep_search_gate_clicked`.
- `upgrade_clicked`.

### Day 5: Template Pain Discussion

Codex actions:

- Generate final post text about Excel/Word 8D templates.
- Link to `/8d-report-template`.
- Check whether `/8d-report-template` has a strong path to sample report and login.

User action:

- Publish in one suitable community or forum.

Measure:

- Visits to `/8d-report-template`.
- Clicks to `/sample-report`.
- Clicks to login.

### Day 7: Metrics Review

Codex actions:

- Compare metrics before and after the first three posts.
- Identify top landing page, top UTM source, and where users drop.
- Recommend one change only.

Decision rules:

- If visits are low: improve titles and channels.
- If visits are good but signup is low: improve landing page trust and CTA.
- If signups happen but no reports: improve first-report onboarding.
- If reports happen but no export: improve editor completion and export prompts.
- If exports happen but no Pro clicks: improve Pro gates and pricing copy.

### Day 10: Objection Response

Codex actions:

- Read user-collected comments or objections.
- Turn the top objection into either:
  - a FAQ update,
  - a new SEO section,
  - or one short community reply.

### Day 14: Pick The Best Channel

Codex actions:

- Rank channels by qualified actions, not raw traffic.
- Qualified actions are signup, report_created, export_succeeded, upgrade_clicked, checkout_started.
- Convert the best-performing topic into the next SEO page or blog article.

## Community Post Templates

Use these as drafts. Before publishing, Codex should adapt wording to the target community and remove anything that feels promotional.

### Template 1: Supplier 8D Discussion

Title:

> Would you ask suppliers to fill out 8D reports in an online tool instead of Excel or Word?

Post:

> I came across an online 8D reporting site and tried the flow briefly. It lets users fill D0-D8, attach evidence, export a PDF, and keep old reports searchable.
>
> It made me wonder how practical this would be in supplier quality work. In your company, would customers accept a supplier completing 8D reports in a web tool, or do they still require a specific Excel/Word template?
>
> The sample page I looked at: https://8d-reports.com/sample-report?utm_source=community&utm_medium=discussion&utm_campaign=supplier_8d_sample
>
> Curious where people see the biggest blocker: customer format requirements, data privacy, supplier adoption, or just habit?

### Template 2: Historical Search Discussion

Title:

> Do quality teams actually reuse old 8D reports, or do we keep starting from zero?

Post:

> One thing I noticed while looking at newer 8D tools is the idea of searching old reports by problem description, root cause, corrective action, and lessons learned.
>
> In theory, that sounds useful for repeated defects or similar supplier issues. In practice, I wonder how often teams actually search historical 8Ds before writing a new one.
>
> Example of the kind of product positioning I saw: https://8d-reports.com/?utm_source=community&utm_medium=discussion&utm_campaign=historical_search
>
> For people working in quality, would searchable 8D history be valuable, or is the bigger pain still getting the first report completed correctly?

### Template 3: Excel Template Pain

Title:

> Are 8D templates in Excel still the easiest option?

Post:

> I have seen a lot of teams still using Excel or Word for 8D reports because the format is familiar and easy to send to customers.
>
> I recently found a web-based 8D template that keeps D0-D8 structured, supports evidence uploads, and exports reports. It seems aimed at reducing scattered attachments and making old reports easier to find.
>
> Template page: https://8d-reports.com/8d-report-template?utm_source=community&utm_medium=discussion&utm_campaign=excel_template_pain
>
> What would make you switch from a spreadsheet template to a web tool? Or is the spreadsheet still the most practical choice?

## Channel Rules

Acceptable first channels:

- Quality engineering and manufacturing forums.
- Reddit communities related to quality, manufacturing, engineering, operations, lean, or small business operations.
- Indie maker feedback communities, but only when asking for product feedback.
- Blog/SEO pages on the product site.

Avoid:

- Cold LinkedIn DMs.
- Reposting identical text across many communities.
- Promotional posts that say "I built this" unless the community explicitly supports maker feedback.
- Claiming the tool is enterprise-ready before the product proves it.

## Data Codex Must Record After Each Post

For each post, create or update a short note with:

- Date.
- Channel.
- Post URL if available.
- Landing URL and UTM.
- Topic.
- 24-hour visits.
- 72-hour visits.
- Signups.
- Reports created.
- Exports succeeded.
- Pro gate clicks.
- Comments or objections.
- Decision: keep, rewrite, stop, or turn into SEO.

## Next SEO Page Backlog

Prioritize based on comments and search intent:

1. `8d-report-pdf-export`
   - Intent: users want a deliverable report.
   - CTA: sample report and create free report.

2. `supplier-corrective-action-report`
   - Intent: supplier quality teams and customers requesting SCAR/8D.
   - CTA: supplier 8D page and sample report.

3. `8d-vs-capa`
   - Intent: users comparing methods.
   - CTA: corrective action template.

4. `8d-root-cause-analysis`
   - Intent: users struggling with D4.
   - CTA: 5-Why template.

Only build one new SEO page at a time, then measure.

## When To Ask The User

Ask the user before:

- Posting anything directly from their account.
- Creating accounts on forums or communities.
- Using paid tools.
- Changing pricing.
- Making claims about compliance, security certification, or enterprise suitability.

Do not ask before:

- Drafting post options.
- Improving SEO pages.
- Running metrics dashboard.
- Checking live pages.
- Adding internal links or metadata.
