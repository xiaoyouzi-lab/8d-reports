# Current Task

## Task Name

Authenticated App Feature Discoverability v1.

## Context

PR #7 completed the public SaaS redesign. PR #8 added Quality Knowledge Base v1 and deployed it to production. After logging in, the Knowledge Base is currently too hard to discover because the main entry point is inside the user avatar menu.

The app should make its core logged-in workflow clearer immediately after sign-in:

- Create an 8D report.
- Complete and close the corrective-action workflow.
- Reuse completed-report knowledge through the Quality Knowledge Base.

## Goal

Improve the logged-in app experience so users can quickly understand:

- What they can do now.
- Which authenticated app features matter most.
- Why the Quality Knowledge Base is valuable.
- How report creation leads to completed reports and reusable quality knowledge.

## Scope

- Add persistent authenticated app navigation for Reports, Knowledge Base, and New Report.
- Keep Knowledge Base discoverable on mobile without requiring the avatar menu.
- Keep the authenticated app logo inside the logged-in workspace by routing it to `/dashboard`.
- Add dashboard guidance that connects report creation, completion/closure, and Knowledge Base reuse.
- Add an explicit Knowledge Base action near normal report workflow controls.
- Add an internal feature discoverability audit with stage full-score criteria, current score, remaining gaps, and future-only items.
- Add safe authenticated app analytics for navigation and dashboard feature-entry clicks.
- Clarify Dashboard metric labels so visible counts match the underlying data.
- Preserve existing report creation, editing, sharing, workflow, export, payment, AI, auth, and public marketing behavior.

## Non-Goals

- No public marketing redesign.
- No new product feature beyond discoverability and navigation.
- No AI changes.
- No payment, checkout, subscription, pricing, or export changes.
- No auth or database schema changes.
- No Knowledge Base search logic changes.
- No production configuration changes.

## Acceptance Criteria

- Logged-in header exposes primary navigation outside the avatar menu.
- Dashboard, Knowledge Base, and New Report are visible as authenticated app actions.
- Authenticated app logo routes to `/dashboard`, not the public homepage.
- Mobile logged-in navigation exposes Knowledge Base without relying on the avatar menu.
- Dashboard first screen explains the create -> complete -> reuse workflow.
- Dashboard includes a visible Knowledge Base link near report workflow controls.
- Empty-report onboarding explains that completed reports become reusable knowledge assets.
- `docs/AUTHENTICATED_APP_DISCOVERABILITY_AUDIT.md` documents stage full-score standards, a 12-feature logged-in audit, features that meet the PR #9 target, acceptable non-primary items, future-only items, safe analytics, and the ready-to-merge checklist.
- App navigation and dashboard feature-entry clicks use safe analytics metadata only.
- Dashboard counts use labels that match their data semantics.
- Existing report list, Team workspace, search, workflow status, quota, and upgrade surfaces remain usable.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.

## Risks

- Header navigation could become crowded on smaller screens.
- Dashboard guidance could feel too promotional if it is not compact and work-oriented.
- Adding new copy must not overpromise unsupported QMS, AI, or automation features.
