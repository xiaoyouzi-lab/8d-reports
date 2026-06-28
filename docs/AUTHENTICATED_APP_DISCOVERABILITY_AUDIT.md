# Authenticated App Feature Discoverability Audit

## Purpose

This audit defines the v1 standard for logged-in feature discoverability after PR #8 introduced the Quality Knowledge Base.

The core product path is:

1. Create an 8D report.
2. Complete or close the corrective-action workflow.
3. Reuse completed-report knowledge through the Quality Knowledge Base.

This PR does not add new product capability. It makes existing authenticated capability easier to see, understand, and measure.

## Stage Full Score Standard

A feature reaches stage full score when a logged-in user can discover it without opening the avatar menu, understand why it matters, and reach it from the relevant workflow context.

For this PR, full score requires:

- Header visibility: the feature appears in primary authenticated navigation on desktop.
- Mobile visibility: the feature appears in authenticated mobile navigation without relying on the avatar menu.
- Dashboard visibility: the feature appears on the first dashboard screen when relevant.
- Workflow context: the feature appears near the workflow moment where the user naturally needs it.
- Metric clarity: nearby counts describe exactly what they count.
- Safe analytics: clicks are tracked with enum-like metadata only, not report text, query text, customer names, product names, root cause, corrective action, or lessons learned.
- Scope safety: no auth, payment, export, AI, public marketing, database schema, or Knowledge Base search logic changes.

## Current Stage Scores

| Feature | Stage status | Evidence | Notes |
| --- | --- | --- | --- |
| Dashboard / My Reports | Full score | Primary app navigation includes Dashboard; dashboard remains the first operational surface. | Existing report list, search, quota, Team workspace, workflow status, and upgrade surfaces are preserved. |
| New Report | Full score | Primary app navigation includes New Report; dashboard workflow prompt and report action row include New Report; empty state includes Create your first report. | This is discovery of existing creation flow only. |
| Quality Knowledge Base | Full score | Primary app navigation includes Knowledge Base; mobile navigation includes Knowledge Base; dashboard workflow prompt, reuse card, report action row, and report workflow panel link to Knowledge Base. | Knowledge Base is no longer dependent on the avatar menu. |
| Create -> complete -> reuse narrative | Full score | Dashboard first-screen panel explains that completed 8D reports become reusable quality knowledge. Empty state now includes reuse after completion. | Copy is operational and avoids public-site marketing claims. |
| Dashboard metric semantics | Full score | Counts now include small semantic labels: total accessible reports, not submitted or closed, eligible knowledge assets, and closed-report exclusion where relevant. | The Complete and close action card no longer leaves the active-workflow count ambiguous. |
| Safe authenticated analytics | Full score | `app_navigation_clicked` and `dashboard_feature_entry_clicked` track only nav item, destination, location, entry, and plan. | No report content, query text, customer/product names, or Knowledge Base field text is sent. |

## Should Be Full Score But Is Not Yet

None after this PR.

Before this PR, Quality Knowledge Base discovery was below stage full score because it was primarily available through the avatar menu. This PR closes that gap with persistent app navigation, dashboard entry points, workflow-context entry, and safe click analytics.

## Future Items

These are intentionally outside the PR #9 scope:

- Personalized onboarding checklist.
- Product tour or coach marks.
- Usage-based feature recommendations.
- Dedicated analytics dashboard for discoverability metrics.
- Authenticated smoke infrastructure.
- AI-assisted recommendations that point users to relevant historical knowledge.
- Plan-gated Knowledge Base experiments.

## Analytics Events

Allowed v1 events added by this PR:

- `app_navigation_clicked`
- `dashboard_feature_entry_clicked`

Safe metadata fields:

- `navItem`
- `destination`
- `location`
- `entry`
- `plan`

Do not send:

- Full search query
- Problem description
- Root cause
- Corrective action
- Lessons learned
- Customer name
- Supplier name
- Product name
- Batch number
- Attachment content

## Ready To Merge Checklist

- Knowledge Base is visible outside the avatar menu.
- Desktop and mobile logged-in navigation expose Dashboard, Knowledge Base, and New Report.
- Dashboard explains create -> complete -> reuse.
- Dashboard includes Knowledge Base entries near the workflow prompt and report action row.
- Report workflow panel links completed/closed reports to Knowledge Base reuse.
- Dashboard counts use labels that match the underlying data.
- New analytics events are allowlisted and use safe metadata only.
- Governance tests cover the discoverability surface, dashboard metric semantics, docs, and analytics allowlist.
- No public marketing, payment, export, AI, auth, database schema, or Knowledge Base search logic changes are included.
