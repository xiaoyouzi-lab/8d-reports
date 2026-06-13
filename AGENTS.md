<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Long-Term Codex Instructions

Before starting work, read:

- `docs/PRODUCT_CONTEXT.md`
- `docs/CURRENT_TASK.md`
- `docs/DECISIONS.md`
- `docs/ACCEPTANCE_CHECKLIST.md`

Work rules:

- Do not invent requirements. If a requirement is unclear, state the ambiguity and choose the safest minimal interpretation.
- Do not change auth, payment, database schema, environment variables, export logic, or production configuration unless the current task explicitly requires it.
- Preserve existing SEO pages and product routes unless the task explicitly asks to change them.
- Keep AI Quality Check conservative. If evidence is missing, use "No relevant data" or equivalent wording instead of inventing findings.
- Prefer small, safe, reviewable changes over broad refactors.
- After every task, update `docs/DEV_LOG.md`.
- In the completion report, include changed files, tests/checks run, risks, unfinished items, and the suggested next task.
