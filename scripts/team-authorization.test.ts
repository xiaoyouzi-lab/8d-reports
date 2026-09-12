import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createInviteToken,
  hashInviteToken,
  isInviteExpired,
  isTeamInviteStatus,
  normalizeInviteEmail,
  TEAM_INVITE_TTL_DAYS,
} from "../src/lib/team-invitations";
import { reportMatchesScope, type ReportAccessScope } from "../src/lib/report-access";

const root = process.cwd();

function read(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

function countMatches(source: string, pattern: RegExp) {
  return [...source.matchAll(pattern)].length;
}

// --- Pure invitation token logic -------------------------------------------

assert.equal(normalizeInviteEmail("  Member@Company.COM "), "member@company.com", "Invite emails must be trimmed and lowercased");
assert.equal(normalizeInviteEmail(undefined), "", "Missing invite emails must normalize to empty");
assert.equal(normalizeInviteEmail(42), "", "Non-string invite emails must normalize to empty");

assert.equal(isTeamInviteStatus("pending"), true);
assert.equal(isTeamInviteStatus("accepted"), true);
assert.equal(isTeamInviteStatus("owner"), false);

const now = new Date("2026-09-12T00:00:00Z");
const invite = createInviteToken(now);
assert.match(invite.token, /^[A-Za-z0-9_-]{40,}$/, "Invite tokens must be URL-safe random strings");
assert.match(invite.tokenHash, /^[0-9a-f]{64}$/, "Invite tokens must be stored as a sha256 hex hash");
assert.equal(invite.tokenHash, hashInviteToken(invite.token), "The stored hash must derive deterministically from the token");
assert.notEqual(invite.token, invite.tokenHash, "The raw invite token must never equal its stored hash");
assert.notEqual(createInviteToken(now).token, invite.token, "Invite tokens must be unique per invite");
assert.equal(
  invite.expiresAt.getTime(),
  now.getTime() + TEAM_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
  "Invite expiry must follow the configured TTL",
);

assert.equal(isInviteExpired(null, now), true, "Missing expiry must be treated as expired");
assert.equal(isInviteExpired(new Date(now.getTime() - 1000), now), true, "Past expiry must be expired");
assert.equal(isInviteExpired(new Date(now.getTime() + 1000), now), false, "Future expiry must remain valid");
assert.equal(isInviteExpired("not-a-date", now), true, "Unparseable expiry must fail closed");

// --- Strict separation scope semantics -------------------------------------

const ownerScope: ReportAccessScope = { userIds: ["owner"], teamIds: ["team-a"] };
assert.equal(
  reportMatchesScope(ownerScope, { userId: "owner", teamId: null }),
  true,
  "A user can always read their own personal report",
);
assert.equal(
  reportMatchesScope(ownerScope, { userId: "member", teamId: "team-a" }),
  true,
  "An accepted team's team-scoped report is visible to the team",
);
assert.equal(
  reportMatchesScope(ownerScope, { userId: "member", teamId: null }),
  false,
  "A member's pre-join personal report must NOT be visible to the team",
);
assert.equal(
  reportMatchesScope(ownerScope, { userId: "outsider", teamId: "team-b" }),
  false,
  "Two-team cross-isolation must hold",
);

const pendingScope: ReportAccessScope = { userIds: ["pending-user"], teamIds: [] };
assert.equal(
  reportMatchesScope(pendingScope, { userId: "owner", teamId: "team-a" }),
  false,
  "A pending member has no team scope before accepting",
);

// --- Source-level authorization guards -------------------------------------

const reportAccess = read("src/lib/report-access.ts");
assert.match(reportAccess, /eq\(teamMembers\.status, "accepted"\)/, "Report scope must filter accepted memberships");
assert.match(reportAccess, /reports\.teamId/, "Report scope must include team-scoped reports");
assert.match(reportAccess, /getAccessibleReportScope/, "Report scope must expose the central scope object");
assert.match(reportAccess, /accessibleReportsWhere/, "Report scope must expose one shared SQL condition");

// Every membership read in report-workflow must carry the accepted filter.
const reportWorkflow = read("src/lib/report-workflow.ts");
const workflowMembershipReads = countMatches(reportWorkflow, /from\(teamMembers\)/g);
const workflowAcceptedFilters = countMatches(reportWorkflow, /eq\(teamMembers\.status, "accepted"\)/g);
assert.equal(workflowMembershipReads, workflowAcceptedFilters, "Every report-workflow membership read must filter accepted");
assert.ok(workflowMembershipReads >= 4, "Report workflow role resolution should read membership in owner/member/team paths");
assert.match(reportWorkflow, /getUserWorkspaceRoleForTeam/, "Report role resolution must support team-scoped reports");

const subscription = read("src/lib/subscription.ts");
assert.equal(
  countMatches(subscription, /from\(teamMembers\)/g),
  countMatches(subscription, /eq\(teamMembers\.status, "accepted"\)/g),
  "Team entitlement must only count accepted memberships",
);

const reportsRoute = read("src/app/api/reports/route.ts");
assert.match(reportsRoute, /accessibleReportsWhere\(scope\)/, "Report list must use the shared scope condition");
const reportsSearch = read("src/app/api/reports/search/route.ts");
assert.match(reportsSearch, /accessibleReportsWhere\(scope\)/, "Deep search must use the shared scope condition");
const knowledgeSearch = read("src/app/api/knowledge/search/route.ts");
assert.match(knowledgeSearch, /accessibleReportsWhere\(scope\)/, "Knowledge search must use the shared scope condition");
const knowledgeContext = read("src/lib/ai/knowledge-context.ts");
assert.match(knowledgeContext, /accessibleReportsWhere\(scope\)/, "AI Knowledge Context must use the shared scope condition");

const teamRoute = read("src/app/api/team/route.ts");
assert.match(teamRoute, /status: "pending"/, "Owner invites must create pending memberships");
assert.match(teamRoute, /sendTeamInvitationEmail/, "Owner invites must send a tokenized email");
assert.match(teamRoute, /inviteTokenHash/, "Owner invites must persist only the token hash");
assert.doesNotMatch(teamRoute, /not registered yet/, "Owner invites must not 404 unregistered emails");

const acceptRoute = read("src/app/api/team/accept/route.ts");
assert.match(acceptRoute, /hashInviteToken\(token\)/, "Accept must look up the hashed token");
assert.match(acceptRoute, /status: "accepted"/, "Accept must flip the membership to accepted");
assert.match(acceptRoute, /acceptedAt: new Date\(\)/, "Accept must record acceptedAt");

const reportCreation = read("src/lib/report-creation.ts");
assert.match(reportCreation, /getPrimaryTeamId/, "Report creation must resolve team scope");
assert.match(reportCreation, /teamId,/, "Report creation must persist teamId");

const migration = read("drizzle/0008_team_authorization.sql");
assert.match(migration, /ADD COLUMN IF NOT EXISTS "team_id"/, "Migration must add reports.team_id additively");
assert.match(migration, /ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'accepted'/, "Migration must default membership status to accepted");
assert.match(migration, /DROP NOT NULL/, "Migration must relax user_id for unregistered invites");
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE/i, "Migration must not destroy data");

console.log("team-authorization tests passed");
