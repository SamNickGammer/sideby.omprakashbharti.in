# Sideby Parent web

The responsive parent dashboard and initial backend for Sideby. Built with Next.js, TypeScript, Neon Auth, Postgres, private Object Storage and Realtime. This is a tested web foundation, not a finished parental-control release.

## Run locally

From the repository root, use Node.js 22+ (locally validated on Node 24):

```sh
npm ci
# Follow docs/NEON_SETUP.md for provider configuration and migrations.
npm run dev
```

Open http://127.0.0.1:3005. Next loads `apps/parent-web/.env.local`; provider scripts use the root `.env.local`. Both are ignored. Use the names in the root `.env.example`, preserve the auth cookie secret, and keep APP_ORIGIN identical to the browser origin. Never commit credentials or put them in NEXT_PUBLIC variables.

```sh
npm run build --workspace=@sideby/parent-web
npm run typecheck --workspace=@sideby/parent-web
npm run start --workspace=@sideby/parent-web
```

Root `npm run build` and `npm run typecheck` check both web applications. Website development uses port 3001 separately.

## Implemented

- Signup, sign-in/out, family creation/rename, multiple child profiles, profile editing, archive/restore, private profile photos, JSON export and live account updates.
- Unrestricted usage by default; saved routines are preferences, not device enforcement.
- Bookmarkable Child’s Space sections with server-side owner checks and responsive contextual navigation.
- Optional Photo gallery, Contacts, Call history and Messages sharing views. Messages separates SMS and Social notifications, filtering actual shared sources.
- Expiring pairing codes, parent confirmation, multiple devices per child, heartbeat status and revocation. Simulated companion tests and the first Android emulator integration pass; see [Android evidence](../../docs/ANDROID_CONNECTION.md).

## Routes and source map

| Area | Location / responsibility |
| --- | --- |
| Authentication | `app/auth/[path]`, `lib/auth.ts`, `lib/auth-client.ts`, `proxy.ts` |
| Family dashboard | `app/dashboard`, `components/` |
| Child’s Space | `app/dashboard/children/[id]/[[...section]]` |
| Backend | `app/api/`, authenticated family ownership and validated inputs |
| Pairing | `lib/pairing.ts`, child pairing/device routes and device claim/heartbeat routes |
| Data | `lib/db.ts`, root `db/migrations/` |
| Private avatars | `lib/storage.ts`, owner-authorized avatar route |

See [API contracts](../../docs/API.md), [pairing](../../docs/PAIRING.md), [Child’s Space](../../docs/CHILD_SPACE.md), and [architecture](../../docs/ARCHITECTURE.md).

## Verification and safe test data

Build and type checks are safe local checks. Live service tests create synthetic accounts in the selected Neon environment; follow [Neon setup](../../docs/NEON_SETUP.md) before running them. `scripts/verify-services.mjs` covers backend services and family isolation; `scripts/verify-pairing.mjs` covers the pairing lifecycle. Run the documented cleanup afterwards. [Optional demo data](../../docs/DEMO_DATA.md) is separate from disposable QA accounts.

[Test evidence](../../docs/VERIFICATION.md) records what was actually checked. Browser previews use synthetic profiles only.

## Before Android and before public launch

The Android connection foundation covers visible installation, pairing, confirmation, secure credential storage, heartbeat and revocation. Optional data sharing is described below. It does not require notification, SMS, contacts, camera or microphone permissions. See [readiness](../../docs/PARENT_WEB_READINESS.md).

Recovery email delivery, account deletion, retention, production rate limits, backups, monitoring and a wider accessibility/security review remain launch gates. Co-parent invitations, device activity, enforcement and media are not implemented. Pairing does not enable disabled controls.

For hosting and canonical origins, see [deployment](../../docs/DEPLOYMENT.md). Deploy this app as its own Vercel project; never give its secrets to the public website.

## Development and recovery

Use Git `dev` with Neon `dev`; see [environment setup](../../docs/ENVIRONMENTS.md). Local dev starts at port 3005. Forgot password now uses an emailed six-digit code, password confirmation, resend cooldown and generic acknowledgement. Email delivery and a completed real-mailbox reset must be verified by the account holder.

## Device permissions

Each device card now opens a permission-status dialog. Recent grants are green, missing grants/session consent amber, and unavailable or stale reports gray. Reports expire visually after two minutes; historical grants are never presented as current. This is status visibility, not content collection. Apply `db/migrations/004_device_permissions.sql` before running this version. See [contract and validation](../../docs/DEVICE_PERMISSIONS.md).

Usage Access may now show granted/not allowed after optional Android setup. The popup explains how to refresh status on the device; this does not indicate that usage history is syncing.

## Digital wellbeing

The usage route now shows per-device, explicitly shared daily app foreground durations, app names/package IDs, sample/receive timestamps and stale/off/denied/empty states. It polls every 15 seconds and never remotely wakes the companion. Requires migrations 004 and 005, companion 0.3.0, Android Usage Access and separate child-device sharing opt-in. Full installed-app inventory remains separate. See [usage contract](../../docs/USAGE.md).

## Device content pages

Companion 0.4.0 and migration 006 connect installed apps, notification/social previews, selected photos, contacts and supported SMS/call records to their existing routes. Choose the source device; search/filter records and inspect sample/receipt times. **Clear shared data** removes the current snapshot; stop on the device prevents later uploads. Photos are owner-authenticated private images. All categories require separate device opt-in; SMS/calls may remain unavailable because of Android/installer restrictions. See [contract and test scope](../../docs/DEVICE_CONTENT.md).

## Live screen, camera and audio

The three live routes now use real LiveKit subscriptions after device approval. Choose a paired device, press Start, and accept on Sideby Connect. The parent cannot publish tracks or control touch input. Stop is available on both sides; lens changes show requested versus acknowledged state. Requires migration 007, companion 0.5.0 and the separate media supervisor. Camera/screen have no implicit microphone track. See [live contract and local startup](../../docs/LIVE_SHARING.md). Production media hosting remains pending.
