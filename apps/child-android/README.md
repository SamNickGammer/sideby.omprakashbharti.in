# Sideby Connect — Android

Visible Kotlin companion for testing device connection to Sideby Parent. This first implementation supports pairing, parent confirmation, encrypted credential storage, check-ins, reconnect and revoked-connection handling. It requests **only INTERNET**. No phone content is collected and no restrictions are enforced.

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

After each successful foreground check-in, the app sends its own permission statuses, app version and Android API version. Open **Permissions on this device** to inspect the same information locally. Only Internet is currently implemented and granted; other listed capabilities are unavailable. No new sensitive permissions are requested and no phone content is read. Report failures retry on the next check-in without removing the pairing. Upgrade with `adb install -r` to preserve the existing connection. The backend requires migration 004. See [permission contract](../../docs/DEVICE_PERMISSIONS.md).
