# Revenue Evidence Operating System

## Purpose

8D Reports should not keep adding features before the product proves where
buyers show intent. This operating system defines the daily and weekly rhythm
for learning whether manufacturers want Template Setup, Team Launch, Assisted
First 8D / SCAR Delivery, demo downloads, signup, exports, Knowledge reuse, and
AI Quality Check.

The goal is practical revenue evidence, not vanity traffic. Every review should
answer: did a quality engineer, SQE, quality manager, or small manufacturing
team move closer to a paid conversation or repeat product use?

This document is an operating guide only. It does not add runtime tracking,
production data, payment changes, export entitlement changes, auth changes,
database schema, or Knowledge Base permission changes.

## Daily Checklist

Review the last 24 hours and the rolling 7-day view.

| Signal | Where to inspect | Why it matters | Safe interpretation |
| --- | --- | --- | --- |
| Visits | Analytics page/event counts | Confirms whether acquisition is producing audience | Directional traffic only; do not treat visits as demand |
| Demo report downloads | `demo_report_downloaded`, `sample_download` | Shows users want customer-ready examples | High downloads with no leads means offer or CTA may be weak |
| Template Setup CTA clicks | `pricing_service_cta_clicked` with `template_setup`; marketing CTA service metadata | Shows interest in converting an existing Word/Excel/PDF template | Compare clicks to form starts and submits |
| Template Setup lead submits | `custom_template_requests` with `template_setup` | Primary early revenue evidence | Follow up within one business day |
| Team Launch CTA clicks | `pricing_service_cta_clicked` with `team_launch` | Shows team workflow interest before QMS rollout | Qualify for team size and complaint volume |
| Assisted First 8D / SCAR CTA clicks | `pricing_service_cta_clicked` with `assisted_8d` | Shows urgent report-delivery intent | Qualify due date, evidence, and customer pressure |
| Contact form submits | `contact_form_submitted` plus feedback entries | Captures broad commercial and support intent | Classify as service, product question, or support |
| Signup | `signup_completed` | Shows willingness to try the product | Pair with first-report creation |
| First report created | `report_created` from new users | Shows activation beyond browsing | If signups do not create reports, improve onboarding |
| Export attempted | `export_attempted` | Shows delivery intent and report completion pressure | Compare with report completion and upgrade gates |
| Knowledge search | `knowledge_search_used` | Shows reuse intent from completed reports | Pair with result open/copy behavior |
| Editor reuse opened | `knowledge_reuse_panel_opened` | Shows reuse is entering report-writing workflow | Pair with copy actions |
| AI Quality Check intent | `ai_report_review_clicked` | Shows desire for report review assistance | Pair with export/share behavior |

Daily notes should be factual. Do not invent search volume, AI citation rate,
pipeline value, customer logos, or revenue.

## Weekly Decision Rules

Use the rolling 7-day and 30-day views to decide the next small PR or manual
sales action.

| Pattern | Interpretation | Next action |
| --- | --- | --- |
| Demo downloads but no leads | Users may want proof, but the service offer is not clear enough | Improve CTA placement, service copy, trust copy, and demo-to-template path |
| CTA clicks but no lead submits | Intent exists, but the form may have too much friction or too little trust | Reduce friction, improve form reassurance, clarify file upload is optional |
| Leads but no replies | Follow-up may be too slow, vague, or hard to answer | Improve email subject, first reply, required questions, and follow-up process |
| Signup but no report created | Users may not know how to start or may fear blank-page effort | Improve onboarding, sample import, first report help, and dashboard prompt |
| Report created but no export | Users may not reach delivery-ready completion or may miss export value | Improve report completion guidance, export prompts, and readiness copy |
| Knowledge reuse but no AI check | Users may reuse history but not trust/notice AI review | Improve editor workflow placement and explain how AI Quality Check uses context |
| AI check but no export/share | Review may reveal gaps or export path may be unclear | Improve quality readiness, fix missing-field guidance, and make next action clear |

Weekly decisions should prefer one small change with a measurable hypothesis
over broad redesigns. If evidence is weak, improve the offer and follow-up
before building another feature.

## Lead Follow-Up Playbook

### Template Setup

Goal: get the user to send the Excel, Word, PowerPoint, PDF, or legacy 8D
template they already use, then convert it into a reusable 8D Reports workflow
or setup path.

Reply framework:

1. Acknowledge the request and confirm the file/template was received, or ask
   them to reply with the file if upload failed.
2. Ask for industry, current format, required customer wording, required export
   format, and biggest pain point.
3. Propose a setup scope: field mapping, logo/header/footer, D0-D8 sections,
   evidence expectations, approval wording, and export review.
4. Offer paid setup with a clear next step and a concrete timeline window.

Good next-step question:

> Can you reply with the current template and one example of a completed report
> with sensitive details removed? I will confirm the setup scope and price.

### Team Launch

Goal: help a small quality team establish an 8D/SCAR workflow before buying or
building a full QMS.

Reply framework:

1. Ask team size, roles, complaint volume, and whether responses are mainly
   customer 8D, supplier 8D, SCAR, or internal CAPA.
2. Ask who needs to create, edit, review, approve, submit, and close reports.
3. Propose a launch call focused on workspace setup, first report workflow,
   review/approval responsibilities, and first-week success criteria.
4. Explain deliverables: workspace setup, role guidance, first template setup,
   example workflow, and handoff notes.

Good next-step question:

> How many people need to create or approve 8D/SCAR reports, and how many
> customer or supplier corrective actions do you handle in a typical month?

### Assisted First 8D / SCAR

Goal: help the user complete the first customer-deliverable report without
claiming that 8D Reports guarantees customer acceptance.

Reply framework:

1. Ask for problem summary, customer due date, current report format, and
   available evidence.
2. Explain what the user provides: defect description, containment status,
   photos/logs/measurements, root-cause thinking, corrective action owner, and
   validation evidence.
3. Explain what 8D Reports helps produce: structured D0-D8 draft, evidence
   organization, readiness review, and export package.
4. Confirm that customer approval, evidence accuracy, and final submission
   responsibility remain with the user.

Good next-step question:

> What is the customer due date, and what evidence do you already have for
> containment, root cause, corrective action, and validation?

## Revenue Targets

These are early operating targets, not forecasts.

### Week 1

- 10+ demo downloads.
- 3+ service CTA clicks.
- 1+ lead.

### Month 1

- 50+ demo downloads.
- 10+ service CTA clicks.
- 3+ leads.
- 1 paid assisted/service conversation.

### Month 3

- 10+ leads.
- 2-3 paid service deals.
- First Team Launch.

If targets are missed, diagnose the funnel before adding more features. If
targets are exceeded, inspect lead quality and paid-service fit before scaling
content.

## What Not To Do

- Do not continue blindly adding features without conversion evidence.
- Do not publish low-quality AI article batches.
- Do not buy fake traffic.
- Do not fabricate customer stories, customer logos, revenue, or usage data.
- Do not promise guaranteed customer acceptance.
- Do not describe 8D Reports as a certified full QMS.
- Do not turn Template Setup or Assisted First 8D into unlimited free consulting.
- Do not collect full report text, customer names, supplier names, product names,
  batch numbers, attachment content, full queries, payment details, share tokens,
  passwords, or secrets in analytics metadata.

## Operating Notes

- Use existing admin metrics and analytics events first.
- Keep lead follow-up manual until there is enough evidence to automate.
- Prefer safe enums, counts, formats, paths, referrer, UTM, plan, and anonymous
  session id for measurement.
- Use production data only as observed customer behavior; do not create test
  leads, test users, or test reports in production.
- Review this operating system weekly and update it only when real evidence
  changes the operating rhythm.
