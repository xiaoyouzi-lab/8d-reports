# Team Authorization and Report Separation — Fix Spec & Decision

Date: 2026-09-12
Status: Proposed. Needs an owner decision on policy (Section 3) before implementation.
Related: README.md (P1 finding), docs/PRODUCT_CONTEXT.md, docs/DECISIONS.md,
docs/ACCEPTANCE_CHECKLIST.md.

## 1. Confirmed problem (code audit)

- src/app/api/team/route.ts:206-218 — the owner POST looks up a registered user
  by email and inserts a team_members row directly. There is no invitation
  token, no pending state, and no invitee acceptance.
- src/lib/db/schema.ts:104-113 — team_members = (id, teamId, userId, role,
  createdAt). No status, invitedBy, or acceptedAt. No invitations table.
- src/lib/db/schema.ts:131-155 — reports has only userId; there is no team or
  ownership column.
- src/lib/report-access.ts:7-52 — getAccessibleUserIds returns self + the active
  team owner + every teamMembers.userId; getAccessibleReport then matches
  reports.userId in that set.
  Result: every report a member ever authored, including before they joined the
  team, becomes visible to the team owner and other members.
- Membership is also treated as an entitlement: src/lib/subscription.ts:24-28 and
  src/app/api/webhooks/creem/route.ts:221-236.

Every report-scoped surface uses the same union: report list and search,
knowledge search, detail/edit, export, share, attachments, upload, checkout, and
Quality Case access. This is a central authorization change, not a page fix.

## 2. Why this cannot be a UI-only fix

The README direction is explicit: "先建立成员接受与报告归属边界，再验证跨团队
隔离；不能只补前端确认." Both an acceptance step and a real report-ownership
boundary are required. A frontend-only confirmation would leave the actual data
scope unchanged and would not be a fix.

## 3. Decision needed (owner)

### Option A — Strict separation (recommended)

- Invitees join as pending and gain access only after accepting.
- A report is visible to the team only when it is explicitly team-scoped
  (reports.teamId points at that team).
- Personal reports never become team-visible by joining a team.
- New reports created from a team workspace are team-scoped; reports created
  outside a team stay personal.

Effect: strongest privacy boundary; matches the README wording. Existing
team-shared reports need an explicit backfill choice (Section 5).

### Option B — Keep shared member visibility, add acceptance only

- Add the invite and acceptance step.
- Keep the current "all accepted members see all member reports" behavior.

Effect: smaller change, but the original defect (pre-join personal history
exposed to the team) remains. Not recommended, because the README identifies the
exposure itself as the P1 risk.

## 4. Recommended implementation (Option A)

Additive schema changes (nullable or defaulted):

1. team_members.status text not null default 'accepted' with values
   'pending' | 'accepted', plus acceptedAt timestamptz null.
   Existing rows backfill to 'accepted', so nothing currently shared is lost.
2. reports.teamId uuid null references team_workspaces(id) on delete set null.

Behavior:

- Owner invites by email. If the email is a registered user, create a pending
  team_members row and send a tokenized invitation. If not registered, keep it
  pending instead of the current 404.
- New endpoint POST /api/team/accept accepts a signed token, flips the row to
  accepted, and records acceptedAt.
- Owner can resend or revoke a pending invitation.
- Access becomes: own reports plus reports whose teamId is one of my accepted
  teams. Only accepted memberships count for access and entitlements.
- Removing a member or revoking an invite must not grant or retain access.

## 5. Backfill choice (owner decision)

When reports.teamId is introduced, existing reports have no team attribution.
Two safe options:

- A1 Strictest: leave teamId null. Existing reports become personal. Any report
  that was only reachable through team membership stops being team-visible.
- A2 Preserve: backfill teamId for reports authored by members of the team,
  preserving today's shared visibility, then apply strict rules only to new
  reports.

A1 is privacy-correct but is a visible behavior change for existing teams. A2
preserves continuity but keeps pre-join personal history team-visible for the
backfilled set. Because there is no production team with external members today
(verified operating metrics show no external customers), A1 is likely acceptable
and keeps the model clean. This still requires the owner's explicit choice.

## 6. Code touch points (from the audit)

- src/lib/report-access.ts:7-52, 54-63 (central scope)
- src/lib/report-workflow.ts:46-52, 54-72, 74-116, 118-128
- src/app/api/reports/route.ts (list), src/app/api/reports/search/route.ts
- src/app/api/knowledge/search/route.ts, src/lib/ai/knowledge-context.ts:141,159
- src/app/api/reports/[id]/route.ts, upload, attachments, export, share, checkout
- src/lib/p0-plus/convert.ts:159
- src/lib/subscription.ts:24-28 and src/app/api/webhooks/creem/route.ts:221-236
- src/lib/quality-cases/service.ts:209,396 and access.ts:22,33
- src/app/api/team/route.ts (invite, resend, revoke) and a new accept endpoint
- A new Drizzle migration under drizzle/

Every place that reads membership must filter to accepted and every report scope
must include teamId. Missing one site is an authorization bypass, so the change
needs a single shared helper and tests rather than per-route edits.

## 7. Tests required

- A member's pre-join report is not accessible to the owner or other members.
- A team-scoped report is accessible to all accepted members.
- Two-team cross-isolation: a user in team A cannot read team B content.
- Invite -> pending -> no access -> accept -> access; revoke/decline.
- Pending members see no team reports; viewers still cannot edit.
- Quality Case access honors the same scope.
- Replace the current source-string governance checks with DB-backed behavioral
  tests where a disposable database is available.

## 8. Rollout and safety

- Additive migration only; no destructive change.
- Ship behind the existing Team plan gate; no change for Free/Pro.
- Verify with the disposable authenticated smoke before any production rollout.
- Keep the existing SEO routes, payment, export logic, and production config
  untouched.

## 9. Open questions for the owner

1. Option A or Option B?
2. If Option A: backfill A1 (strictest) or A2 (preserve)?
3. Should a member's new report default to team-scoped or personal, with an
   explicit "share with team" action?
