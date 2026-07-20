import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signupForm = readFileSync("src/app/(auth)/signup/signup-form.tsx", "utf8");
const signupOtpRoute = readFileSync(
  "src/app/api/auth-email/signup-verification/route.ts",
  "utf8",
);
const authConfig = readFileSync("src/lib/auth.ts", "utf8");
const authSchema = readFileSync("src/lib/db/schema.ts", "utf8");
const betterAuthOtp = readFileSync(
  "node_modules/better-auth/dist/plugins/email-otp/routes.mjs",
  "utf8",
);

// Signup remains deliberately opt-in: the page calls the one wrapper after the
// account exists, avoiding duplicate automatic/plugin sends for a single
// signup. The wrapper delegates generation/storage to the same Better Auth
// endpoint that authClient.emailOtp.verifyEmail() later validates.
assert.match(authConfig, /sendVerificationOnSignUp:\s*false/);
assert.match(signupForm, /fetch\("\/api\/auth-email\/signup-verification"/);
assert.match(signupForm, /authClient\.emailOtp\.verifyEmail\(/);
assert.match(signupForm, /callbackUrl[\s\S]*"\/dashboard"/);
assert.match(signupOtpRoute, /auth\.handler\(new Request\(/);
assert.match(signupOtpRoute, /\/api\/auth\/email-otp\/send-verification-otp/);
assert.match(signupOtpRoute, /type:\s*"email-verification"/);
assert.match(signupOtpRoute, /email-verification-otp-\$\{email\}/);

// The wrapper never owns a second OTP generator/storage format. Its only
// direct database write is exact cleanup after a delivery failure.
assert.doesNotMatch(signupOtpRoute, /randomInt|randomUUID|db\.insert\(verifications\)/);
assert.match(
  signupOtpRoute,
  /catch \(error\) \{[\s\S]*db\.delete\(verifications\)\.where\(eq\(verifications\.identifier, createVerificationIdentifier\(email\)\)\)/,
);
assert.match(signupOtpRoute, /Could not send verification code/);
assert.doesNotMatch(signupOtpRoute, /console\.(?:log|error)\([^\n]*otp/i);

// Preserve Better Auth's native security semantics: expiry deletes the value,
// invalid attempts are counted, successful verification consumes the value,
// and the storage identifier is shared by send and verify.
assert.match(betterAuthOtp, /identifier: toOTPIdentifier\(ctx\.body\.type, email\)/);
assert.match(betterAuthOtp, /atomicVerifyOTP\(ctx, opts, toOTPIdentifier\("email-verification", email\), ctx\.body\.otp\)/);
assert.match(betterAuthOtp, /if \(verificationValue\.expiresAt <[\s\S]*deleteVerificationByIdentifier\(identifier\)/);
assert.match(betterAuthOtp, /allowedAttempts = opts\?\.allowedAttempts \|\| 3/);
assert.match(betterAuthOtp, /deleteVerificationByIdentifier\(identifier\);[\s\S]*if \(!await verifyStoredOTP/);
assert.match(betterAuthOtp, /createVerificationValue\(\{[\s\S]*value: `\$\{otpValue\}:\$\{parseInt\(attempts \|\| "0"\) \+ 1\}`/);

// The database keeps one account identity per email; duplicate signup cannot
// create an additional user identity.
assert.match(authSchema, /email: text\("email"\)\.notNull\(\)\.unique\(\)/);

console.log("Signup OTP authority contract tests passed.");
