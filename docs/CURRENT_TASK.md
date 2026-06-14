# Current Task

## Task Name

Implement production-ready email delivery for signup verification and password reset.

## Background

Manual testing found that signup verification and password reset emails are not delivered.

Current auth behavior uses Better Auth email OTP, but the OTP sender only logs OTP codes to the server console:

- signup verification OTP is printed to logs
- reset password OTP is printed to logs
- users do not receive emails

This was acceptable for early development, but it is not production-ready. It also blocks preview validation because testers cannot register, verify, or recover accounts reliably.

The production version currently avoids relying on email verification because real emails are not delivered. This must be fixed before the product can be trusted as a SaaS.

## Goal

Add real email delivery for:

- signup verification
- password reset / forgot password
- any Better Auth email OTP flow currently used by the app

The user should receive a real email with the OTP code or reset/verification flow needed to continue.

## Non-Goals

Do not redesign the whole auth system.

Do not change pricing rules.

Do not change subscription logic.

Do not change database schema unless absolutely necessary and explicitly justified.

Do not remove password validation.

Do not expose OTP codes to users through logs in production.

Do not break existing production login.

Do not require social login.

## Scope

Likely affected areas:

- auth configuration
- email provider utility
- environment variables
- signup verification flow
- forgot password / reset password flow
- UI copy if needed
- Vercel environment documentation
- docs/DEV_LOG.md

## Requirements

### 1. Audit current auth/email behavior

Inspect the current Better Auth configuration and all auth-related pages/routes.

Document:

- signup flow
- email verification behavior
- forgot password flow
- reset password flow
- which Better Auth plugin is used
- where OTP is currently generated
- where OTP is currently sent/logged
- which UI screens depend on email delivery
- what differs between local, preview, and production

### 2. Add a real email provider

Implement a production email sending utility.

Preferred approach:

- Use Resend if it is already suitable for the stack.
- If another email provider is already partially present, use the existing direction.
- Keep the integration simple and maintainable.

Expected environment variables may include:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- optionally `EMAIL_REPLY_TO`

Do not hardcode secrets.

### 3. Replace console-only OTP delivery

Update Better Auth email OTP sending so that:

- in production and preview, OTPs are sent by email
- in local development, OTP may still be logged for developer convenience
- failed email delivery returns/logs a useful server-side error
- production does not rely only on console logs

### 4. Email content

Create clear email content for:

- email verification
- password reset
- sign-in OTP if used

Email should include:

- product name: 8D Reports
- OTP code
- expiration time
- short explanation of why the user received it
- safety note: ignore if not requested

Keep content simple. HTML is optional; plain text is acceptable if reliable.

### 5. Forgot password behavior

Ensure the forgot password flow has a real path that sends an email to the user.

If the current UI implies "we sent an email," the email must actually be sent.

If Better Auth expects OTP verification rather than reset links, make the UI copy match the actual behavior.

### 6. Preview environment behavior

Make preview validation possible.

Document the required Vercel Preview environment variables.

If preview uses a separate database or separate auth URL, document that existing production accounts may not work in preview.

If preview uses the same database, ensure trusted origins / allowed hosts include Vercel preview URLs or the correct auth base behavior.

### 7. Production environment behavior

Document the required Vercel Production environment variables.

Ensure the production domain works:

- `https://www.8d-reports.com`
- `https://8d-reports.com`

Do not break existing logged-in users if avoidable.

### 8. Logging and security

Do not print OTP codes in production logs.

It is acceptable to log OTPs only in local development.

Server logs may record that an email was attempted/sent/failed, but should not expose codes in production.

### 9. Documentation

Update `docs/DEV_LOG.md` with:

- root cause
- email provider chosen
- environment variables needed
- behavior in local / preview / production
- manual verification checklist

If useful, add or update a small docs file such as:

- `docs/ENVIRONMENT_SETUP.md`
- or `docs/PRODUCTION_AUTH_EMAIL_SETUP.md`

## Acceptance Criteria

The task is complete only if:

- [ ] Signup verification email is actually sent in preview/production when configured.
- [ ] Forgot password / reset password email is actually sent in preview/production when configured.
- [ ] OTP codes are not printed in production logs.
- [ ] Local development still has a usable developer path.
- [ ] Email provider secrets are read from environment variables.
- [ ] Required Vercel Preview and Production env vars are documented.
- [ ] Auth trusted origins / allowed hosts are reviewed for preview and production.
- [ ] Existing production login is not broken.
- [ ] Build/lint/type checks pass.
- [ ] docs/DEV_LOG.md is updated.

## Manual Verification Required

After implementation and env setup:

1. Production:
   - Register a new account.
   - Receive verification email.
   - Complete verification or login flow.
   - Use forgot password.
   - Receive reset/OTP email.
   - Complete reset/login.

2. Preview:
   - Open PR preview.
   - Register a test account or log in with a preview-compatible account.
   - Confirm auth flow works.
   - Confirm preview can be used for PR validation.

3. Security:
   - Confirm production logs do not show OTP codes.
   - Confirm missing email env vars show a clear server-side error without exposing secrets.

## Risk Areas

- Better Auth email OTP behavior may differ from expected reset-link behavior.
- Preview URL and trusted origin handling may need careful configuration.
- Email provider domain verification may be required before production sending.
- Some emails may go to spam until DNS records are configured.
- Existing users without verified email may need a migration or graceful handling plan.

## Completion Report Required

Update `docs/DEV_LOG.md` with:

- changed files
- root cause
- email provider implementation
- required env vars
- local/preview/production behavior
- checks run
- manual verification checklist
- remaining risks
- suggested next task
