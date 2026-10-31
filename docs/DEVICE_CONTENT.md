# Device content sharing contract

Defined before implementation. Local development only; all sharing starts disabled per paired installation. No stealth mode, accessibility scraping, permission bypass or remote activation.

## Device and parent APIs

`POST /api/device/content/:kind` uses the paired device Bearer credential. Kinds: apps, notifications, contacts, sms, calls, photos. Strict version 1 snapshots: `{version:1,status:"ready"|"disabled"|"no_permission"|"unavailable",generated_at:ISO,items:[],omitted:0}`. Non-ready snapshots have no items. Reject unknown keys, duplicate IDs, old samples, excessive bodies and invalid types. Samples must be within 48h and no more than five minutes ahead. Equal timestamps are idempotent; retries do not append records. Device authority is checked again atomically when saving. A revoked/expired device or archived child cannot upload.

Limits/fields: apps 500 launcher-visible packages (id/package, name, version, system boolean); contacts 200 phone-number rows (id, name, number); notifications 100 source-allowed previews from the previous 24h (id, package, app, title, text, time, redacted); SMS 100 records (id, address, body, time, direction) and calls 100 records (id, number, type, duration seconds, time), only where the installer/OS permits them. No chat scraping, call audio, hidden/private notification text, OTPs or historical notification backfill. Numeric-code-like and explicitly sensitive previews are redacted defensively; detection is not guaranteed classification.

Metadata snapshots have a 256KiB request limit. Photos are at most three explicitly selected images per snapshot, total request limit 3MiB, each image base64 up to 900KiB. The device previews selections and requires Share. Server decodes/re-encodes bounded images to WebP without EXIF, stores private objects, and keeps only opaque IDs/keys in the database. No gallery-wide read permission is needed. Photos are replaced only by another explicit selection or Clear; ordinary check-ins never erase them.

`GET /api/children/:id/content/:kind` requires owner session; returns devices with name, inactive state, report and received_at. Every resource is child/family checked; inactive/permission-revoked device content is withheld. Photo URLs use authenticated owner-only proxy `GET /api/children/:id/photos/:photoId`, never public storage links. Responses are no-store.

`DELETE /api/children/:id/content/:kind?device=UUID` clears a snapshot immediately for the parent. Device can share again only on a later authorized sync; this is deletion, not a remote opt-out. Device Stop clears local buffers and sends disabled; offline clearing is visibly pending until connectivity returns. Permission report revocation clears the corresponding content snapshot. Disconnect clears all content. Photo objects removed from snapshots are queued for deletion and retried by cleanup, avoiding public or dangling authorized access.

## Collection scope and retention

Installed apps means launcher-visible apps, not guaranteed full system/work-profile inventory. Latest snapshot replaces previous; no inventory history. Contacts are name/number only, separately opted in. Notification access is platform-controlled, with a separate source allowlist and sharing switch; local buffer is bounded to 100 previews/24h, collected only while the Sideby sharing screen is visible. Foreground sync only. Social messages are notification previews, not full conversations. SMS/call access can be refused by Android even after installation; no installer permission allowlisting or role takeover is performed by this app.

Latest snapshots persist until replacement, stop, revoke, disconnect or explicit deletion. Notification/SMS/call events older than the stated window are withheld on reads even while offline. No automatic deletion from backups is claimed. Physical-device/distribution review, production TTL/backup deletion and background work remain launch gates.

## Required verification

Synthetic emulator fixtures only. Grant/deny/revoke, source selection, replacing/deleting photos, unauthorized image/metadata reads, invalid payloads, retry/older sample, multiple devices, expiry/disconnect, Android build/unit tests/lint and parent build/typecheck. Tracker completion requires actual device-to-dashboard proof per kind.

## Distribution decision

The owner chose direct APK installation for this milestone. The main APK declares READ_CONTACTS, READ_SMS and READ_CALL_LOG and requests normal Android runtime consent. Installer allowlisting is outside Sideby's control; a denied restricted permission remains denied. Google Play eligibility has not been established; remove gated permissions or obtain a qualifying policy approval before publishing there.

Platform references: [restricted permissions](https://developer.android.com/reference/android/Manifest.permission#READ_SMS), [Google Play SMS/call restrictions](https://support.google.com/googleplay/android-developer/answer/10208820), [package visibility](https://developer.android.com/training/package-visibility), [photo picker](https://developer.android.com/training/data-storage/shared/photo-picker), [sensitive notification protection](https://developer.android.com/about/versions/15/behavior-changes-all).

Private image deletion uses a durable queue. Ordinary replacement/clear drains queued jobs; `node --env-file=.env.local scripts/cleanup-content-storage.mjs` retries failures on dev. Uploads interrupted before commit become eligible for cleanup after 30 minutes. A production cleanup schedule is required before release. The parent image proxy denies access immediately after removal, regardless of cleanup status.

Debug-only ContentTestActivity provides synthetic notification/contact fixtures with normal permission requests. It is absent from release builds. Fixture creation is explicit; it never reads or modifies existing contacts. Notification previews are held in memory only, so restarting Sideby discards the local buffer.

## Verification — 31 October 2026

- 140 live content HTTP checks plus assertions: all six kinds, family isolation, invalid fields/body limits, timestamps/retries, permission revocation, two devices, expiry/archive/disconnect, private image reads, replacement/deletion and durable storage cleanup.
- Regressions: 59 usage checks and 87 pairing checks; 13 Android unit tests (including allowlist/sensitive-preview policy), debug/release builds, lint and root build/typecheck.
- Actual paired API 37 emulator: 21 launcher apps; test APK install/update/uninstall reflected as 22 apps with version 1.0 → 2.0 → removed. One synthetic contact, SMS, call record, selected photo, plus two notification previews (one redacted) reached dev. Parent routes displayed the corresponding synthetic content. Real notification Stop cleared the snapshot.
- APK upgrade and emulator cold restart retained pairing. Emulator System UI intermittently hung during installation; a restart without data wipe restored it. This is not physical-phone, older-Android or production certification.
