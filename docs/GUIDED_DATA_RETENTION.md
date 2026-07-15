# Guided Investigation Data Retention

Status: PR-G2 technical retention contract
Last updated: 2026-07-10

Guided Mode stores an auditable quality investigation, not an unconstrained
chat log. The final legal retention period remains the organization's
responsibility and may be longer where customer contracts or regulations
require it. This PR adds no automatic deletion job.

## Retention classes

| Class | Records | Retention rule | External visibility |
| --- | --- | --- | --- |
| `case_audit` (permanent for the Case lifetime) | Session identity, question snapshots, every original-answer revision, AI run response/prompt identifier/version/input hash/confidence/source/time, insights, evidence requirements, confirmations, and mapping decisions. | Never automatically purged while the Case exists; retained after Case closure. Deleting a Case under an approved organization policy cascades its ledger. | Internal only; never part of customer task snapshots. |
| `closed_case_retained` | A closed Case's complete investigation ledger. | Product default target is at least seven years after closure; `retain_until` supports an organization-approved longer period. PR-G2 records policy metadata but does not schedule deletion. | Internal only. |
| `temporary_session` | Browser-only typing buffers, retry/idempotency state, and abandoned UI navigation state that contains no quality fact, AI response, or confirmation. | Not persisted in the audit ledger. If a later implementation persists such state, it must set `temporary_expires_at` and purge it safely. | Never customer-visible. |

## Integrity rules

- A user edit appends a `quality_case_guidance_answers` revision. It does not
  overwrite `original_text`; `answer_group_id`, `revision`,
  `supersedes_answer_id`, actor, and timestamp provide the modification trace.
- Every model response is a `quality_case_guidance_ai_runs` record with prompt
  identifier/version, input hash, response, confidence, source type, model
  identifier if available, policy outcome, and generated time. Investigator,
  Reviewer, and Customer Simulator runs are distinguished by `agent_type`.
- Insights are advisory children of an AI run. They cannot become a report
  field or workflow transition.
- A report/output write is deliberately absent from this schema. The only
  bridge is a human confirmation followed by a semantic field-mapping decision;
  a later authorized service must create the actual output change and audit it.
- Customer snapshots continue to use their existing human-confirmed output
  authorization path. They never join this ledger.

## Operational deletion and rollback

- The PR-G2 rollback migration drops only the eight new Guided ledger tables,
  in dependency order. It does not alter `quality_cases`, legacy reports,
  users, permissions, exports, shares, payments, or prior Quality Case tables.
- A rollback is permitted only before Guided data is relied on for an active
  investigation, or after an approved export/archive process. The rehearsal
  proves schema reversibility on an empty disposable branch; it is not a data
  retention deletion mechanism.
- Any future purge workflow must be separately approved, authorization-logged,
  scoped to closed Cases past `retain_until`, and tested only against a
  disposable database before release.
