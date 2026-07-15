# Quality Case Guided Experience Audit and Migration Plan

Last reviewed: 2026-07-10

This plan implements the requested **AI Quality Engineer** experience without
replacing the existing 8D editor. Quality Case remains the workflow object;
8D and the other report types remain outputs.

## Current-state audit

### Quality Case structure

- `quality_cases` already owns status, responsible user, deadline, version,
  internal case data, and output type.
- Participant, task-link, evidence, activity, version, output, and bilingual
  text tables are additive and already separate external task authorization
  from legacy report shares.
- Guided answers do **not** yet have a first-class model. The supplier task is
  a single Chinese free-text response, which assumes the supplier can organize
  root cause, containment, corrective action, and validation without help.
- `caseData` is intentionally flexible but is not sufficient as the only
  durable audit model for individual guided answers, coaching feedback, or
  prompt versions.

### Report-field mapping

The legacy 8D output fields are a usable expert-mode/output mapping:

| Guided question | Existing 8D fields | Output discipline |
| --- | --- | --- |
| What happened / where / when / quantity | `problemDescription`, `whereFound`, `whenFound`, `productName`, `batchNumber`, `defectQuantity`, `totalQuantity` | Preserve source facts; missing values remain missing. |
| What was done immediately | `containmentDescription`, `containmentScope`, `containmentResponsible`, `containmentDueDate`, `containmentVerification` | Do not infer completion or effectiveness. |
| Why could it happen | `rootCauseOccurrence`, `why1`–`why5`, `confirmedRootCause` | A direct cause such as “operator error” is insufficient until the system condition is explored. |
| Why was it not detected | `rootCauseEscape`, `fishboneMeasurement`, `testingPlan`, `testingResults` | Do not invent inspection/test evidence. |
| What prevents recurrence | `selectedCorrectiveAction`, `implementationPlan`, `systemChanges`, `processUpdates`, `horizontalDeployment` | Training alone is flagged as a weak preventive response, not rejected as a fact. |
| How effectiveness will be checked | `validationMethod`, `validationResults` | A plan is distinct from actual results. |

Existing Quality Case bilingual fields already map controlled D2–D8 narrative
content into English/bilingual outputs and deliberately exclude AI-only drafts.

### AI audit

- `POST /api/ai/draft-report` is beta-gated, report-scoped, editable-draft
  generation. It is not a guided interview.
- `POST /api/ai/report-review` is a conservative beta quality check over a
  legacy report, with historical-context safeguards.
- The floating Quality Expert chat is general advice; it has no Case state,
  no field ownership, no answer audit, and must not become the guided workflow.
- Existing DeepSeek JSON prompts prohibit fabricated evidence, approvals,
  dates, and test results. That principle must remain mandatory for the new
  Quality Coach and customer-simulation prompts.

### Permission audit

- Internal Case access is constrained to existing active Team Owner/Editor/
  Viewer boundaries. Viewers cannot edit; Owner/Editor workflow capabilities
  are already server-checked.
- Supplier/customer access is a separate hashed, expiring, revocable task
  token with an allowlist projection. It must remain separate from legacy
  report shares.
- Customer content is frozen as an authorized, human-confirmed English
  snapshot. Guided answers, coach feedback, internal notes, AI risk data,
  commercial data, and other supplier data must never enter a customer task.

## Product decision

### Guided Mode (default)

Guided Mode asks everyday questions in Chinese for a supplier task and avoids
displaying D-step labels, 5 Why, Fishbone, CAPA, or Poka-Yoke as prerequisites.
It presents one investigation stage at a time, shows progress, explains why a
follow-up is needed in plain language, and offers “switch to Expert Mode” at
any point.

The Quality Coach is a structured assessor, not a free-form approval bot. It
may identify missing facts, weak causal explanations, weak prevention, and
insufficient validation plans. It may never create evidence, certify a result,
submit a task, approve a Case, accept a customer response, close, or reopen a
Case.

### Expert Mode

Expert Mode preserves the existing Quality Case detail, bilingual editor,
workflow controls, evidence review, 8D adapter, generic output adapter, and
legacy 8D report editor. It is an explicit alternate view over the same Case,
not a data migration or duplicate Case.

## Additive migration plan

1. **PR-G1 — Domain contract and mapping (no database write).** Add pure
   guided-stage, question, answer-quality, completion, and report-field mapping
   contracts with deterministic tests. No routes or UI change.
2. **PR-G2 — Additive guided persistence.** Add `quality_case_guidance_sessions`
   and `quality_case_guidance_answers`, each scoped to a Case, plus actor,
   prompt-version, source/AI/confirmed distinction, timestamps, and indexes.
   Do not change legacy report tables, users, payment, shares, exports, or
   existing Case task columns. Extend the disposable migration rehearsal.
3. **PR-G3 — Server-authorized coach.** Add Case/task-scoped endpoints that
   validate access, bound input, store only confirmed human answers separately
   from AI coaching, and invoke a schema-validated conservative Quality Coach.
   AI output is advisory and has no workflow action capability.
4. **PR-G4 — Guided supplier surface.** Make Guided Mode the default supplier
   task experience; preserve the current free-text/expert response as the
   Expert Mode fallback. Add stage progress, understandable questions, coach
   feedback, evidence upload, completion guard, and a clear Expert Mode switch.
5. **PR-G5 — Internal guided workspace and customer simulation.** Add guided
   progress/coaching to internal Case detail, human confirmation controls,
   customer-simulation review, and the approved-answer → existing output map.
   Customer external links remain unchanged except for their existing
   human-confirmed authorization snapshot.
6. **PR-G6 — Release verification.** Add disposable-database and browser smoke
   coverage for a non-8D supplier completing a Guided Case, return/revision,
   customer simulation, output generation, customer task, and isolation.
   Run only after temporary Neon/R2/auth smoke configuration is supplied.

Each PR is independently revertible: feature-gate the new Guided UI; retain
Expert Mode and the original legacy 8D editor; make persistence additive; and
roll back by disabling Guided Mode rather than deleting Case data.

## Permission impact

| Actor | Guided capability | Explicitly cannot do |
| --- | --- | --- |
| Coordinator / Owner | create Case, choose mode, invite supplier, review/confirm guided content, simulate customer review, manage workflow | let AI approve/close; expose internal data externally |
| Internal Editor | complete/review permitted guided stages under existing workspace access | create external task if current policy reserves it for coordinator; close if not authorized |
| Internal Viewer | read guided progress and audit only | edit answers, request AI, assign tasks, transition workflow |
| Supplier Guest | answer only the assigned Chinese guided task and upload allowed evidence | see internal notes, coach risk, commercial data, other Cases, customer content, or transition outside supplier submission |
| Customer Guest | review only the human-authorized English snapshot and request change/accept | see guided scratchpad/AI draft/internal data, close Case |

## Acceptance evidence required

The release is not complete until a browser smoke proves a new supplier can
open an invitation, understand and answer non-technical questions, receive
plain-language coaching, revise weak answers, submit a structured response,
and leave the coordinator with a customer-ready authorized output. The test
must additionally prove AI cannot transition or approve the Case and that an
external guest cannot read internal guidance or another supplier's data.

## Requested deliverables mapping

- User flow and page comparison: implemented in the PR-G4/PR-G5 design spec.
- Guided/Expert screenshots: captured during browser verification after their
  feature-gated UI exists.
- Prompt design: versioned, schema-validated Quality Coach spec in PR-G3.
- Field mapping: table above plus tested contract in PR-G1.
- Permission analysis: table above plus server tests in PR-G3/PR-G6.
- Commercial risk: keep the claim to “AI Quality Engineer assists” and never
  promise engineering approval, customer acceptance, or a full QMS.
