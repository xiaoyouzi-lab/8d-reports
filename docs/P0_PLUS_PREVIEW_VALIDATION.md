# P0+ Preview Validation

This checklist is for local and Vercel Preview validation of the P0+ minimum loop:

Homepage guest natural-language intake -> AI quality expert draft -> AI readiness check -> next-step guidance -> signed-in confirmation -> editable report creation.

PR5 does not enable production traffic and does not add new product behavior. It documents how to validate the existing PR1-PR4 flow safely.

## Preconditions

- Confirm PR1-PR4 are merged into the branch being validated:
  - PR1: AI expert schema, prompts, mapper, deterministic fixtures.
  - PR2: guest preview API, temporary preview storage, anonymous rate limiting.
  - PR3: homepage intake and read-only preview UI behind `P0_PLUS_PREVIEW_ENABLED`.
  - PR4: login handoff, authenticated confirmation, conversion to formal report with conversion claims.
- Confirm database migrations have run in the target environment:
  - `drizzle/0006_p0_plus_previews.sql`
  - `drizzle/0007_p0_plus_preview_conversion_claim.sql`
- Confirm `P0_PLUS_PREVIEW_ENABLED` is default-off. An unset value, empty value, or any value other than `1`, `true`, or `yes` keeps the flow disabled.
- Do not enable the feature in production during PR5 validation.

## Required Env For Local Or Preview Testing

- `P0_PLUS_PREVIEW_ENABLED=true` only in the local shell or a temporary Vercel Preview environment selected for validation.
- `DEEPSEEK_API_KEY` or the current AI provider configuration used by the project.
- `P0_PLUS_PREVIEW_HASH_SECRET` is recommended so preview token hashes do not rely on the local fallback secret.
- `DATABASE_URL` and auth environment variables must follow the existing project setup for report creation and login.
- Do not add or change Vercel Production environment variables for this PR.

## Local Validation Steps

1. With `P0_PLUS_PREVIEW_ENABLED` unset, start the app and visit `/`.
2. Confirm the homepage keeps the existing experience and does not show the P0+ intake.
3. Restart or run locally with `P0_PLUS_PREVIEW_ENABLED=true`.
4. Visit `/` and confirm the first screen shows the large P0+ intake textarea.
5. Paste an injection-molding flash case, for example: production line found flash or excess material on an injection molded part, supplier mentioned, photos mentioned, lot or batch uncertain, defect quantity missing.
6. Click `Generate 8D Draft`.
7. Confirm the browser navigates to `/p0-plus/preview/[token]`.
8. Confirm the preview page is read-only.
9. Confirm the page displays `Case Summary`, `D0-D8 Draft Preview`, `Readiness Check`, `Missing Information`, `Required Evidence`, `Clarification Questions`, and `Next Actions`.
10. Confirm there are no edit, save, export, share, or upload controls.
11. Click `Sign in to edit and export`.
12. When signed out, confirm the app redirects to `/login` with a callback to `/p0-plus/continue/[token]`.
13. Sign in with a test account and confirm the callback opens `/p0-plus/continue/[token]`.
14. Confirm loading the GET continuation page does not create a report.
15. Click `Create editable report`.
16. Confirm the app enters `/reports/[id]`.
17. Confirm the created report contains only safe `provided` or `extracted` fields from the preview and does not write `missing`, `needs_confirmation`, `inferred`, or `conflicting` values as facts.
18. Repeat the conversion action or POST the conversion endpoint again and confirm a second report is not created.
19. Turn `P0_PLUS_PREVIEW_ENABLED` off again and confirm the homepage entry is hidden.

## Preview Environment Validation Steps

1. Create or select a non-production Vercel Preview deployment for the PR branch.
2. In that Preview environment only, temporarily set `P0_PLUS_PREVIEW_ENABLED=true`.
3. Add the same AI provider, `P0_PLUS_PREVIEW_HASH_SECRET`, `DATABASE_URL`, and auth configuration required by the existing project.
4. Confirm migrations `0006_p0_plus_previews.sql` and `0007_p0_plus_preview_conversion_claim.sql` have been applied to the Preview database before testing.
5. Use a test account, not a production customer account, for the login and conversion path.
6. Run the local validation path against the Preview URL.
7. Confirm converted reports follow normal authenticated report creation boundaries, including quota and role checks.
8. After validation, remove or set `P0_PLUS_PREVIEW_ENABLED=false` in the Preview environment.
9. Do not enable `P0_PLUS_PREVIEW_ENABLED` in production.

## Rollback Plan

- Turn off `P0_PLUS_PREVIEW_ENABLED` to hide the homepage entry and make the preview/continue routes unavailable.
- No code rollback is required to close the user entry point.
- Preview rows expire after 24 hours.
- Production remains closed until the feature is deliberately enabled in a later release decision.

## Data And Privacy Notes

- Guest raw input is bounded before storage and is not exported.
- Preview tokens are returned to the browser, but token plaintext is not stored in the database.
- Only preview token hashes are stored in `p0_plus_previews`.
- Guest preview generation does not read private reports, team data, report history, or private knowledge context.
- Conversion writes only sanitized `provided` and `extracted` fields into the formal report.
- `missing`, `needs_confirmation`, `inferred`, and `conflicting` values are not written as formal report facts.
- Preview responses must not expose user id, team id, report id, share token, export URL, or private attachment URLs.

## Expired Preview Cleanup

- There is no automatic scheduled cleanup job for expired P0+ previews yet.
- Current runtime lookups require `expires_at` to be in the future, so expired preview tokens fail safely.
- TODO: add a scheduled cleanup job to delete expired preview rows after product validation confirms retention requirements.
- PR5 intentionally does not implement cleanup because the feature remains default-disabled and the validation goal is smoke coverage, not background operations.

## Coverage Matrix

| Area | Covered by test | Covered by manual validation | Not covered / future |
| --- | --- | --- | --- |
| AI schema | `npm run test:p0-plus` validates schema, source statuses, readiness checks, fixtures, and prompt bans. | Review generated draft quality in local/Preview with real provider config. | Provider-specific quality scoring remains manual. |
| Preview API | `npm run test:p0-plus-preview` covers disabled API, valid mock preview, unknown and expired tokens. | Submit a real guest preview in local/Preview. | Production traffic is not enabled. |
| Rate limit | `npm run test:p0-plus-preview` covers rate-limited requests before AI. | Manually verify friendly error copy if a limit is hit. | Durable distributed rate limiting can be revisited later. |
| Preview UI | `npm run test:p0-plus-ui` covers disabled and enabled homepage rendering. | Confirm first-screen intake and CTA behavior in browser. | Visual polish remains review-based. |
| Read-only preview | `npm run test:p0-plus-ui` renders preview content and forbids save/export/share/upload text. | Confirm no edit/save/export/share/upload controls in browser. | Attachment preview is not in scope. |
| Login callback | `npm run test:p0-plus-ui` and `npx tsx src/lib/p0-plus/convert.test.ts` cover encoded local callback paths. | Signed-out click should route through login and return to continue page. | Third-party auth provider edge cases remain manual. |
| Confirmation page | `npx tsx src/lib/p0-plus/convert.test.ts` covers continuation state without report creation. | Confirm GET `/p0-plus/continue/[token]` does not create a report. | Copy review remains manual. |
| Conversion auth | `npx tsx src/lib/p0-plus/convert.test.ts` covers guest conversion rejection and authenticated conversion. | Confirm signed-in test account can create a report from confirmation page. | Role/plan edge cases rely on formal report creation checks. |
| Conversion idempotency | `npx tsx src/lib/p0-plus/convert.test.ts` covers repeat conversion and conversion claim behavior. | Double-click or repeat POST should not create a duplicate report. | Observability for rare orphan reports can be added later. |
| Mapper sanitize | `npm run test:p0-plus` and `npx tsx src/lib/p0-plus/convert.test.ts` cover unsafe and unverified field rejection. | Inspect created report fields after conversion. | Additional field mappings require future fixture updates. |
| Report creation quota | `npx tsx src/lib/p0-plus/convert.test.ts` covers creation failure behavior and claim cleanup. | Validate with an appropriate test account if quota behavior needs signoff. | No quota policy changes in PR5. |
| No export/share/payment/team changes | PR diff review should show no export, share, payment, team, or editor template files. | Confirm preview UI has no export/share controls. | Full regression remains covered by existing product test strategy. |
