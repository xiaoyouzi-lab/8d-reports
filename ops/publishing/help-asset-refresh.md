# Help Asset Refresh

## Purpose

Use this internal publishing note when Help Center screenshots need to be
refreshed before public publishing. Public Help and Learn pages should never
describe capture tooling, local paths, storage state files, report ids, or asset
maintenance steps.

## Current v1 State

- Content Ops v1 uses seeded screenshots from existing product audit material.
- The seeded screenshots make the Help Center readable while avoiding unsafe
  production data writes or fake authenticated content.
- Some AI and workflow screenshots may show the editor context rather than a
  fully opened result panel until a safe authenticated refresh is available.

## Refresh Command

Prepare a safe local authenticated browser storage state and a non-production
report id, then run:

```bash
npm run capture:help-assets -- --base-url http://127.0.0.1:3029 --storage-state <auth-state.json> --report-id <report-id>
```

Requirements:

- Use a local or isolated test environment.
- Do not use production customer data.
- Do not commit auth storage state files.
- Do not commit credentials, cookies, tokens, database URLs, or private report
  content.
- Review every refreshed screenshot before committing it.

## Refresh Targets

Prioritize authenticated screenshots for:

- Dashboard overview.
- New report creation.
- D0-D8 editor.
- AI Draft dialog.
- AI Quality Check result state.
- 5-Why and Fishbone panels.
- Attachment workflow.
- Review, locking, and revision states.
- Team workspace and permissions.
- Share link controls.
- Export menu and ZIP/package behavior.

## Public Copy Rule

Public Help and Learn pages may say that a screenshot shows where a feature
appears in the workflow. They must not mention Playwright, capture scripts,
storage state, report ids, local paths, seeded screenshots, repository paths, or
ops maintenance instructions.
