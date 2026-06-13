# Acceptance Checklist

Use this checklist before considering a task complete. Mark items as pass, fail, blocked, or not applicable.

## Product

- The change supports the 8D Reports product direction.
- The change does not invent unsupported product claims.
- The change preserves existing public routes and SEO intent unless explicitly scoped.
- The change is appropriate for quality engineers, supplier quality engineers, manufacturing teams, and complaint handlers.

## Functionality

- The requested workflow works for the intended user role.
- Existing report creation, editing, sharing, workflow, and export behavior is preserved unless explicitly changed.
- Edge cases are handled with friendly errors or safe fallbacks.
- Locked reports and role permissions are respected where relevant.

## AI

- AI behavior is conservative and does not invent evidence.
- Missing evidence is represented as "No relevant data" or equivalent wording.
- AI output does not approve, certify, or make unsupported compliance claims.
- AI routes respect server-side authorization and report lock status where relevant.

## Data / Security

- No secrets, API keys, cookies, passwords, database URLs, or private tokens are committed.
- Auth, payment, database schema, environment variables, export logic, and production configuration were not changed unless explicitly required.
- Server-side permission checks protect sensitive or edit-like actions.
- User-facing errors do not expose stack traces, provider errors, secrets, or internal details.

## UX

- The UI remains clear for Owner, Editor, Viewer, Free, Pro, and Team users where relevant.
- Empty, loading, error, and read-only states are understandable.
- Mobile and desktop layouts remain usable.
- User copy is accurate and does not overpromise.

## Engineering

- The change is small, safe, and reviewable.
- Existing local patterns and helpers are reused.
- Tests or checks were run at a level appropriate to the risk.
- `docs/DEV_LOG.md` was updated.
- Completion report includes changed files, tests/checks run, risks, unfinished items, and suggested next task.
