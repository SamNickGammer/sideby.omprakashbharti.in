# Web API contract

All /api/family, /api/children, /api/routines, /api/avatar, /api/export and /api/live routes require a Neon Auth session. Server derives the family owner from that session; never accept an owner ID from request JSON. Mutations also require a matching Origin header. Responses use no-store. Error shape: {error: string}; 401 for missing sessions, 403 for origin failures, 404 for inaccessible resources, 400 for invalid input, 503 for upstream failure. UUIDs and lengths are validated. Live-token requests must match the page's original user ID.

- GET /api/family: current parent, optional family, active/archived children and saved routines.
- POST /api/family: {name}; create the signed-in parent's family once.
- PATCH /api/family: {name}; rename family.
- POST /api/children: {name, age, color}; create a profile (not a device).
- PATCH /api/children/:id: {name, age, color, archived}; edit or archive/restore own profile.
- POST /api/routines: {name, start_time, end_time, days, enabled}; save family routine.
- PATCH /api/routines/:id: same fields; edit saved routine.
- DELETE /api/routines/:id: remove own routine after UI confirmation.
- POST /api/avatar/:childId: multipart image; JPEG/PNG/WebP only, 2 MB maximum, normalized/reencoded to WebP before private storage. Membership required.
- GET /api/avatar/:childId: authorized private image response, no shared caching.
- GET /api/live?userId=: sealed family revision query and endpoint URL; its capability expires after 60 seconds and renews through an authenticated endpoint.
- GET /api/export: authenticated family data as downloadable JSON.
- /api/auth/*: Neon SDK same-origin auth proxy. No custom password storage.

Database schema and revision updates are transactional. A family revision subscription invalidates the authenticated family snapshot. Child archive is reversible. Routines are saved preferences, not enforced until a real device companion exists. Companion pairing and heartbeat endpoints are documented in [PAIRING.md](PAIRING.md); no usage ingestion or media endpoints exist yet.

## Child Space revision

Child creation/update now accepts `{name, age, color, archived?}` only. `daily_limit` is no longer a request or response field: children have unrestricted usage by default. Legacy stored preferences are retained but are not enforced. Migration 002 makes the legacy column nullable with a NULL default for new profiles.

Child pages use `/dashboard/children/:id` (overview) and `/dashboard/children/:id/:section` for usage, apps, notifications, screen, camera, audio, photos, messages, contacts, call-history, accounts, services, devices and settings. Every direct URL verifies the session and family ownership on the server; unknown child IDs/sections return 404. Child is not a device. Pairing and heartbeat APIs exist; pause, media and usage APIs remain unimplemented. Unpaired controls are disabled; selecting a camera only changes the requested lens in the UI.

## Email-code recovery

The existing `/api/auth/[...path]` Neon adapter proxies the SDK. `emailOtp.sendVerificationOtp({email,type:"forget-password"})` requests a recovery code. A generic success acknowledgement does not reveal account existence or prove email delivery. `emailOtp.resetPassword({email,otp,password})` submits the code and new password. The provider validates the code, expiry and attempts; the UI confirms passwords match, enforces 12–128 characters and disables resending for 60 seconds. Code/password values are not saved in browser storage. Provider errors remain visible and retryable. This replaces the default forgot-password reset-link request while preserving the legacy reset-link route.

Device permission status reporting is implemented separately from heartbeat: see [permission contract](DEVICE_PERMISSIONS.md). It accepts status metadata only, with the same active-device credential boundary.

## Opt-in Digital wellbeing

Companion 0.3.0 can share today’s estimated app foreground durations after separate visible opt-in and Usage Access. The device can write only its own bounded latest snapshot; parent reads enforce family ownership. Stop/revoke/disconnect clear or withhold data as described in [the usage contract](USAGE.md). Foreground-only syncing, no raw events, no historical series, and no full installed-app inventory. Enforcement and other content/media capabilities remain unimplemented.
