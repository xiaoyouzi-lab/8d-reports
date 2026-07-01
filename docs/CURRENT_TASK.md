# Current Task

## Task Name

GEO Content Production Plan v1.

## Context

Revenue Evidence Sprint v1 is deployed. The product now needs an executable
30-day content plan that turns revenue-near GEO/SEO intent into a small,
disciplined production calendar instead of scattered article ideas or low-value
SEO batches.

This task is docs and governance only. It does not publish runtime pages.

## Goal

Create a 30-day GEO content production plan that prioritizes Template Setup,
Team Launch, Assisted First 8D / SCAR Delivery, demo downloads, signup, Knowledge
Base reuse, and conservative AI Quality Check interest while avoiding fake
statistics, spam, keyword stuffing, and unsupported claims.

## Scope

- Add `docs/GEO_CONTENT_PRODUCTION_PLAN.md`.
- Define a 30-day content calendar with at least 30 content items.
- Cover:
  - Week 1: revenue pages / high-intent service content
  - Week 2: core 8D instructional content
  - Week 3: industry examples
  - Week 4: comparison / AI / Knowledge Base
- For every article, document:
  - target query
  - title
  - search intent
  - answer-first outline
  - proof elements
  - internal links
  - CTA
  - offsite repurposing target
  - measurement event
- Define GEO writing rules and platform repurposing rules for LinkedIn, Medium,
  Quora, and Reddit-safe discussion.
- Add governance coverage for the content count, week coverage, required fields,
  writing rules, repurposing sections, anti-spam boundaries, and safe analytics.
- Update `docs/DEV_LOG.md`.

## Non-Goals

- No runtime pages.
- No public marketing page changes.
- No auto-posting or automated offsite distribution.
- No fake search volume, fake statistics, fake customer stories, fake logos,
  guaranteed acceptance claims, or unsupported product claims.
- No payment, checkout, subscription, auth, password reset, Resend, export,
  Knowledge Base search, Knowledge permissions, AI backend, production
  configuration, or database schema changes.
- No production data writes.

## Acceptance Criteria

- `docs/GEO_CONTENT_PRODUCTION_PLAN.md` exists.
- The plan includes at least 30 content items across the required four-week
  calendar.
- Each content item includes target query, title, search intent, answer-first
  outline, proof elements, internal links, CTA, offsite repurposing target, and
  measurement event.
- The writing rules require answering in the first 80 words, practical
  checklists, manufacturing/SQE vocabulary, example tables, common mistakes,
  Template Setup / Assisted First 8D guidance, demo/sample links, and avoidance
  of fake statistics, AI fluff, and keyword stuffing.
- Platform repurposing rules cover LinkedIn, Medium, Quora, and Reddit-safe
  discussion without auto-posting, spam, fabricated personal experience, or
  over-linking.
- Governance tests assert the required content calendar and safety boundaries.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, and `npm run test:governance`.

## Risks

- A content plan can become busywork if topics are produced without evidence.
  Prioritize Week 1 revenue-near topics first.
- Offsite content can damage trust if it looks automated or spammy. Keep it
  manual, platform-native, and light on links.
- Analytics metadata must stay bounded to safe enums and counts, not raw query,
  customer, product, report, attachment, or AI prompt content.
