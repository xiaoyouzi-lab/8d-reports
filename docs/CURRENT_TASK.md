# Current Task

## Task Name

Offsite GEO Distribution Pack v1.

## Context

Revenue Evidence Sprint v1 is deployed, and the onsite GEO/content planning work
now needs a safe offsite distribution pack. The goal is not automated posting or
spam. The goal is to prepare high-quality, platform-native drafts that can be
manually reviewed and used to learn whether SQEs, quality managers, supplier
quality engineers, and manufacturing quality teams respond to the topics.

## Goal

Create a docs-only offsite GEO distribution pack for LinkedIn, Medium, Quora,
and Reddit-safe discussion that supports revenue evidence without fake stories,
fake statistics, over-linking, or hidden product affiliation.

## Scope

- Add `docs/OFFSITE_GEO_DISTRIBUTION_PACK.md`.
- Include:
  - 10 LinkedIn posts for SQE / quality manager / supplier quality roles
  - 5 Medium article drafts/outlines
  - 20 Quora answer drafts
  - 10 Reddit-safe discussion prompts
  - anti-spam and manual tracking rules
- Update `docs/DEV_LOG.md`.
- Add governance checks that the document contains all required platform
  sections and anti-spam rules.

## Non-Goals

- No runtime pages.
- No auto-posting.
- No social media API integration.
- No fake user stories, fake statistics, fake customer logos, "best in the
  world" claims, guaranteed customer acceptance claims, or hidden affiliation.
- No payment, checkout, subscription, auth, password reset, Resend, export,
  Knowledge Base search, Knowledge permissions, AI backend, production
  configuration, or database schema changes.
- No production data writes.

## Acceptance Criteria

- Offsite distribution pack exists and covers LinkedIn, Medium, Quora, and
  Reddit-safe discussion.
- LinkedIn section includes 10 post drafts with role, hook, problem, takeaway,
  soft CTA, and link suggestion.
- Medium section includes 5 article drafts/outlines that are not duplicate
  onsite copy.
- Quora section includes 20 direct answer drafts, one-link guidance, and honest
  product-context disclosure guidance.
- Reddit section includes 10 discussion prompts, no-sales-pitch guidance, and
  subreddit targets as suggestions only.
- Rules prohibit automated posting, spam, fake stories, fake statistics, fake
  logos, over-linking, hidden affiliation, and private quality data.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, and `npm run test:governance`.

## Risks

- Offsite distribution can damage trust if it is copied mechanically or posted
  too often. Use manual review and platform-native edits.
- Links should be used sparingly and only when they genuinely help the answer.
- Manual tracking must avoid storing private quality-report or respondent data.
