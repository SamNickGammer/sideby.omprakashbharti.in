# Digital wellbeing — today’s app usage

## Scope and consent

F06 reports estimated foreground time per app for the device's current local day, only after a separate **Enable usage sharing** opt-in in Sideby Connect and Android Usage Access. Permission alone does not opt in. Collection and sync run while Sideby is open, at check-in or manual refresh. No raw event timeline, message content, URLs, installed-app inventory, pickups, or background service usage is collected.

Android aggregates usage events locally, clipping intervals to local midnight and sample time. It reads a preceding-day window to recover cross-midnight sessions, unions overlapping activities within each app, and closes intervals on pause/stop, screen-off, lock and shutdown. OS event omissions, multi-window behavior and vendor differences mean these are estimates; summed app foreground time is not a certified device screen-time metric. Names may fall back to package identifiers under package visibility restrictions. Up to the 100 most-used apps are reported, with an omitted count.

## Contract (defined before implementation)

`POST /api/device/usage` uses the existing device Bearer credential. Only an approved, active, unexpired, non-revoked installation may replace its own latest report; no device/family/child IDs are accepted. Maximum JSON body: 64 KiB. Strict v1 shape:

```json
{"version":1,"status":"ready","generated_at":"2026-10-31T12:00:00.000Z","day":"2026-10-31","timezone":"Asia/Kolkata","period_start":"2026-10-30T18:30:00.000Z","apps":[{"package_name":"example.demo","name":"Demo","foreground_ms":60000}],"omitted_apps":0}
```

Statuses: `ready`, `disabled`, `no_permission`, `unavailable`. Non-ready reports must have an empty app list and zero omissions. All fields are required. Unique packages; package length 1–255, display name 1–80; positive integer foreground milliseconds bounded by the sample interval (at most 26 hours). Timezone must be valid; day and period_start must match local midnight and generated_at's local date. Sample time is allowed within the previous 48 hours and at most five minutes in the future. Unknown keys/invalid data return 400, oversized bodies 413, unauthorized devices 401, ready reports without a currently reported Usage Access grant 409.

A transaction locks the device row, verifies authority and permission, and replaces the snapshot only if generated_at is newer than the prior sample. Equal timestamps are harmless retries; older reports return 409. Response: `{status:"received",received_at:ISO}`. Latest snapshot only; retries never add durations. Server receipt and device sample time are separate fields.

`GET /api/children/:id/usage` requires the parent's session and family ownership (401/404 otherwise), returns `{devices:[{id,name,inactive,report,received_at}]}`. Inactive devices and revoked permissions expose no usage content. Device credentials cannot read this endpoint. Headers prohibit caching. No combined cross-device total is implied.

## Retention and revocation

One latest report per device, overwritten on successful sync; no historical/day-series store. Stop sharing sends `disabled` with no apps on the next successful connection. Permission revocation clears stored app data when its permission report reaches the server; disconnect clears immediately. Offline stop/revoke cannot delete server data until delivered; the dashboard labels old samples stale after two minutes. Archived/expired devices cannot send new reports and their data is withheld. Latest stored snapshots otherwise remain until replaced or family/device data is deleted; time-based purge and production retention policy remain launch gates.

## Dashboard

Digital wellbeing selects a device and shows day/timezone, sample and server receive times, estimated total, sorted app durations and proportions. Distinguish no device, no report/old companion, sharing off, permission needed, collection unavailable, ready-but-empty, inactive and stale/previous-day states. Parent refresh never pretends to remotely wake a device. Installed apps remains a separate empty inventory view.

## Verification

Verified locally on 2026-10-31 with Neon dev and API 37 emulator, companion 0.3.0:

- `scripts/verify-usage.mjs`: 59 HTTP checks plus snapshot assertions, including two independent devices, ownership, validation, retry, stale report, stop/revoke, expiry/archive and disconnect.
- Existing pairing regression: 87 HTTP checks plus assertions.
- Ten Android unit tests (five usage aggregation, five connection-policy); debug/release builds and debug lint pass. Root build/typecheck pass.
- Controlled Settings foreground activity produced 18,671 ms in the device summary; the parent dashboard rendered Settings with 18s. Real app rows appeared after explicit opt-in.
- Stop sharing changed the actual dashboard to “Usage sharing is off”; revoking Usage Access changed it to “Usage Access is needed”, with app rows removed. Restoring access resumes reports.
- Emulator restart and in-place APK upgrade preserved pairing. Physical devices, vendor event omissions, older Android versions, mobile browser layout and production deployment remain unverified.

Activity class names are used to correlate intervals; multiple instances of the same class and missing OS events can affect estimates. No claim of parity with Android Digital Wellbeing totals is made.

References: [Android usage events](https://developer.android.com/reference/android/app/usage/UsageEvents.Event), [UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager).
