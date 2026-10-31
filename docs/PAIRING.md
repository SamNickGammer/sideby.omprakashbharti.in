# Device pairing contract

This milestone connects device identities and reports heartbeats. It does not collect usage, notifications, location or media, and does not enforce pause. Sideby Connect for Android implements this contract with foreground-only check-ins; see [setup](../apps/child-android/README.md) and [verification](ANDROID_CONNECTION.md).

## Parent endpoints

Neon session, owner authorization and matching Origin on mutations are required. All responses are no-store; errors follow docs/API.md. Archived children cannot pair or authenticate devices.

- `GET /api/children/:id/devices` → `{devices, pairing}`. Devices expose id, name, platform, created_at, last_seen_at, revoked_at. Pairing exposes id, status, expires_at, device_name, verification (never hashes or credentials). Expired/locked offers are reported as expired/locked. One outstanding offer per child; multiple devices per child.
- `POST /api/children/:id/pairing` → 201 `{id, code, expires_at}`. Replaces any outstanding offer. Code is 16 random hexadecimal characters, displayed in four groups. Valid for 10 minutes; stored as SHA-256 plus an indexed 8-character selector. Maximum five offers per child per 10-minute window. 429 when exhausted. Code returned only at creation; reload requires generating another.
- `PATCH /api/children/:id/pairing` with `{id, action: "approve" | "cancel"}` → `{ok:true}`. Exact offer UUID prevents stale tabs approving/rejecting replacement offers. Approve only an unexpired pending claim after comparing verification code with the device. Retry approval of the same already approved offer succeeds without creating another device. Cancel ends an offered/pending offer; already approved offers must use device disconnect. Unavailable transitions return 409.
- `DELETE /api/children/:id/devices/:deviceId` → `{ok:true}`. Revokes the owned device credential; repeat succeeds. Unknown/cross-family → 404.

## Companion endpoints

No parent cookie is used. Use HTTPS outside localhost. No CORS grants. JSON bodies capped at 2 KiB. The companion clearly discloses pairing, generates and securely stores a 32-byte cryptographically random credential encoded as 64 lowercase hex characters **before** claiming, and retries with the same credential after network failure. Never send credentials or codes in URLs, analytics or logs.

- `POST /api/device/claim` with `{code, credential, name, platform:"android"}` → `{status:"pending"|"approved", verification}`. Name 1–60 characters. Code permits spaces/hyphens and is case-insensitive. First valid claim reserves the offer; another credential cannot take it. Retries of the identical claim are safe until expiry. Five wrong secrets for an existing selector lock an unclaimed offer. Invalid, expired, consumed-by-another-device, cancelled and locked codes all return generic 404. A pending claim cannot authenticate a device. Verify the 8-character fingerprint on both screens before the parent approves. Names are self-reported, not proof of identity.
- `POST /api/device/heartbeat` with `Authorization: Bearer <credential>` and no body → `{id, status:"connected", server_time}`. Only an approved, non-revoked device attached to an active child may update its own last_seen_at; otherwise 401. Persist the credential in Android secure storage. Poll heartbeat every 60 seconds after approval; 401 before approval means wait for parent approval, after approval means stop and re-pair. No family/child information is exposed. Credentials expire after 90 days and require re-pairing in this milestone.

A recent heartbeat means “Seen recently”, not guaranteed online. After two minutes show last seen/offline; no heartbeat means “Waiting for first check-in”. Archive disables device access; restore re-enables unrevoked/unexpired credentials. Disconnect permanently revokes that installation. These endpoints grant no monitoring capability.

## Security and operations

Pairing creation and claiming serialize on the child/offer rows. Approval consumes the pending offer and creates a device atomically. Family revision changes on pairing and device mutations. Hashes are never returned by parent APIs or exports. No IP-based authorization or spoofable forwarded-header limiter is used. Per-offer attempt limits and 64-bit random codes protect guessing; deployment still requires trusted edge request limits for the unauthenticated claim/heartbeat routes to prevent resource exhaustion. No device permissions are inferred from pairing.

Migration 003 is additive and repeatable. Run migration validation on a temporary Neon branch before applying it to the configured development database. Run `scripts/verify-pairing.mjs` against the local app for synthetic end-to-end tests; credentials are kept in ignored test files and cleaned with the existing cleanup script.

```sh
node --env-file=.env.local scripts/verify-pairing.mjs
postman collection lint postman/collections/pairing-security
postman collection run postman/collections/pairing-security --no-report-events
node --env-file=.env.local scripts/cleanup-test-data.mjs
```

The checked-in Markdown contract is authoritative. The Postman collection checks public rejection boundaries; the Node script exercises the full authenticated lifecycle and concurrency against the real local server. Native clients must generate a fresh credential for each pairing and show `SHA256("verify:" + credential).slice(0, 8).toUpperCase()` for comparison.

## Device permission status

The approved device credential can replace only its own latest permission snapshot through `POST /api/device/permissions`. The owner-authorized device list returns that snapshot. Reports contain fixed status keys plus app/API version, never phone content. This does not grant access to messages, calls, camera or screen. Android sends reports after foreground check-ins and exposes a visible local status dialog. See [Device permissions](DEVICE_PERMISSIONS.md) for the strict schema, freshness and consent distinctions.
