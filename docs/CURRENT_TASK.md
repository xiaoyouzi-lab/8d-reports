# Current Task

## Task Name

Revenue Evidence Sprint v1.

## Context

Knowledge Base, Knowledge Reuse, AI Quality Check with Knowledge Context, and
Knowledge Capture now provide enough product capability for the current stage.
The next priority is not another feature expansion. The priority is to collect
commercial conversion evidence: whether visitors click, download demos, upload
templates, submit service requests, sign up, and attempt exports.

## Goal

Turn 8D Reports into a measurable revenue-learning system for Template Setup,
Team Launch, and Assisted First 8D / SCAR Delivery without changing auth,
payment, export entitlements, Knowledge permissions, or database schema.

## Scope

- Upgrade homepage, Pricing, and demo report CTAs for service conversion.
- Make the Template Setup / service lead funnel usable with required fields,
  success and failure states, email notifications, and file-upload fallback.
- Reuse the existing service request table for Template Setup, Team Launch, and
  Assisted First 8D / SCAR Delivery leads.
- Add privacy-safe revenue analytics events and safe referrer / UTM /
  anonymous-session metadata.
- Add admin-only revenue evidence metrics for the last 7 and 30 days.
- Add Excel downloads to demo report sales assets using the existing quality
  workbook generator.
- Extend unauthenticated, production, governance, and authenticated smoke
  coverage for the revenue evidence path.
- Update the development log.

## Non-Goals

- No full QMS, APQP, PPAP, iOS, PWA, or external supplier request system.
- No payment, checkout, subscription, pricing amount, auth, password reset, or
  Resend infrastructure changes beyond non-blocking lead notification emails.
- No report editor core-flow changes.
- No PDF / Word / Excel export entitlement changes for real user reports.
- No AI backend changes.
- No Knowledge Base search, eligibility, permission, report access, or share
  token logic changes.
- No database schema migration.
- No production data writes during development.

## Acceptance Criteria

- Homepage keeps Start free and adds Upload your 8D template / Request template
  setup with the required urgent 8D/SCAR copy.
- Pricing keeps Free / Pro / Team / Single Export and makes these services
  prominent: 8D Template Setup from $499, Team Launch from $999, Assisted First
  8D / SCAR Delivery from $799.
- Demo report pages include the company-format CTA and PDF / Word / Excel / ZIP
  download links.
- Template Setup form includes name, company, work email, role, current process,
  use case, required export, timeline, message, and file upload.
- Lead save does not fail just because file upload fails; users see a clear
  re-upload warning.
- Admin and user email failures are logged but do not block lead save.
- Admin can view lead and file metadata without private bucket URLs.
- Revenue analytics events are allowlisted and avoid sensitive report content.
- Admin metrics show page views, demo downloads, template setup submissions,
  contact submissions, signup count, export attempts, and pricing CTA clicks for
  the last 7 and 30 days.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, `npm run test:governance`, production smoke, and authenticated
  smoke on a temporary Neon branch.

## Risks

- Service lead emails depend on existing email configuration; failure must stay
  non-blocking and visible in logs.
- File upload depends on R2 configuration; lead capture must remain useful when
  storage is unavailable.
- Event tracking can drift into sensitive quality data; metadata must stay
  bounded to safe enums, counts, formats, paths, referrer, UTM, and anonymous
  session id.
- Admin metrics use JSONB/application-level event storage; larger volume may
  later need dedicated reporting indexes or exports.
