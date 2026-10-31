# Development and production environments

Git branches and Neon branches are separate concepts. Checking out Git does not automatically select a database.

| Code branch | Neon target | Purpose |
| --- | --- | --- |
| `dev` | `dev` | Local development and testing |
| `prod` | existing `production` | Reviewed production code and production data |

`prod` starts at the last merged `main` commit. `dev` includes the Android pairing work and the recovery fix. Creating these branches does not change Vercel's deployment branch or deploy the parent app. Existing feature PRs remain separate.

Keep production and development Postgres, Auth, Storage and Realtime credentials together. Never combine a dev database with production Auth or storage. Local env files are ignored by Git. Production credentials are preserved in `.env.production.local`; local development uses `.env.dev.local`, copied to both `.env.local` and `apps/parent-web/.env.local` via `npm run env:dev`. Keep mode 600 on these files. Use a different cookie secret for dev so production browser sessions are not accepted accidentally.

Development uses `http://127.0.0.1:3005`. `APP_ORIGIN` must match this address exactly, and Auth must trust it. Register `http://localhost:3005` separately if it is used for authentication. Family mutation endpoints still enforce the canonical APP_ORIGIN.

The long-lived dev and production branches must not receive preview TTLs. `neon.ts` exempts them from the seven-day preview expiry.

## Email-code password recovery

The forgot-password UI requests an email OTP with type `forget-password`. After the generic request acknowledgement, the user enters their six-digit code and confirms a new password of at least 12 characters. The app calls `emailOtp.resetPassword` with email, OTP and password. The provider validates expiry and usage; the app never stores codes or passwords in browser storage. Resend has a 60-second UI cooldown in addition to provider limits. Unknown emails receive a generic acknowledgement to avoid account enumeration.

The previous reset-link request failed at port 3005 with `INVALID_REDIRECT_URL`, because only port 3000 was trusted. Port 3005 has now been registered. Code recovery avoids reliance on redirect links; existing reset-link handling remains for compatibility.

Validation of inbox delivery and successful recovery requires a controlled mailbox; a generic 200 response does not prove email delivery. Do not read or change real user password hashes or verification rows to reset an account.

## Provisioning result — 31 October 2026

Neon `dev` is `br-steep-hill-b5ey5820`; production remains `br-mute-tree-b53goij1`. Dev was created as a normal isolated copy with the owner’s explicit approval, including existing accounts/data. Schema-only provisioning first failed with an existing empty Auth schema, then a provider `permission denied for database` error; the unsuccessful empty branch was removed. No broad database grants or security bypasses were used.

The local app now uses dev for all four services and a separate cookie secret. Production Auth also trusts the requested port 3005 to repair the original redirect/origin configuration problem; no production user password or family data was changed. Production deployment configuration is not modified.
