# External 8D Request / Supplier Response Loop Spec

## Product Goal

External 8D Request turns 8D Reports from an internal report editor into a controlled quality response workspace. The goal is to let a customer quality team request supplier input, receive structured D0-D8 responses, review the response, request revisions, and close/export the final report without falling back to scattered Word files, email threads, and uncontrolled attachment folders.

This spec is planning only. It does not implement runtime supplier collaboration.

## Current Capability Audit

- Share links already exist through `report_shares` with `permissionLevel`, `accessToken`, `expiresAt`, `views`, and deletion-based revocation.
- Current share implementation supports view and editable links, and editable share updates are blocked when the report is locked.
- `expiresAt` exists in schema but is not currently enforced by the share API.
- Share links are report-level, not request-level. They do not model supplier identity, assigned sections, due dates, invite delivery, response status, reviewer decisions, or revision cycles.
- Team workspace roles already distinguish owner, editor, and viewer for authenticated users.
- Workflow status already supports draft, internal review, approved, submitted, and closed, with approved/submitted/closed locking the report.
- Activity Log records report field updates, share link creation/update/revocation, workflow transitions, unlocks, attachment changes, and exports.
- Resend email infrastructure exists for auth/welcome/service flows, with safe diagnostics and local fallback behavior.
- Guest share access currently reads report data and attachments through token routes without requiring login.

## Actors

- Customer quality team: the company using 8D Reports to request and review supplier corrective action.
- Supplier responder: the external supplier user who receives a secure request link and fills assigned sections.
- Internal reviewer: an owner/editor who reviews supplier input and either accepts it or requests revision.
- Team owner: owns the workspace, can create requests, assign reviewers, manage workflow, revoke links, and close the response.
- Team editor: can draft reports and review supplier content where permitted by the team owner.
- Team viewer: can view internal records but cannot create or manage supplier requests.

## MVP Flow

1. Customer quality team creates an External 8D Request from a report or new complaint record.
2. Owner/editor selects supplier contact, due date, requested sections, and message.
3. System creates a request record and a dedicated secure supplier token.
4. System sends an email invite to the supplier responder.
5. Supplier opens the secure link.
6. Supplier sees only the request context, assigned D-steps, allowed attachments, due date, and response status.
7. Supplier fills assigned sections and uploads evidence allowed by the request policy.
8. Supplier submits the response for review.
9. Internal reviewer reviews changes, comments outside MVP if comments are not implemented, and chooses accept or request revision.
10. If revision is requested, supplier receives a new notification and can edit only the returned sections.
11. When accepted, the customer team finalizes the report, exports the deliverable, and closes the workflow.

## Permission Matrix

| Capability | Team owner | Team editor | Team viewer | Supplier responder |
| --- | --- | --- | --- | --- |
| Create external request | Yes | Yes, if workspace policy allows | No | No |
| Invite supplier | Yes | Yes, if allowed | No | No |
| View internal report | Yes | Yes | Yes | No, only request-safe context |
| View supplier request | Yes | Yes | Yes | Only via valid token for assigned request |
| Edit internal report fields | Yes when unlocked | Yes when unlocked | No | No |
| Edit assigned supplier sections | Yes | Yes | No | Yes while request is open or revision requested |
| Upload supplier evidence | Yes | Yes | No | Yes if request policy allows |
| Submit supplier response | Yes | Yes | No | Yes |
| Accept response | Yes | Yes, if allowed | No | No |
| Request revision | Yes | Yes, if allowed | No | No |
| Revoke supplier link | Yes | Yes, if allowed | No | No |
| Close request | Yes | Yes, if allowed | No | No |
| Export final report | Yes | Yes | No | No |

## Token Security Model

- External request links must use dedicated request tokens, not generic report share tokens.
- Tokens must be high entropy, single-request scoped, revocable, and have enforced expiration.
- Token routes must check request status, expiration, revocation, and assigned section permissions on every read/write.
- Tokens must not grant access to Knowledge Base, Dashboard, Team workspace, report search, billing, or unrelated reports.
- Token routes should use least-privilege response shapes and avoid returning internal-only fields, activity history, team membership, billing state, or unrelated attachments.
- Attachment access must be request-scoped and must not expose all report attachments by default.
- Token use should increment bounded access counters and write safe audit events.
- Future implementation should rate-limit token access and submission attempts to reduce brute force and spam risk.

## Login vs Guest Decision

MVP should allow supplier responders to use secure guest links because suppliers may not want to create accounts before responding to a customer request. Guest access must be narrower than authenticated Team access.

Account-based supplier portals can be a later phase when repeat supplier collaboration is validated. If supplier login is later added, it should link supplier identity to requests without exposing customer workspace data.

## Ownership Model

- The customer team owns the report, request, final export, and audit trail.
- Supplier responses are contributions to a customer-owned quality record.
- Supplier responders should see clear copy that submitted content becomes part of the customer quality record.
- Internal owners/editors decide whether supplier content is accepted into the final report.
- Closed reports remain customer-owned Knowledge Base assets if they meet existing Knowledge Base eligibility rules.

## Audit Log Requirements

Future implementation should log:

- external_request_created
- external_request_invited
- external_request_opened
- external_request_submitted
- external_request_revision_requested
- external_request_accepted
- external_request_closed
- external_request_token_revoked
- external_request_attachment_uploaded
- external_request_attachment_deleted

Audit metadata must stay safe: request id, section ids, status, due date presence, attachment count, actor type, and token id hash are acceptable. Do not store supplier message bodies, report field content, root cause text, corrective action text, customer private notes, full email body, or raw token values in analytics metadata.

## Email Notifications

Email should use the existing server email helper pattern, but only after a runtime PR designs the exact template and error handling.

MVP notifications:

- invite supplier
- remind supplier near due date, optional later phase
- supplier submitted response
- internal reviewer requested revision
- internal reviewer accepted response
- request closed
- token revoked, optional

Email logs must not print full token URLs, raw tokens, full supplier response content, or attachment content. Logs may include recipient domain, request id, provider message id, and delivery purpose.

## Data Exposure Rules

Supplier guest views may expose:

- request title
- customer-provided problem summary
- assigned D-step labels and fields
- existing safe context selected by the customer
- supplier's own submitted content
- allowed request attachments
- due date and response status

Supplier guest views must not expose:

- Dashboard
- Knowledge Base
- team member list
- billing/subscription data
- unrelated reports
- internal Activity Log unless explicitly filtered for supplier-safe events
- internal reviewer notes
- report search
- AI prompts or outputs
- attachments not assigned to the request

## Abuse / Spam Risk

- Supplier invite creation can be abused for email spam if not gated.
- MVP should require authenticated Team owner/editor, active workspace entitlement, invite rate limits, and clear audit events.
- Token endpoints need rate limiting and generic errors to avoid token enumeration.
- File uploads need the existing attachment size/type restrictions plus request-specific limits.
- Email bounces and provider errors should not expose supplier addresses or token URLs in client responses.

## Non-Goals

- No runtime external request feature in this PR.
- No supplier portal accounts.
- No public supplier dashboard.
- No Knowledge Base permission or eligibility changes.
- No AI-generated supplier responses.
- No automatic AI approval.
- No payment, checkout, pricing, export, auth, Resend configuration, or database schema changes in this PR.
- No production data writes.

## Required Schema Changes For Future PR

Future runtime implementation likely needs new schema. Do not overload `report_shares` as the request system.

Recommended future tables:

- `external_8d_requests`: report id, owner id, supplier email/domain, status, due date, message summary, created/updated timestamps.
- `external_8d_request_sections`: request id, D-step id, assigned field list, status, submitted timestamp.
- `external_8d_request_tokens`: request id, token hash, expires at, revoked at, last used at, use count.
- `external_8d_request_attachments`: request id, attachment id, supplier visibility, uploaded by actor type.
- `external_8d_request_events`: request id, actor type, action type, safe metadata, created timestamp.

Schema design must be reviewed before implementation because it changes external access boundaries.

## Smoke Strategy

Future authenticated smoke should use a temporary Neon branch and seed:

- Team owner/editor/viewer.
- A report owned by the Team workspace.
- A pending external request with assigned sections.
- A supplier token for the pending request.
- A revoked token.
- An expired token.
- An outsider report to verify no cross-workspace leakage.

Smoke coverage should verify:

- unauthenticated Dashboard/Knowledge remain protected
- supplier token opens only the assigned request
- revoked/expired tokens fail safely
- supplier cannot access Knowledge Base, Dashboard, report search, or unrelated attachments
- supplier can submit assigned sections only
- internal reviewer can accept or request revision
- audit events are recorded with safe metadata
- email sending can be mocked or safely skipped without requiring production Resend
- cleanup deletes the temporary Neon branch

## Recommended Implementation Phases

1. Docs and schema proposal: validate request model, token model, permission matrix, and smoke plan.
2. Internal request records: add schema, owner/editor request creation, no supplier access yet.
3. Supplier guest read path: dedicated token route with safe request context only.
4. Supplier submit path: assigned sections only, request status transitions, audit events.
5. Reviewer loop: accept, request revision, close request, and lock behavior.
6. Email invites: Resend templates, safe logging, rate limits, and bounce/error handling.
7. Attachment policy: request-scoped evidence upload/download with limits.
8. Productization: dashboard filters, metrics, and later supplier accounts if repeated usage supports it.
