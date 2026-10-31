# Sideby feature board

Last reviewed: 31 October 2026. This is the working checklist for the project, including Android, backend, parent web, website and future parent mobile work.

## How to read and maintain this board

- `[x]` means the stated item is implemented and verified within its stated scope. It does **not** automatically mean merged, deployed or production-ready.
- `[ ]` means not complete: planned, in progress, blocked or awaiting verification. Keep partially completed parent features unchecked; tick individual completed submodules underneath.
- Board lanes below show **Done**, **Review**, **Next**, **Backlog** and **Launch gates**. Move an entire feature only when its acceptance checks pass; preserve its stable ID.
- Before starting a new request, add or update its card, list Android/backend/dashboard work and identify dependencies. Mark the active card **In progress**. After work, record evidence, remaining limitations, PR/merge status and deployment scope.
- A screen, permission grant, successful upload and displayed result are separate milestones. Do not tick end-to-end completion until a real supported device flow reaches the correct parent's dashboard.
- Keep test evidence synthetic. Never put credentials, real child content or production records here.

Current milestone: **F07–F11 — optional device content sharing implemented and emulator-verified locally**, on `feat/device-content-sharing`; [PR #19](https://github.com/SamNickGammer/sideby.omprakashbharti.in/pull/19) awaits owner review and depends on #17. SMS/call access remains installer-dependent.

Previous milestone: **F06 — today’s Digital wellbeing implemented and emulator-verified locally**. F05a/F05b are implemented locally; PR #15 is still pending. F07 installed-app inventory remains separate.

## Done — implemented foundation

### F01 · Project, brand and public website

- [x] Repository structure separating website, parent web, child Android and reserved parent mobile.
- [x] Sideby brand assets, logo variants and preview.
- [x] Product, architecture, security, API, setup and contribution documentation.
- [x] Git conventions: feature PRs; shared maintenance branch for routine changes.
- [x] Public landing page with product information and FAQ.
- [x] Public website deployed on Vercel with the custom domain and HTTPS.
- [ ] Trademark/name clearance before public release.

Evidence: [root README](../README.md), [brand](../assets/brand/README.md), [website](../apps/website/README.md), [deployment record](DEPLOYMENT.md). Website hosting does not host the parent backend.

### F02 · Parent account and family foundation

- [x] Backend: Neon Auth, Postgres, private Object Storage and Realtime integration.
- [x] Dashboard: signup, sign-in and sign-out.
- [x] Email-code password reset; owner confirmed successful recovery in dev.
- [x] Create/rename a family; one owner manages multiple children.
- [x] Add/edit child profiles; private avatars; archive and restore.
- [x] New children have unrestricted usage, without a required daily allowance.
- [x] Save family routines and toggle them; these are preferences, not enforced rules.
- [x] JSON family export and live account updates.
- [x] Server-side family isolation and input validation checks.
- [x] Isolated Neon dev environment; local dashboard on port 3005.

Evidence: [API](API.md), [verification](VERIFICATION.md), [environment setup](ENVIRONMENTS.md). Co-parent roles, permanent deletion and production hardening are separate backlog items.

### F03 · Parent dashboard and Child’s Space UI

- [x] Family dashboard with responsive layouts and centered avatar initials.
- [x] Own URL and contextual navigation for each child; compact family navigation.
- [x] Routes/empty states for usage, apps, notifications, gallery, messages, contacts, calls, screen, camera, microphone, accounts, services, devices and settings.
- [x] SMS / Social notification tabs and app filters in the Messages UI.
- [x] Shared phone-shaped screen/camera viewer and front/back selection UI.
- [x] Disabled/unavailable controls where device functionality is not implemented.

Evidence: [Child’s Space](CHILD_SPACE.md), [parent web README](../apps/parent-web/README.md). These checks confirm UI only; device content and streaming remain unchecked below.

### F04 · Device pairing and foreground check-ins

- [x] Android: visible installable companion, device name and pairing-code entry.
- [x] Backend: expiring pairing offers, claim, matching fingerprint and parent approval.
- [x] Android: encrypted credential storage, reconnect and foreground/manual check-ins.
- [x] Dashboard: multiple devices per child, approval, last-seen state and disconnect.
- [x] Backend: credential revocation, expiry, archive and cross-family isolation.
- [x] API 37 emulator: pairing, restart, network recovery and revocation verified.
- [ ] Physical-phone and older-Android testing; see F05.
- [ ] Production APK uses a configured HTTPS backend with no server-entry setup for families.
- [ ] Pairing-code entry polish using grouped/OTP-style boxes with paste and validation.

Evidence: [pairing contract](PAIRING.md), [Android verification](ANDROID_CONNECTION.md), [Android README](../apps/child-android/README.md). Check-ins currently require the app to remain open.

## Review — implemented locally, awaiting merge

### F05a · Permission-status visibility

Implementation: `feat/device-permission-status`, commit `b215bdd`; [PR #15](https://github.com/SamNickGammer/sideby.omprakashbharti.in/pull/15) is open as of this review.

- [x] Android: read this app's declared permission states and show a local status dialog.
- [x] Android: send status metadata after foreground check-ins; retain pairing on report failure.
- [x] Backend: authenticated latest snapshot, strict schema and server receive timestamp.
- [x] Dashboard: device-card summary and popup with green/amber/gray labels.
- [x] Dashboard: distinguish missing, unavailable and stale/historical reports.
- [x] QA: 87 API checks, web builds/type checks, Android builds/unit tests/lint.
- [x] QA: existing paired emulator report received; desktop modal and keyboard-close checked.
- [ ] Owner review and merge PR #15.
- [ ] Mobile-browser, physical-phone and older-Android verification.
- [ ] Apply migration 004 to production only as part of a separately approved parent deployment.

At the F05a milestone only Internet was granted. F05b adds optional Usage Access setup; other capabilities remain **unavailable**, not implemented or enabled. This card does not include asking for new sensitive permissions or collecting phone content. Contract is in `docs/DEVICE_PERMISSIONS.md` on PR #15 until merged.

### F05b · Optional Usage Access setup — implemented and tested locally

- [x] Android: dedicated permission setup page with explanations and availability labels.
- [x] Android: optional Usage Access settings flow, grant/revoke detection and refresh on return.
- [x] Android/backend: send changed permission status without clearing the pairing on failure.
- [x] Dashboard: explain how to change permissions on the device and distinguish grants from data syncing.
- [x] QA: Android debug/release builds, unit tests and lint; web builds and type checks.
- [x] QA: emulator skip/grant/revoke flow; dashboard changed Not allowed → Granted → Not allowed.

Implementation is on PR #15. Android 0.2.1 was installed without wiping storage. The paired connection survived a cold boot; Android settings grant and revoke both reached the parent dashboard. Usage Access was restored to its original not-allowed state after testing. Physical phones and older Android remain unverified.

Scope is permission setup/status only. Usage data collection remains F06. No sensitive runtime permission is requested for an unimplemented camera, microphone, location or content feature.

### F06 · App usage / digital wellbeing — local milestone complete

Review: [PR #17](https://github.com/SamNickGammer/sideby.omprakashbharti.in/pull/17), stacked on #15; awaiting owner merge.

- [x] End-to-end today’s app usage, with foreground sync, verified locally on API 37 emulator.
  - [x] Android: optional Usage Access setup (F05b).
  - [x] Android: separate sharing opt-in and stop/clear behavior.
  - [x] Android: today’s local-day aggregation with midnight and overlapping-activity tests.
  - [x] Android: granted/revoked/unavailable states, no data without access.
  - [x] Backend: bounded contract, latest-snapshot retention and device-authenticated ingestion.
  - [x] Backend: device/family isolation, idempotent retries, stale-report rejection.
  - [x] Dashboard: actual per-app durations, totals, device selector and sample/receipt times.
  - [x] Dashboard: off/denied/empty/inactive/stale states.
  - [x] QA: Settings activity recorded 18,671 ms; dashboard displayed 18s.
  - [x] QA: real emulator stop sharing and permission revocation remove app rows; restoring access resumes sharing.
  - [x] QA: pairing survives restart/update; API tests cover retries, two devices, cross-family denial, expiry/archive/disconnect.
- [ ] Release gate: physical-device accuracy and supported-Android review.
- [ ] Release gate: background sync, history/date-range UI and production retention policy.

Evidence: 59 usage HTTP checks plus assertions, 87 pairing checks, 10 Android unit tests, debug/release builds, lint, root web build/typecheck. Migration 005 applied to Neon dev only. This is not deployed or merged; depends on F05a/F05b (PR #15). Full inventory remains F07. See [usage contract](USAGE.md).

### F07 · Installed apps — local milestone complete

- [x] End-to-end launcher-visible app inventory on API 37 emulator.
  - [x] Android: separate opt-in; name, package, version and system-app flag; at most 500 apps.
  - [x] Backend: bounded latest snapshots, authenticated device ingestion, family isolation and clear controls.
  - [x] Dashboard: real records, search, source device and freshness.
  - [x] QA: synthetic app install (1.0), update (2.0), uninstall reflected in actual reports (21 → 22 → 21 apps).
- [ ] Full system/work-profile inventory is not promised; physical devices/older Android remain release gates.

### F08 · Notifications and social previews — local milestone complete

- [x] End-to-end optional, source-selected previews on API 37 emulator.
  - [x] Android: platform Notification Access plus separate opt-in and source allowlist.
  - [x] Android: collect only while sharing screen is visible; 100 previews / 24h in memory; clear on stop/revoke.
  - [x] Privacy: private/code-like previews withheld; no history scraping or hidden-content bypass.
  - [x] Backend: schema/ownership, bounded snapshots, duplicate replacement, revocation and deletion.
  - [x] Dashboard: Notifications and Messages → Social notifications, actual source filters and timestamps.
  - [x] QA: normal synthetic preview and withheld sensitive preview displayed; real Stop cleared both; API revocation/isolation tests pass.
- [ ] Background collection, physical-phone/older-Android verification and production retention remain release gates.

### F09 · Selected photo sharing — local milestone complete

- [x] End-to-end explicitly selected image sharing on API 37 emulator.
  - [x] Android: system photo picker, preview, explicit Share and Clear; no broad gallery access.
  - [x] Backend: image validation/re-encoding without EXIF; private storage and owner-authenticated proxy.
  - [x] Dashboard: bounded gallery, authenticated full-image view, clear action and freshness.
  - [x] QA: selected synthetic image reached actual gallery; API tests cover private reads, retry, replacement, deletion and stale replay rejection.
  - [x] Failed object deletion jobs retained for retry via cleanup script.
- [ ] Production cleanup schedule, backup deletion guarantees and physical-phone image/orientation testing.

Current device UI shares one selected image at a time, replacing its previous selection. API supports at most three. Existing profile avatars remain independent.

### F10 · Optional contacts — local milestone complete

- [x] End-to-end opted-in contacts on API 37 emulator.
  - [x] Scope: up to 200 name/phone rows, no emails, addresses, notes or contact photos.
  - [x] Android: normal Contacts permission and separate sharing switch; denied/unavailable states.
  - [x] Backend: owned latest snapshot, permission-revocation clear and explicit deletion.
  - [x] Dashboard: real records, search, source device and freshness.
  - [x] QA: synthetic device contact reached dashboard; API denied/revoke/delete/isolation boundaries tested.
- [ ] Physical-device permission variations and production retention review.

### F11 · SMS and call history — direct-APK local milestone complete

- [x] Direct APK selected by owner; Android restricted-permission limits documented.
- [x] End-to-end supported SMS and call-log sharing on API 37 emulator.
  - [x] Android: normal SMS/Call Log permission dialogs, separate switches, denial handling; no role takeover or installer allowlist bypass.
  - [x] Scope: at most 100 records per kind from seven days; sensitive code-like SMS withheld; no call audio or private chat scraping.
  - [x] Backend: device/parent authorization, bounded records, revocation and deletion.
  - [x] Dashboard: SMS and call records with number, direction/type, time, call duration and source device.
  - [x] QA: console-generated synthetic SMS and call record reached actual parent data; API permission/revoke/expiry/isolation checks pass.
- [ ] Physical phones and installer compatibility; Google Play eligibility is not established.

Evidence for F07–F11: [device content contract](DEVICE_CONTENT.md), `scripts/verify-content.mjs` (140 HTTP checks plus private-image/snapshot assertions), usage regression (59), pairing regression (87), 13 Android unit tests, debug/release builds, lint and root web build/typecheck. Local Neon dev only; features await PR review, not production deployment. All sharing starts off for new pairings. Screen/camera/microphone/location remain outside this milestone.

Final handoff check (2026-10-31): the final APK installed successfully, but the post-install launch/UI smoke check remains unverified because the emulator and ADB timed out after restart. Pairing data was preserved. Notification sharing was stopped during its clearing test and has not yet been re-enabled. Re-enable it visibly on DEMO EMULATOR, post the debug synthetic previews, and sync before repeating the final dashboard check. Earlier six-category emulator-to-dashboard checks passed.


## Next — implement one feature at a time

### F05 · Connection and permission onboarding reliability

- [ ] End-to-end reliable device setup beyond the current emulator milestone.
  - [ ] Android: request each supported permission in context, with explanation and optional denial.
  - [ ] Android: distinguish runtime permissions, settings-based special access and per-session consent.
  - [ ] Dashboard: distinguish permission state, last successful sync and feature availability.
  - [ ] Android/backend: supported background check-in design, bounded retries and battery testing.
  - [ ] Backend/Android: secure credential renewal and recovery.
  - [ ] QA: physical phone, supported Android versions, offline recovery and battery restrictions.

Accessibility/device-admin activation is not a universal permission. Do not introduce it to bypass Android permission or consent flows.

## Backlog — device capabilities

### F12 · Optional location

- [ ] End-to-end timestamped location sharing.
  - [ ] Android: clear opt-in, supported foreground location and stop control.
  - [ ] Backend: minimal location contract, restricted access and retention.
  - [ ] Dashboard: accuracy, timestamp, stale/offline/denied state and map/view.
  - [ ] QA: approximate location, denial/revocation and real-device/battery behavior.
  - [ ] Separate review before background location or location history.

### F13 · View-only screen sharing

- [ ] End-to-end visible, stoppable screen session.
  - [x] Dashboard screen route and phone-shaped viewer UI.
  - [ ] Backend: select media service; session authorization, short-lived credentials and cost limits.
  - [ ] Android: explicit screen-sharing consent for each session and visible active-session/stop UI.
  - [ ] Dashboard: view-only subscription, connecting/error/ended states.
  - [ ] QA: stop, expiry, revoke, disconnect/reconnect and cross-family/session isolation.
  - [ ] Physical-phone compatibility and bandwidth testing.

No remote touch/typing, hidden capture, recordings or screenshots in this milestone.

### F14 · Camera sharing

- [ ] End-to-end visible, authorized camera session.
  - [x] Dashboard viewer and front/back selection controls (UI only).
  - [ ] Android: camera permission, local session authorization, visible active state and stop.
  - [ ] Android: supported front/back switching, one camera at a time.
  - [ ] Backend: scoped media session lifecycle and revocation.
  - [ ] Dashboard: real stream, acknowledged lens changes and unsupported-camera states.
  - [ ] QA: physical cameras, denied access, interruption and session isolation.

Depends on media infrastructure from F13. No hidden or unattended camera access.

### F15 · Microphone sharing

- [ ] End-to-end visible, authorized audio session.
  - [x] Dashboard microphone route and unavailable state.
  - [ ] Android: microphone permission, local session authorization, visible state and stop.
  - [ ] Backend: scoped session credentials, expiry and revocation.
  - [ ] Dashboard: live audio, mute/playback controls and session status.
  - [ ] QA: deny/revoke, background restrictions, interruption and isolation.

Depends on media infrastructure from F13. No covert listening or recordings.

### F16 · Supported account labels and device services

- [ ] Define useful, platform-supported metadata before implementation.
  - [x] Dashboard Accounts and Device services routes/empty states.
  - [ ] Android feasibility: what can legitimately be disclosed by the device.
  - [ ] Backend: minimal schema and family/device ownership.
  - [ ] Dashboard: permitted metadata only, with explicit unsupported states.
  - [ ] QA: disclosure, accuracy and revocation.

Never collect passwords, tokens or private account content. No guarantee of a full running-service or account inventory.

## Backlog — family controls and expansion

### F17 · Pause/resume and routines

- [ ] Validated device enforcement.
  - [x] Unrestricted-by-default profile model; saved routines; disabled pause UI.
  - [ ] Android feasibility and clearly disclosed supported restriction mechanism.
  - [ ] Backend: desired commands, expiry, acknowledgement and applied-version state.
  - [ ] Android: apply/release supported restrictions and preserve emergency/contact paths.
  - [ ] Dashboard: requested, pending, applied, failed and resumed states.
  - [ ] QA: offline behavior, stale commands, restart, revocation and physical phones.

### F18 · Child requests and family collaboration

- [ ] Child access/extra-time requests with approval, decline and expiry.
  - [ ] Android request UI and status.
  - [ ] Backend lifecycle, ownership and device acknowledgement.
  - [ ] Dashboard actionable request queue and delivered/applied distinction.
  - [ ] End-to-end expiry/offline/isolation checks.
- [ ] Co-parent invitations, roles, revocation and permission tests.
- [ ] Family chat and agreements — scope and privacy design first.
- [ ] Weekly summaries/reports based on verified usage data.
- [ ] Optional chores/rewards and shared budgets; not required daily allowances.
- [ ] Geofences and website filtering — independent feasibility milestones.

### F19 · Parent mobile app

- [ ] Select framework and native authentication approach.
- [ ] Build account/family/child navigation using the existing authorized backend.
- [ ] Add device/permission status and only already-supported features.
- [ ] Verify notification, session, security and release flows.
- [ ] Evaluate any iPhone companion separately; no Android-equivalent coverage promised.

## Launch gates — still open

### F20 · Parent hosting, privacy, operations and release

- [ ] Parent backend production hosting, canonical HTTPS origin and trusted Auth domains.
- [ ] Reviewed migrations and isolated production credentials for all services.
- [ ] End-to-end physical-phone pairing against the actual deployed backend.
- [ ] Production email/recovery verification with a controlled mailbox.
- [ ] Account/family deletion and device/content retention, including backup expectations.
- [ ] Production rate limits, abuse controls, operational monitoring and alerting.
- [ ] Backup/restore and rollback exercises.
- [ ] Security review, private reporting contact and access audit metadata.
- [ ] Accessibility and mobile-browser/device support matrix.
- [ ] Launch-market, guardian/age, privacy disclosure and distribution review.
- [ ] Signed Android release, update strategy and download/distribution path.
- [ ] Media budget/provider decision before any paid streaming deployment.

## Delivery notes

| Date | Change | Evidence / scope |
| --- | --- | --- |
| 2026-10-24 | Web foundation, website deployment and Android pairing verified | [Web verification](VERIFICATION.md), [Android](ANDROID_CONNECTION.md), [deployment](DEPLOYMENT.md) |
| 2026-10-31 | Isolated Neon dev and email-code recovery | Owner confirmed recovery; [environment guide](ENVIRONMENTS.md) |
| 2026-10-31 | Permission-status implementation tested locally | [PR #15](https://github.com/SamNickGammer/sideby.omprakashbharti.in/pull/15), not merged/deployed |
| 2026-10-31 | This board introduced | Documentation only; F06 queued, no content-collection implementation started |

Future requests belong in the appropriate card above, or a new stable F-number. Add missing submodules **before** beginning implementation and update this board in the same commit as the work. Record blocked/deferred decisions instead of silently removing unchecked items.
