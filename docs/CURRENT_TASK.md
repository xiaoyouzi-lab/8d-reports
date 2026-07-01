# Current Task

## Task Name

GEO / SEO Revenue Query Map v1.

## Context

Revenue Evidence Sprint v1 is deployed, and the next commercial priority is to
turn observed service and demo intent into a disciplined GEO/SEO query map
before adding more runtime surfaces or public pages.

This task is planning and governance only. It should define which high-intent
queries matter for 8D Reports, how each query maps to a page type, CTA, priority,
internal link, and privacy-safe measurement event, and which assumptions must
remain hypotheses until enriched by GSC, GA4, or first-party analytics.

## Goal

Create a revenue-centered GEO/SEO query map for 8D Reports that helps prioritize
content, demo, Template Setup, Team Launch, Assisted First 8D / SCAR Delivery,
Signup, and Knowledge/AI reuse opportunities without inventing search volume or
publishing thin SEO pages.

## Scope

- Add `docs/GEO_REVENUE_QUERY_MAP.md` with 150+ high-intent queries.
- Cover these categories:
  - Core 8D report intent
  - SCAR / supplier corrective action
  - Customer complaint response
  - Industry examples
  - Role-based intent
  - Excel replacement intent
  - AI / Knowledge reuse intent
  - Service / paid intent
- For every query, document:
  - intent type
  - target page type
  - CTA
  - priority P0/P1/P2
  - why it matters
  - content angle
  - internal link target
  - safe metadata / tracking event
- Mark the map as hypothesis-based unless later enriched by real GSC, GA4, or
  first-party evidence.
- Add governance coverage so the query map cannot regress below the required
  scope.
- Update `docs/DEV_LOG.md`.

## Non-Goals

- No runtime pages or public marketing page changes.
- No fake search volume, ranking, AI citation, revenue, or customer-demand
  claims.
- No low-quality AI article batches or thin SEO pages.
- No payment, checkout, subscription, auth, password reset, Resend, export,
  Knowledge Base search, Knowledge permissions, AI backend, production
  configuration, or database schema changes.
- No production data writes.

## Acceptance Criteria

- `docs/GEO_REVENUE_QUERY_MAP.md` exists.
- The map includes at least 150 queries across all eight required categories.
- Every query row includes intent, target page type, CTA, priority, why it
  matters, content angle, internal link target, and safe metadata / tracking
  event.
- The document clearly says search volume and demand are hypotheses unless
  enriched by real evidence.
- The document forbids collecting full queries, customer/product names, report
  text, root cause, corrective action, lessons learned, batch identifiers, AI
  prompts, and uploaded file content as analytics metadata.
- Governance tests assert category coverage, row count, required fields,
  representative revenue queries, safe CTAs, and safe tracking events.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, and `npm run test:governance`.

## Risks

- Query maps can drift into speculative SEO if treated as evidence. Keep volume,
  ranking, and revenue claims out until GSC/GA4 or first-party analytics
  supports them.
- Publishing too many thin pages would weaken the brand and waste effort.
  Prioritize P0 pages that connect directly to revenue evidence.
- Analytics metadata must remain bounded to safe enums and counts, not raw
  quality-report content.
