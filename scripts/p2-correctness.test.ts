import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

const reportRoute = read("src/app/api/reports/[id]/route.ts");
const workflowPanel = read("src/components/report/ReportWorkflowPanel.tsx");
const privacyPage = read("src/app/(marketing)/privacy/page.tsx");
const loginForm = read("src/app/(auth)/login/login-form.tsx");
const signupForm = read("src/app/(auth)/signup/signup-form.tsx");
const proxy = read("src/proxy.ts");

// D0 report type / priority must persist to their dedicated columns.
assert.ok(reportRoute.includes("updates.reportType = body.data.reportType as string"), "PUT must sync the reportType column from D0 data");
assert.ok(reportRoute.includes("updates.priority = body.data.priority as string"), "PUT must sync the priority column from D0 data");

// A locked report must still expose the backend-allowed forward transitions.
assert.ok(workflowPanel.includes('workflowStatus === "approved"') && workflowPanel.includes('workflowStatus: "submitted"'), "Approved reports must offer Submit to customer");
assert.ok(workflowPanel.includes('workflowStatus === "submitted"') && workflowPanel.includes('workflowStatus: "closed"'), "Submitted reports must offer Close report");

// Privacy copy must match actual analytics behavior.
assert.equal(/We do not use tracking or advertising cookies\./.test(privacyPage), false, "Privacy copy must not claim there are no analytics cookies while GA is loaded");
assert.ok(privacyPage.includes("Google Analytics"), "Privacy copy must disclose Google Analytics when analytics is enabled");

// Login/signup must keep the original task and offer recovery after a failed OTP send.
assert.ok(loginForm.includes("/signup?callbackUrl=") && loginForm.includes("encodeURIComponent(callbackUrl)"), "login -> signup must preserve callbackUrl");
assert.ok(signupForm.includes("/login?callbackUrl=") && signupForm.includes("encodeURIComponent(callbackUrl)"), "signup -> login must preserve callbackUrl");
assert.ok(signupForm.indexOf('setStep("otp")') !== -1 && signupForm.indexOf('setStep("otp")') < signupForm.indexOf("await requestVerificationCode()"), "signup must land on the OTP screen before sending so Resend is available");
assert.ok(proxy.includes("request.nextUrl.search"), "proxy must keep the query string in callbackUrl");
assert.ok(proxy.includes('locale === "zh-CN" ? "/zh/login" : "/login"'), "proxy must send Chinese visitors to /zh/login");

// The auth cross-links must stay in the active language without losing the
// callbackUrl contract.
assert.ok(loginForm.includes("zhPrefix}/signup?callbackUrl=${encodeURIComponent(callbackUrl)}"), "login -> signup must localize the target and keep callbackUrl");
assert.ok(signupForm.includes("zhPrefix}/login?callbackUrl=${encodeURIComponent(callbackUrl)}"), "signup -> login must localize the target and keep callbackUrl");
assert.ok(loginForm.includes('locale === "zh-CN" ? "/zh" : ""') && signupForm.includes('locale === "zh-CN" ? "/zh" : ""'), "the auth forms must resolve the /zh prefix from the active locale");

// Accessibility of the password toggle.
assert.ok(loginForm.includes('aria-label={showPassword ? t("hidePassword") : t("showPassword")}'), "password toggle must have a translated aria-label");
assert.equal(loginForm.includes("tabIndex={-1}"), false, "password toggle must be keyboard reachable");

// Signup events: one funnel sign_up, fired after verification.
const taxonomy = read("src/lib/analytics-taxonomy.ts");
const eventsRoute = read("src/app/api/events/route.ts");
assert.ok(taxonomy.includes('sign_up: ["signup_completed"]'), "only signup_completed may map to the GA4 sign_up funnel event");
assert.ok(taxonomy.includes('if (internalEventName === "signup_success") return "signup_account_created"'), "account creation must be reported separately from sign_up");
assert.ok(eventsRoute.includes('"signup_account_created"'), "the events allowlist must accept signup_account_created");
assert.ok(signupForm.indexOf('trackEvent("signup_completed"') > signupForm.indexOf("async function handleVerifyOtp"), "signup_completed must fire after verification, not at account creation");

console.log("P2 correctness checks passed.");
