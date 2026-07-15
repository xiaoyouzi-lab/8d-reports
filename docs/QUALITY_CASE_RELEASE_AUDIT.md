# Quality Case Release Audit

Last reviewed: 2026-07-10

This is evidence for the Quality Case platform release decision. A build or
unit test is not treated as proof of production readiness. The existing 8D
report, auth, payment, share, and export surfaces remain separate compatibility
surfaces and are not migration targets.

| Requirement | Current implementation evidence | Verification status | Release gate |
| --- | --- | --- | --- |
| Twelve Case states and Customer Accepted ≠ Closed | `src/lib/quality-cases/contract.ts`; contract tests | Code and deterministic tests passed | Run disposable-browser workflow smoke |
| Current state, waiting party, next action, owner, due date, overdue signal | Case workspace/detail and queue summary components | Type/build checked; local public/UI checks only | Authenticated smoke and role review |
| Versioned approval/return/accept/close/reopen audit | `quality_case_versions`, `quality_case_activities`, service transitions, internal timeline | Code and targeted tests passed | Verify persisted activities on temporary branch |
| Actor, organization, comment, fields, due date, diff, evidence | Internal activity projection and `QualityCaseDetail` timeline | Type/targeted tests passed | Verify with seeded evidence on temporary branch |
| Supplier task without registration and Chinese UI | hashed expiring/revocable task links; `/supplier/[token]` | Code/security tests passed | Browser smoke with real R2-compatible upload |
| English customer review with least privilege | customer task authorization snapshot (`0010`), confirmed-English gate, `/customer-review/[token]` | Code/output/external-task tests passed | Browser smoke validates no draft/raw supplier leak |
| External account claim | completed task claim endpoint and signup callback to `/cases?claimTask=…` | Code inspection only | Authenticated signup + claim smoke |
| Source, AI draft, confirmed translation are distinct | `quality_case_texts`, bilingual editor, output content selector | Output tests passed | Verify persistence on temporary branch |
| English/bilingual output only uses confirmed English | 8D adapter and generic non-8D DOCX output | Unit DOCX/output tests passed | Pro/Team browser download smoke |
| Complaint paste/upload → preview → Case | P0+ feature-gated preview, text/DOCX local extraction, authenticated Case conversion | P0+ tests and local visual check passed | Provider-backed Preview validation; no live AI call yet |
| Dashboard queue focus | `DashboardQualityCaseSummary`, bilingual dashboard/app shell | Build and local visual check passed | Authenticated queue-count smoke |
| Existing report/export/payment compatibility | additive tables, separate output adapter, no legacy route/table alteration | Static migration gate and production build passed | Regression smoke against disposable data; payment remains untouched |
| Additive migration safety | `0008`, `0009`, `0010`; static migration test; manual temporary-Neon workflow | Static gate passed; live rehearsal not run | Configure/run `authenticated-smoke` workflow |
| Production launch | no migration/flag/production write performed | Not started by design | All previous gates, reviewed artifact, staged enablement approval |

## Known limitations intentionally not hidden

- P0+ imports text and the main text of `.docx` locally; it does not claim PDF
  parsing, image OCR, layout preservation, malware scanning, or attachment
  retention.
- Non-8D outputs are controlled generic DOCX responses, not customer-specific
  SCAR/CAR/CAPA layouts or an evidence-package builder.
- A customer task created before migration `0010` has no authorization
  snapshot and fails safely; the coordinator must revoke and reissue it after
  confirming English content.
- No production migration, feature-flag enablement, Neon branch, R2 upload,
  real AI request, payment write, or production customer/supplier task has
  been executed in this workspace.

## Required release sequence

1. Create the manual temporary Neon branch using the existing authenticated
   smoke workflow configuration; do not substitute a local `.env` or parent
   branch.
2. Run the reset, baseline schema initialization, `0008`–`0010` initial and
   idempotent migration rehearsal, fixture seed, and Quality Case browser
   smoke. Review its redacted artifact before branch deletion.
3. Confirm R2-compatible supplier evidence upload/download and completed-task
   account claim with dedicated disposable credentials.
4. Enable the P0+ feature only in a Preview environment, submit an explicitly
   synthetic complaint, and verify the conservative AI response and Case
   conversion. Do not use a real customer complaint for this test.
5. Create a backup/rollback record, run the additive migration in the approved
   production release window, and enable flags gradually. Monitor task errors,
   unavailable-link rate, and Case workflow failures. Roll back flags first;
   do not drop Quality Case tables as a rollback action.
