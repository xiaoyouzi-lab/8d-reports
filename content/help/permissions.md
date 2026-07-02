---
title: Owner / Editor / Viewer permissions
slug: permissions
description: Use Owner, Editor, and Viewer roles to control who can manage workflow, edit report content, or view records.
type: help
status: ready-for-review
canonical_url: https://www.8d-reports.com/help/permissions
category: Team workflow
order: 16
target_keywords: ["Owner / Editor / Viewer permissions","8D Reports help","8D report workflow"]
screenshots: ["/help-assets/permissions/roles.png"]
videos: []
related: ["/help/team-workspace","/help/share-link","/help/lock-unlock-revision"]
last_reviewed: 2026-07-01
---

## What this feature is

Permissions separate control from contribution. Owners manage workflow and roles, editors prepare report content, and viewers inspect without editing.

## Why it matters

Role clarity protects locked reports, prevents accidental changes, and keeps customer-facing records controlled.

## When to use it

Use permissions whenever a team member, supplier, customer, or manager needs access that differs from the report owner.

## Step-by-step operation

1. Open Team workspace controls.
2. Assign Owner for the person accountable for report control.
3. Assign Editor for contributors who should update fields or evidence.
4. Assign Viewer for read-only review.
5. Revisit roles when an issue moves from drafting to approval.

## Screenshot or video reference

See the page media reference for /help-assets/permissions/roles.png. If the asset needs to be refreshed, run the Playwright capture script in scripts/capture-help-assets with an authenticated storage state.

## Example content

A process engineer is an editor during D4-D6, while a plant manager is a viewer before approval.

## Common mistakes

- Using Owner for everyone.
- Giving edit access through share links when view-only review is enough.
- Forgetting that locked reports block edit-like actions.

## Related links / next step CTA

- [/help/team-workspace](/help/team-workspace)
- [/help/share-link](/help/share-link)
- [/help/lock-unlock-revision](/help/lock-unlock-revision)
