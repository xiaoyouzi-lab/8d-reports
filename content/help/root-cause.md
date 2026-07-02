---
title: Root Cause
slug: root-cause
description: Document verified occurrence and escape causes in D4 with the evidence needed to support customer review.
type: help
status: ready-for-review
canonical_url: https://www.8d-reports.com/help/root-cause
category: Root cause tools
order: 8
target_keywords: ["Root Cause","8D Reports help","8D report workflow"]
screenshots: ["/help-assets/root-cause/root-cause.png"]
videos: []
related: ["/help/5-why","/help/fishbone","/help/corrective-action"]
last_reviewed: 2026-07-01
---

## What this feature is

Root Cause records why the defect happened and why current controls allowed it to reach the customer or next process.

## Why it matters

Corrective actions only make sense when they trace to verified causes. Without a strong D4, D5 and D7 become generic action lists.

## When to use it

Use it after containment is active and investigation evidence is available.

## Step-by-step operation

1. Review D2 problem scope and D3 containment before writing D4.
2. Use 5-Why, fishbone, or both when they clarify reasoning.
3. Record occurrence cause and escape cause separately.
4. Add verification method, evidence, and any No relevant data gaps.
5. Only move to D5 once the causes are credible enough to act on.

## Screenshot or video reference

See the page media reference for /help-assets/root-cause/root-cause.png. If the asset needs to be refreshed, run the Playwright capture script in scripts/capture-help-assets with an authenticated storage state.

## Example content

Occurrence cause: fixture cleaning verification was skipped after line change. Escape cause: outgoing inspection checklist did not include coating edge adhesion.

## Common mistakes

- Writing suspected cause as verified cause.
- Using lack of training as a root cause without process evidence.
- Skipping escape cause.

## Related links / next step CTA

- [/help/5-why](/help/5-why)
- [/help/fishbone](/help/fishbone)
- [/help/corrective-action](/help/corrective-action)
