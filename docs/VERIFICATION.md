# Connected web verification — 24 October 2026

Tested against the linked Neon production branch using synthetic accounts only. The baseline migration was first tested on a temporary branch before applying it here. The local production web server runs at http://127.0.0.1:3000; no public web deployment was performed.

## Build and types

`npm run build && npm run typecheck` exited 0:

```text
✓ Compiled successfully in 786ms
Finished TypeScript in 922ms
✓ Generating static pages using 9 workers (8/8)
> tsc --noEmit
```

## Actual service checks

`node --env-file=.env.local scripts/verify-services.mjs` ran against `next start`, exited 0:

```text
PASS unauthenticated family access denied (401)
PASS Neon Auth registration + server-verified sessions (two separate users)
PASS family isolation and input validation
PASS Neon Realtime delivered a committed family revision after profile update
PASS private object storage upload + authenticated image read
PASS Postgres persisted profiles + routines; family export works
PASS profile archive/restore and routine update/delete persist
PASS cross-origin mutation rejected (403)
PASS sign-out denies subsequent protected access
ALL LIVE SERVICE CHECKS PASSED
```

## Browser checks

Signed in through the real form, added a second synthetic child, created a routine from a 390×844 mobile layout, toggled it and observed the saved state. Reload preserved the data. The production dashboard displayed live updates. Inspected the 1440×1000 desktop layout; the mobile document width was 375px within a 390px viewport, with no horizontal overflow. Sign-out returned to the sign-in form. These checks cover two viewport sizes, not every browser/device combination.

Screenshots contain synthetic QA profiles only: [desktop](previews/connected-desktop.png), [mobile](previews/connected-mobile.png). Test records are removed after QA; they are not starter content for new accounts.

## Problems found and resolved

- Neon Auth initially rejected localhost signup: configured explicit trusted local domains.
- Mutations initially rejected the local origin: added canonical APP_ORIGIN validation.
- React development effect remount closed a reused Realtime client: recreate the client within effect setup and close it during cleanup. Confirmed the repaired browser displays live updates.
- The preview Realtime SDK retained transport timers after test cleanup: the test runner exits after subscriptions close and assertions finish.

## Not yet verified or implemented

Recovery screens call the provider, but delivery to a real mailbox and a full password reset are unverified. No public HTTPS deployment, load test, full accessibility audit or security audit has been completed. Native client integration, device enforcement, location, real requests, co-parent permissions and media streaming are not implemented. The database's realtime service is for account updates and cannot replace WebRTC media infrastructure.

## Device pairing milestone (24 October 2026)

Migration 003 passed first on the schema-only Neon branch `sideby-pairing-check`, then on the configured development backend. This is an additive schema change; no existing family records were changed. The test branch expires automatically on 25 October.

`npm run build` and `npm run typecheck` passed. The production-mode local server was used for API and browser checks. `scripts/verify-pairing.mjs` passed 70 HTTP checks plus response/database assertions and covers authenticated family isolation, Origin checks, multiple devices, single-use claims, concurrent approval, retry behavior, archive/restore, revocation, code generation/attempt limits, expiry, oversized/invalid payloads and secret-free parent responses. The existing `scripts/verify-services.mjs` also passed all live Auth, Postgres, private Storage, Realtime and child-route regression checks.

The local Postman collection `postman/collections/pairing-security` passed structural lint and all 12 assertions over four requests. No Postman workspace publication was performed. The companion was simulated with HTTP requests to the real implementation and Neon backend; this does not validate a physical Android app.

Browser QA used synthetic accounts at 1440×1000 and 390×844: parent code creation, automatic pending-claim display, approval disabled until the comparison checkbox is selected, and no mobile document overflow. See [desktop](previews/device-pairing-desktop.png) and [mobile](previews/device-pairing-mobile.png). Live media and pause remain disabled regardless of pairing status.

Physical Android pairing, secure credential storage on Android, production edge rate limiting and full accessibility/device-matrix testing remain unverified or pending. No live media or device enforcement was added.

## Public website and documentation (24 October 2026)

Added a separate Next.js static website workspace and updated the parent app README, roadmap and readiness guidance. Root `npm run build` and `npm run typecheck` passed for both applications. The final website build passed after fixing mobile overflow from decorative rings. Browser checks covered navigation, FAQ expansion by pointer and keyboard, missing images/anchor targets, and 1440×1000 / 390×844 layouts. The mobile document width was 375px within the 390px viewport. No accounts, database records or device content were created by these website checks.

Synthetic illustration previews: [desktop website](previews/website-desktop.png), [mobile website](previews/website-mobile.png). Deployment verification is tracked in [DEPLOYMENT.md](DEPLOYMENT.md). These checks do not replace a full accessibility audit.

Public hosting verification: Vercel production deployment reached READY, the Cloudflare CNAME passed Vercel verification, and both the Vercel URL and custom domain returned HTTP 200 with expected content. A live browser load passed at 390×844 with a 375px document width and zero missing images. See [live mobile preview](previews/website-live-mobile.png).
