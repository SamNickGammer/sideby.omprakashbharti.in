# Sideby Connect — Android

Visible Kotlin companion for testing device connection to Sideby Parent. It supports pairing, parent confirmation, encrypted credential storage, check-ins, reconnect and revoked-connection handling. Internet access is automatic; optional **Usage Access** can be configured from the permission page. Version 0.5.0 supports separately opted-in usage/content snapshots and visible live sessions described below. Location and device restrictions remain unimplemented.

## Open and build

Open this directory in Android Studio. Use JDK 17+ compatible with Gradle 9.4.1 (tested with Android Studio's bundled JDK 25), Android SDK 37 and Android Gradle Plugin 9.2.0. The Gradle wrapper pins the distribution and SHA-256. Configure your SDK through Android Studio or ignored `local.properties`.

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

Debug APK: `app/build/outputs/apk/debug/app-debug.apk`. Debug package: `in.omprakashbharti.sideby.connect.debug`. Install with Android Studio Run or `adb install -r app/build/outputs/apk/debug/app-debug.apk`. APKs and local signing keys are not committed. The unsigned release build is a compilation check, not a distributable release.

## Test with the local parent dashboard

1. Follow [Neon setup](../../docs/NEON_SETUP.md), then run `npm run dev` from the repository root. The backend remains on your computer; its configured Neon services are cloud-hosted.
2. Start an Android emulator (or connect a USB test phone with USB debugging enabled).
3. Run `adb -s <serial> reverse tcp:3000 tcp:3000` to forward the device's port to your local dashboard. The parent server can stay bound to `127.0.0.1`.
4. Open Sideby Connect. Keep the debug server at `http://127.0.0.1:3000`, choose a device name and enter a pairing code from Child’s Space → Devices in the local parent dashboard.
5. Compare the confirmation number on both screens. Approve only when they match.
6. Keep the app open: it checks approval every five seconds and sends check-ins every 60 seconds after approval. “Check in now” is also available.
7. Disconnect the device in Sideby Parent. The next check-in removes the invalid credential locally and asks for a new code.

A paired device is not proof of background connectivity. Check-ins pause while the app is closed; no foreground service or background worker is included. The dashboard reports last-seen time, not guaranteed online status. Physical-device compatibility requires separate testing.

## Security and lifecycle

- Generate and persist the random credential **before** claiming. Retries reuse it after a lost response.
- Session data is encrypted with an Android Keystore AES-GCM key; cloud backups and device transfers are excluded.
- Codes are removed from stored sessions once a heartbeat confirms approval. Credentials and codes never enter URLs or logs.
- Release builds require HTTPS and protect screen/recents capture. Debug builds allow HTTP only to localhost, 127.0.0.1 and the emulator host alias 10.0.2.2, for synthetic local testing; screenshots are permitted for QA.
- HTTP redirects are rejected; connection/read timeouts are eight seconds and responses are size-limited.
- “Forget this connection” stops this installation's check-ins and removes its locally stored credential. It does not call a server revocation endpoint: the parent must also disconnect/cancel it.
- Credentials expire after 90 days under the existing backend contract. Archive or revocation invalidates check-ins. Android asks to re-pair after an authenticated connection receives 401.

## Source map

`MainActivity.kt` owns the visible UI and foreground polling. `ConnectionPolicy.kt` validates origins/codes and generates credentials/fingerprints. `PairingApi.kt` implements the existing two companion endpoints. `SecureSession.kt` stores encrypted connection state. Network security configuration differs between debug and release source sets.

[Pairing contract](../../docs/PAIRING.md) · [Android verification](../../docs/ANDROID_CONNECTION.md) · [Parent readiness](../../docs/PARENT_WEB_READINESS.md)

## Reproducible QA

Policy unit tests cover HTTPS/local-host restrictions, malformed origins/codes and credential/fingerprint format. `scripts/android-fixture.mjs` creates only synthetic fixtures against localhost and supports `create`, `offer`, `status`, `approve`, `revoke`. Credentials remain in ignored `.test-android.json`; never print or commit it. Recorded account IDs use the existing cleanup workflow. Browser approval is preferred for user-flow evidence; the fixture approval action is for API integration testing.

The local Postman simulation models pending approval only; see `postman/mocks/sideby-pairing/README.md`. It does not establish real backend integration. Clean up recorded synthetic accounts with `node --env-file=.env.local scripts/cleanup-test-data.mjs` after testing, then remove the ignored fixture file and forget the test connection on the device.

## Permission reports (0.2.0)

After each successful foreground check-in, the app sends its own permission statuses, app version and Android API version. Open **Permissions on this device** to inspect the same information locally. Internet is automatically granted; version 0.2.1 adds optional Usage Access setup described below. Permission reports themselves contain no phone content. Version 0.4.0 adds separately enabled data sharing; see below. Report failures retry on the next check-in without removing the pairing. Upgrade with `adb install -r` to preserve the existing connection. The backend requires migration 004. See [permission contract](../../docs/DEVICE_PERMISSIONS.md).

## Permission setup (0.2.1)

Open **Permissions on this device**, read the Usage Access explanation and choose **Set up Usage Access**. **Not now** skips setup. Android settings owns the grant/revoke switch; return to Sideby to refresh and upload the status automatically. **Refresh and send status** retries on demand. Location remains unavailable. Camera, microphone and screen sessions are approved separately in Live sharing. Contacts, notifications, supported SMS/calls and selected photos have separate controls in Manage data sharing. Permission alone does not enable collection; use the separate sharing control below.

## Digital wellbeing (0.3.0)

Open **Permissions on this device**, allow Usage Access, then separately choose **Enable usage sharing** and confirm the disclosure. This sends today's app names/package IDs and estimated foreground durations to **Child’s Space → Digital wellbeing** at check-in or manual refresh while Sideby is open. Use another app, return to Sideby and check in to update the dashboard. Sharing is off by default, including upgrades from 0.2.x. The permission alone does not enable it.

**Stop usage sharing** stops collection immediately; the latest server snapshot is cleared on the next successful sync. Permission revocation also clears app data when reported; parent disconnect clears it immediately. Offline changes cannot erase the server until delivered. Queries stay local; only a bounded summary is uploaded, not raw events. Limited launcher-app visibility is used to label observed apps; this is not a full installed-app inventory. See [usage contract and accuracy limits](../../docs/USAGE.md). Migration 005 must be applied before backend use.

## Data sharing in 0.4.0

Open **Manage data sharing**. Each category starts off; grant Android access where required and separately enable sharing. Installed apps covers launcher-visible apps only. Notification previews require Notification Access and a nonempty source selection, and are collected only while this screen is visible. Private/code-like content is withheld. Contacts contain names/numbers only; SMS and call logs require supported installer permissions and cover at most 100 recent records. No call recording or chat scraping.

Use **Choose a photo**, inspect the preview, then **Share this selected photo**. Only that selection is uploaded; a new selection replaces the old one. Clear shared photos removes the parent's copy, not the original. Stop controls clear other categories on successful connection. Use **Sync shared data now** and inspect the per-category result. Failed/offline requests are not reported as successful.

Migration 006 is required. Direct APK distribution is the current development choice; Play permission eligibility is not approved. Debug-only ContentTestActivity contains explicit synthetic QA tools, absent from release APKs. See [contract](../../docs/DEVICE_CONTENT.md).

## Live sharing in 0.5.0

Open **Live sharing** while the parent presses Start Screen/Camera/Audio. Review the request, tap Continue, and complete the Android permission dialog. Screen capture gets fresh OS approval each session and a notification with Stop sharing. Camera/audio stop on leaving this activity. Front/back switches acknowledge the actual camera callback. Sessions last at most five minutes and stop on control-plane loss. No recording, accessibility approval, boot capture or background request delivery. See [local media setup and contract](../../docs/LIVE_SHARING.md).
