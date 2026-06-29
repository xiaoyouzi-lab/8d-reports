# Current Task

## Task Name

Authenticated Smoke Workflow Diagnostics Hotfix.

## Context

PR #10 added Authenticated Smoke Test Infrastructure v1. The first default-branch workflow validation created and cleaned up its temporary Neon branch, but the browser smoke failed with an opaque Playwright timeout and did not upload a smoke result artifact.

That run also exposed a logging risk: the workflow generated `BETTER_AUTH_SECRET` at runtime and wrote it to `$GITHUB_ENV` before masking it. This task hardens diagnostics and masking only.

## Goal

Hotfix the authenticated smoke workflow and browser smoke so failures are safe, diagnosable, and artifact-backed before the workflow is relied on for future authenticated feature PRs.

## Scope

- Mask runtime-generated `BETTER_AUTH_SECRET` before writing it to `$GITHUB_ENV`.
- Keep upload of `output/authenticated-smoke-result.json` on `if: always()`.
- Make the authenticated browser smoke write a bounded, redacted failure artifact before exiting.
- Add named smoke steps, completed-step tracking, failed-step tracking, and safer timeout messages with redacted body excerpts.
- Document the masking and failure artifact guarantees.
- Add governance checks so diagnostics, artifact redaction, and cleanup behavior do not regress.
- Re-run the authenticated smoke workflow against the hotfix branch after the hotfix PR is created.

## Non-Goals

- No production data writes.
- No production test users or reports.
- No product feature changes.
- No public marketing changes.
- No payment, subscription, checkout, export, AI, auth production behavior, or Knowledge Base search logic changes.
- No permanent database schema migration.
- No change to smoke fixture eligibility rules unless a real fixture bug is found and called out first.

## Acceptance Criteria

- `BETTER_AUTH_SECRET` is masked before being written to `$GITHUB_ENV`.
- The browser smoke writes `output/authenticated-smoke-result.json` on failure and success.
- Failure artifacts include `failedStep`, `completedSteps`, high-level check statuses, current URL, bounded redacted error text, and captured analytics event names/counts.
- Failure artifacts and logs do not include full database URLs, passwords, tokens, cookies, raw search queries, report content, customer/product names, root cause, corrective action, lessons learned, or batch values.
- `npm run smoke:auth` without `SMOKE_DB=true` fails closed and writes a safe failure artifact.
- Workflow cleanup still deletes the temporary Neon branch with `if: always()`.
- `docs/AUTHENTICATED_SMOKE_TESTING.md` documents masking and failure diagnostics.
- Governance tests protect the masking, artifact, diagnostics, and cleanup guarantees.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.
- Hotfix branch workflow run is triggered and inspected after PR creation.

## Risks

- The app smoke may still fail on an actual UI assertion after diagnostics are improved; that should be reported as an app-smoke failure rather than hidden by missing artifacts.
- GitHub or Neon outages can still affect cleanup, so the run must be inspected for deletion.
- Logs from earlier workflow attempts may remain visible in GitHub history; this hotfix prevents new unmasked runtime secrets from being emitted.
