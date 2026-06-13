# Production Auth Email Setup

## Purpose

8D Reports uses Better Auth email OTP for signup verification and password reset. Production and Vercel Preview deployments must send those OTP codes by email instead of relying on server logs.

## Required Vercel Environment Variables

Set these for both Preview and Production:

- `RESEND_API_KEY`: sensitive Resend server API key.
- `EMAIL_FROM`: verified sender, for example `8D Reports <no-reply@8d-reports.com>`.
- `BETTER_AUTH_SECRET`: sensitive Better Auth secret.
- `BETTER_AUTH_URL`: canonical app URL for the environment.

Set this when useful:

- `EMAIL_REPLY_TO`: optional support mailbox for replies.
- `BETTER_AUTH_TRUSTED_ORIGINS`: optional comma-separated extra origins for auth requests.

Production should use:

- `BETTER_AUTH_URL=https://www.8d-reports.com`

Production domains supported by the auth config:

- `https://www.8d-reports.com`
- `https://8d-reports.com`

Preview deployments are supported through Vercel system environment variables:

- `VERCEL_URL`
- `VERCEL_BRANCH_URL`
- `VERCEL_PROJECT_PRODUCTION_URL`

The auth config treats values without a protocol as `https://...`, then adds each resolved `.origin` to Better Auth trusted origins and each `.host` to allowed auth hosts. If a Preview URL is still rejected, add it to `BETTER_AUTH_TRUSTED_ORIGINS` as a comma-separated origin value.

## Local / Preview / Production Behavior

- Local development: if `RESEND_API_KEY` or `EMAIL_FROM` is missing, auth OTP codes are logged locally for developer convenience.
- Preview: OTP codes are sent by Resend. Missing email variables cause a server-side email delivery error and no OTP code is printed.
- Production: OTP codes are sent by Resend. Missing email variables cause a server-side email delivery error and no OTP code is printed.

## Resend Setup Checklist

- Verify the sending domain in Resend before using a production sender address.
- Add the required DNS records for SPF/DKIM in the domain DNS provider.
- Create a Resend API key and add it to Vercel as `RESEND_API_KEY`.
- Add `EMAIL_FROM` with a sender on the verified domain.
- Optionally add `EMAIL_REPLY_TO` for support replies.

## Manual Verification

After environment variables are set:

- Preview diagnostics: open `/debug/email` on the PR Preview URL. Confirm the latest commit SHA, `hasResendApiKey=true`, and `hasEmailFrom=true`, then send a self-test email. The self-test must create a Resend record before it reports success.
- Signup: create a test account, receive the verification code email, and complete verification.
- Resend records: when signup shows the OTP screen, Resend should show a verification email record for the same time window.
- Signup diagnostics: on Preview/local only, the OTP screen may show safe wrapper debug. Seeing `route=signup-verification-wrapper` confirms the browser called the server wrapper route.
- Vercel logs: when signup shows the OTP screen, logs should include safe signup verification wrapper success and email send success events.
- Password reset: request a reset code, receive the email, enter the code, and set a new password.
- Security: confirm Vercel Production logs do not print OTP codes.
- Diagnostics: Vercel logs may show OTP type, recipient email domain, config booleans, Vercel environment, and send success/failure. They must not show OTP codes, full recipient emails, API keys, or email body content.
- Preview: repeat the signup or password-reset flow on the PR preview URL.

If Preview uses a separate database, production accounts may not exist there. Use a disposable Preview-compatible account for validation.

`/debug/email` and `/api/debug/email-self-test` are temporary Preview/local-only diagnostics. They should return not found in Production and should be removed after Preview email delivery is consistently verified.
