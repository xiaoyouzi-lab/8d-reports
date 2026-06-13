# Current Task

## Task Name

Fix production export and AI user-facing issues found during manual testing.

## Background

Manual testing was performed on the production version.

Excel export was not visible because PR #3 had not yet been merged/deployed to production, so Excel visibility should be re-tested after PR #3 is merged.

However, the following production issues were confirmed:

1. Uploaded company logo does not appear in exported PDF reports.
2. Uploaded company logo does not appear in exported Word reports.
3. Word export has abnormal formatting in the 5-Why section.
4. AI Draft / AI self-evaluation result is displayed as raw code or raw structured output instead of a user-friendly visual result.
5. Another AI feature is visible but not usable, and its purpose is unclear to the user.

These issues damage product trust and must be fixed before adding new features.

## Goal

Fix the confirmed production usability issues in export and AI workflows.

The product should feel professional and understandable to a real quality engineer.

## Non-Goals

Do not change pricing rules.

Do not remove the $4.99 single-report export gate.

Do not change database schema unless absolutely necessary and explicitly justified.

Do not add new AI features.

Do not add customer-specific Excel templates.

Do not redesign the whole editor.

Do not refactor unrelated code.

## Scope

Likely affected areas:

- PDF export
- Word export
- logo upload / logo URL handling
- report editor parent component
- ExportMenu
- Word export generator
- AI Draft UI
- AI Quality Check / AI report review UI
- AI-related buttons and labels
- localization messages
- docs/DEV_LOG.md

## Requirements

### 1. Logo in PDF export

Uploaded company logo must appear in exported PDF reports when available.

Investigate:

- Whether logo upload stores the correct logo URL.
- Whether the editor receives the latest logo URL after upload.
- Whether ExportMenu receives `logoUrl`.
- Whether PDF export actually renders the logo.
- Whether logo URL is public or fetchable during export.
- Whether CORS / protected file access prevents rendering.

Expected behavior:

- Upload logo.
- Export PDF.
- Logo appears in the exported PDF.
- If logo cannot be loaded, export still succeeds and logs/fails gracefully.

### 2. Logo in Word export

Uploaded company logo must appear in exported Word reports when available.

Investigate:

- Whether Word export route receives `logoUrl`.
- Whether `generateWordDocument` actually inserts the logo.
- Whether remote logo image fetching works server-side.
- Whether private/protected logo URLs need conversion to accessible URLs.

Expected behavior:

- Upload logo.
- Export Word.
- Logo appears in the `.docx`.
- If logo cannot be loaded, export still succeeds and logs/fails gracefully.

### 3. Fix Word 5-Why formatting

The 5-Why section in Word export must be readable and professional.

Expected behavior:

- Why 1 to Why 5 are clearly separated.
- Labels are clear.
- Empty values do not break layout.
- Long text wraps normally.
- Chinese and English content display correctly.
- The section should use either a clean table or a clearly separated list.

### 4. Fix AI Draft / AI self-evaluation display

AI self-evaluation results must not be shown as raw JSON, raw code, markdown code block, or unformatted structured output.

Expected UI:

- Overall score or readiness level if available.
- Key issues.
- Missing evidence.
- Root cause logic concerns.
- Corrective action concerns.
- Suggested improvements.
- Customer rejection risk if available.
- Clear empty state.
- Clear error state.

If AI returns JSON, parse it and render it into cards/lists.

If AI returns markdown, render or normalize it safely.

If AI returns invalid structured output, show a friendly error and do not expose raw code to normal users.

Raw debug output may only be shown in development mode.

### 5. Audit unclear/broken AI feature

Find all visible AI entry points.

For each AI feature, document in `docs/DEV_LOG.md`:

- Feature/button name
- Page/location
- API route called
- Required permission
- Required environment variables
- Expected user-facing purpose
- Current status: works / broken / unclear / should hide

If a visible AI feature is broken or not ready, either:

- fix it,
- hide it behind beta gating,
- or rename it and add clear explanatory copy.

Do not leave broken or confusing AI buttons visible to normal users.

### 6. Re-test Excel after PR #3

If PR #3 is merged before this task, confirm that production shows Excel export after deployment.

If PR #3 is not merged yet, do not treat Excel absence in production as a bug. Document that Excel is pending PR #3 deployment.

## Acceptance Criteria

The task is complete only if:

- [ ] Uploaded logo appears in PDF export.
- [ ] Uploaded logo appears in Word export.
- [ ] Word 5-Why formatting is clean and readable.
- [ ] AI self-evaluation result is rendered visually, not as raw code.
- [ ] Broken or unclear AI entry points are fixed, hidden, or clearly explained.
- [ ] Free user Word export gate still works.
- [ ] Existing PDF export still works.
- [ ] Existing Word export still works.
- [ ] Excel export production status is documented after PR #3.
- [ ] Build/lint/type checks pass.
- [ ] docs/DEV_LOG.md is updated with root cause and verification notes.

## Manual Verification Required

After implementation, manually verify:

1. Logo:
   - Upload company logo.
   - Export PDF.
   - Confirm logo appears.
   - Export Word.
   - Confirm logo appears.

2. Word 5-Why:
   - Fill Why 1 to Why 5.
   - Export Word.
   - Confirm 5-Why section is readable.

3. AI:
   - Run AI Draft / AI self-evaluation.
   - Confirm result is visual and readable.
   - Confirm no raw JSON/code is shown.
   - Check the other AI feature and confirm it is usable, hidden, or clearly explained.

4. Export gates:
   - Free user Word export still shows $4.99 gate.
   - Pro/Team export still works.

## Risk Areas

- Logo URLs may be private or inaccessible during export.
- Word export image insertion may require binary image fetching.
- AI response formats may vary.
- Fixing AI display should not weaken conservative AI behavior.
- Excel visibility depends on whether PR #3 has been merged and deployed.

## Completion Report Required

Update `docs/DEV_LOG.md` with:

- changed files
- root cause for each issue
- fixes implemented
- checks run
- manual verification checklist
- unresolved risks
- suggested next task