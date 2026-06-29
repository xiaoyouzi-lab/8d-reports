# Current Task

## Task Name

Authenticated Smoke Test Infrastructure v1.

## Context

PR #8 added Quality Knowledge Base v1. PR #9 improved authenticated app discoverability. Both PRs revealed that logged-in browser validation is too dependent on one-off local setup or manual production checks.

The product needs a safe, repeatable authenticated smoke test path for future PRs. The smoke path must verify logged-in features without writing to production data or requiring a human to create production test reports.

## Goal

Create authenticated smoke test infrastructure that can be run by GitHub Actions or a local developer against an explicitly safe temporary database.

## Scope

- Add a manual GitHub Actions workflow for authenticated smoke testing.
- Use `NEON_API_KEY` to create a temporary Neon branch.
- Reset the temporary branch schema before seeding.
- Initialize schema with Drizzle.
- Seed smoke users, Team workspace, and reports covering eligible and excluded Knowledge Base states.
- Start a local Next app.
- Run Playwright authenticated browser smoke.
- Verify unauthenticated security boundaries.
- Verify logged-in Dashboard, Knowledge Base, report workflow panel, search, filters, copy actions, access boundaries, mobile layout, and safe analytics metadata.
- Delete the temporary Neon branch whether the workflow succeeds or fails.
- Document required secrets/vars, safety gates, fixtures, and local run rules.
- Add governance checks to keep the workflow, scripts, docs, and safety boundaries from regressing.

## Non-Goals

- No production data writes.
- No production test users or reports.
- No automatic privileged `pull_request` workflow.
- No product feature changes.
- No public marketing changes.
- No payment, subscription, checkout, export, AI, auth production behavior, or Knowledge Base search logic changes.
- No permanent database schema migration.

## Acceptance Criteria

- `.github/workflows/authenticated-smoke.yml` exists and is `workflow_dispatch` only.
- Workflow requires `NEON_API_KEY` and explicit Neon project/parent/database vars.
- Workflow creates an `auth-smoke-*` temporary Neon branch.
- Workflow resets the cloned branch schema before `drizzle-kit push`.
- Workflow seeds smoke users, Team membership, completed/closed reports, draft/in-progress/internal-review exclusions, outsider data, and Team member accessible data.
- Workflow runs Playwright authenticated smoke against local Next app.
- Workflow cleanup deletes the temporary Neon branch with `if: always()`.
- Smoke scripts fail closed unless `SMOKE_DB=true` and an explicit safe smoke/test/preview/local database or branch is present.
- Scripts do not load `.env` implicitly and do not print full database URLs, passwords, tokens, cookies, or secrets.
- Smoke verifies safe analytics metadata for app navigation, dashboard feature-entry clicks, and Knowledge Base events.
- `docs/AUTHENTICATED_SMOKE_TESTING.md` documents operation and safety.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.

## Risks

- Neon API cleanup could fail during a platform outage, leaving a temporary branch to delete manually.
- The workflow is intentionally manual because it uses privileged secrets.
- The browser smoke depends on current UI labels and may need updates when authenticated navigation or Knowledge Base UI changes intentionally.
