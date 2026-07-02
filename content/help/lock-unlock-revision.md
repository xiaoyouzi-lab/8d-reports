---
title: Lock / Unlock / Revision
slug: lock-unlock-revision
description: Lock approved records, unlock only with a revision reason, and track revision numbers for changed report packages.
type: help
status: ready-for-review
canonical_url: https://www.8d-reports.com/help/lock-unlock-revision
category: Team workflow
order: 14
target_keywords: ["Lock / Unlock / Revision","8D Reports help","8D report workflow"]
screenshots: ["/help-assets/lock-unlock-revision/revision.png"]
videos: []
related: ["/help/review-workflow","/help/permissions","/help/export-pdf-word-excel-zip"]
last_reviewed: 2026-07-01
---

## What this feature is

Locking prevents edits, attachment deletion, and signature replacement after a report reaches a controlled state. Unlock for revision creates a new revision number with a required reason.

## Why it matters

Revision control reduces confusion about which report was approved, submitted, or changed after customer feedback.

## When to use it

Use locking when a report is approved, submitted, or closed. Use unlock only when the owner needs to revise the record.

## Step-by-step operation

1. Open Workflow and activity.
2. Review the current revision and lock status.
3. If locked, enter a clear reason before unlocking.
4. Make the required change after the report is editable again.
5. Return the report through review and approval before resubmitting.

## Screenshot or video reference

See the page media reference for /help-assets/lock-unlock-revision/revision.png. If the asset needs to be refreshed, run the Playwright capture script in scripts/capture-help-assets with an authenticated storage state.

## Example content

Customer requests expanded validation evidence. Owner unlocks Rev.0 with reason, adds D6 evidence, and re-approves as Rev.1.

## Common mistakes

- Unlocking without a business reason.
- Editing a report after approval without changing revision history.
- Assuming viewers or editors can override owner workflow controls.

## Related links / next step CTA

- [/help/review-workflow](/help/review-workflow)
- [/help/permissions](/help/permissions)
- [/help/export-pdf-word-excel-zip](/help/export-pdf-word-excel-zip)
