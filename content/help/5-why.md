---
title: 5-Why
slug: 5-why
description: Use the D4 5-Why table to connect the problem to a verified process or system cause.
type: help
status: ready-for-review
canonical_url: https://www.8d-reports.com/help/5-why
category: Root cause tools
order: 6
target_keywords: ["5-Why","8D Reports help","8D report workflow"]
screenshots: ["/help-assets/5-why/five-why.png"]
videos: []
related: ["/help/root-cause","/help/fishbone","/help/corrective-action"]
last_reviewed: 2026-07-01
---

## What this feature is

The 5-Why section helps the team document a cause chain in D4. It is a thinking aid, not a replacement for evidence.

## Why it matters

Many weak reports stop at operator error. A disciplined 5-Why chain pushes toward process controls, detection gaps, and system causes.

## When to use it

Use it when the team needs a concise cause chain for a customer complaint, supplier issue, or internal defect.

## Step-by-step operation

1. Open D4 Root Cause in the editor.
2. Write the first why answer based on the observed defect.
3. Continue only as far as evidence supports the chain.
4. Separate occurrence cause from escape cause in the final root-cause fields.
5. Attach supporting evidence when the chain depends on test results, logs, or inspection records.

## Screenshot or video reference

See the page media reference for /help-assets/5-why/five-why.png. If the asset needs to be refreshed, run the Playwright capture script in scripts/capture-help-assets with an authenticated storage state.

## Example content

Why did coating peel? Adhesion was weak. Why? Fixture residue remained after line change. Why? Cleaning sign-off was skipped before restart.

## Common mistakes

- Forcing exactly five levels when evidence stops earlier.
- Ending at a person instead of a process condition.
- Mixing occurrence cause and escape cause into one sentence.

## Related links / next step CTA

- [/help/root-cause](/help/root-cause)
- [/help/fishbone](/help/fishbone)
- [/help/corrective-action](/help/corrective-action)
