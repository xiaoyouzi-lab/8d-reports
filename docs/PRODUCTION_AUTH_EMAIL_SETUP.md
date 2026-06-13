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

Production should use:

- `BETTER_AUTH_URL=https://www.8d-reports.com`

Production domains supported by the auth config:

- `https://www.8d-reports.com`
- `https://8d-reports.com`

Preview deployments are supported for the current Vercel project host pattern:

- `https://*.xiaoyouzi-labs-projects.vercel.app`

If the Vercel team or project host pattern changes, update the auth allowed-host/trusted-origin configuration before using Preview auth flows.

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

- Signup: create a test account, receive the verification code email, and complete verification.
- Password reset: request a reset code, receive the email, enter the code, and set a new password.
- Security: confirm Vercel Production logs do not print OTP codes.
- Preview: repeat the signup or password-reset flow on the PR preview URL.

If Preview uses a separate database, production accounts may not exist there. Use a disposable Preview-compatible account for validation.
