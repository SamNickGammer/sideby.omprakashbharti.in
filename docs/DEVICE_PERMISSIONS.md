# Device permission visibility

This milestone reports permission state only. It does not collect messages, call logs, installed-app inventories, photos, location or media, enable Accessibility/device admin, or request camera, microphone, location or content permissions. Optional Usage Access setup is available; it reports the grant state without reading usage history.

## Contract

`POST /api/device/permissions` uses `Authorization: Bearer <device credential>`. Only an approved, unexpired, non-revoked installation on an active child may replace its own latest snapshot. No device/child/family ID is accepted. Maximum body size is 2 KiB. Unknown keys, missing permission keys and unknown values return 400; invalid credentials return 401; oversized bodies return 413.

Body v1: `{version:1, app_version:string (1–40), android_api:integer (26–100), permissions:{internet,camera,microphone,location,notifications,usage,photos,contacts,sms,call_history,screen_share}}`. Every permission value is `granted`, `not_granted`, `not_available` or `session_required`. `session_required` is valid only for screen sharing; `granted` is never valid for screen sharing because it is session consent, not a standing grant. Strings are status metadata, never personal content.

Response: `{status:"received", received_at:ISO timestamp}`. Server time is authoritative. Replace latest state (no history). An idempotent retry replaces the same device row. Existing bodyless heartbeat clients continue working. Old clients have no snapshot and the UI says Not reported.

Owner-authorized `GET /api/children/:id/devices` includes nullable `permission_report` and `permissions_updated_at` on each device; existing family ownership checks remain mandatory. Revoked, expired or archived devices may display historical reports but must never present grants as current. A report older than two minutes is stale even if heartbeats continue.

## UI and Android

A color-coded device-card summary opens a native modal dialog with text labels, timestamp, device/app version and a row per capability. Green means a recent device-reported grant, amber means not allowed or session consent needed, gray means unsupported/missing/stale. Color is not the only indication. Escape and close return focus to the opening button.

Android checks only permissions declared by this build. Unsupported features report not_available, not denied. INTERNET is automatically granted at installation. Usage Access is optional and user-controlled through Android settings. Its grant is checked through AppOps and reported as granted/not_granted. The permission setup page explains that no usage history is collected, supports skipping setup, refreshes on returning from settings, and can send status manually. All remaining capabilities are unavailable. The child app visibly lists the same snapshot and sends it after each foreground check-in and when the permission page resumes. Failure to send the report does not erase a successful pairing. Reports are self-reported status, not hardware attestation or proof that content syncing works.

## Validation

Verified on Neon dev: root web build and TypeScript checks; Android debug/release builds, unit tests and lint; 87 HTTP checks plus snapshot assertions in `scripts/verify-pairing.mjs`. Coverage includes strict report validation, latest snapshot replacement, owner isolation, pending/archived/revoked/expired credential rejection, body limits and legacy heartbeats.

An existing paired API 37 emulator was upgraded without clearing its session. Its real report arrived in dev (Internet granted, ten unsupported capabilities), and the Android permission dialog matched. Browser QA used synthetic accounts: modal content, current and historical reports, Escape close and focus restoration. The parent popup was visually checked at desktop width; mobile-browser, physical-device and older-Android validation remain pending. Apply migration 004 before deploying the updated backend; production was not migrated or deployed.

## Optional Usage Access setup

Android 0.2.1 adds a dedicated permission page with explanation, optional system-settings navigation, grant/revoke detection and manual refresh. It does not call UsageStatsManager or collect app activity. Actual digital-wellbeing data remains F06 in the tracker. Returning without granting access leaves pairing usable. No backend schema or contract change is required. See [Android UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager) for the special settings-based access model.

0.2.1 validation: Android debug/release builds, existing unit tests and lint passed; root web builds and type checks passed. The API 37 emulator initially stalled during installation and reported graphics errors. A cold boot using software rendering plus a non-streaming install succeeded without wiping storage, preserving pairing. Verified the setup explanation, Not now, Android settings grant, automatic return refresh and revocation. Both app and parent dashboard changed Not allowed → Granted → Not allowed. The dev database independently confirmed the granted report from 0.2.1-debug. Usage Access was restored to its original not-allowed state. No usage-history query or upload occurred. Physical phones and older Android remain untested.
