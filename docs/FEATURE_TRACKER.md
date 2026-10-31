# Sideby feature board

Last reviewed: 31 October 2026. This is the working checklist for the project, including Android, backend, parent web, website and future parent mobile work.

## How to read and maintain this board

- `[x]` means the stated item is implemented and verified within its stated scope. It does **not** automatically mean merged, deployed or production-ready.
- `[ ]` means not complete: planned, in progress, blocked or awaiting verification. Keep partially completed parent features unchecked; tick individual completed submodules underneath.
- Board lanes below show **Done**, **Review**, **Next**, **Backlog** and **Launch gates**. Move an entire feature only when its acceptance checks pass; preserve its stable ID.
- Before starting a new request, add or update its card, list Android/backend/dashboard work and identify dependencies. Mark the active card **In progress**. After work, record evidence, remaining limitations, PR/merge status and deployment scope.
- A screen, permission grant, successful upload and displayed result are separate milestones. Do not tick end-to-end completion until a real supported device flow reaches the correct parent's dashboard.
- Keep test evidence synthetic. Never put credentials, real child content or production records here.

Current active implementation: **F05b — optional Usage Access setup implemented; emulator verification blocked**. Next queued implementation: **F06 — App usage**. Permission status is implemented locally but awaiting merge. This documentation update does not implement the remaining capabilities.

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

### F05b · Permission setup — implementation ready, emulator QA blocked

- [ ] Android: dedicated permission setup page with explanations and availability labels.
- [ ] Android: optional Usage Access settings flow, grant/revoke detection and refresh on return.
- [ ] Android/backend: send changed permission status without clearing the pairing on failure.
- [ ] Dashboard: explain how to change permissions on the device and distinguish grants from data syncing.
- [x] QA: Android debug/release builds, unit tests and lint; web builds and type checks.
- [ ] QA: emulator deny/grant/revoke flow and dashboard report changes. APK installation stalled; verify before calling this complete.

Implementation is on PR #15. Code for the setup page, AppOps checks and reporting is present; the unchecked interaction subtasks remain unverified until the emulator runs the updated APK.

Scope is permission setup/status only. Usage data collection remains F06. No sensitive runtime permission is requested for an unimplemented camera, microphone, location or content feature.

## Next — implement one feature at a time

### F06 · App usage / digital wellbeing — next queued

- [ ] End-to-end app usage feature complete.
  - [ ] Android: explain exactly what usage metadata is shared; optional Usage Access setup.
  - [ ] Android: read usage for supported time ranges with timezone/day-boundary handling.
  - [ ] Android: report actual access state, including revocation and unavailable data.
  - [ ] Backend: define contract, minimum fields, retention and authenticated device ingestion.
  - [ ] Backend: isolate device/child/family queries and deduplicate retries.
  - [ ] Dashboard: replace empty usage views with actual totals and per-app usage.
  - [ ] Dashboard: show period, device, sync time, stale/offline/no-access states.
  - [ ] QA: use known emulator activity; compare Android values to dashboard results.
  - [ ] QA: deny/revoke access, restart, retry, multiple devices and cross-family denial.
  - [ ] QA: physical-device accuracy and supported-Android review before release.

Depends on F04; coordinate permission-status updates with F05a. Do not enable restrictions or read message content as part of usage reporting.

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

### F07 · Installed apps

- [ ] End-to-end installed-app view.
  - [x] Dashboard route and unavailable state.
  - [ ] Android: establish supported package visibility and disclose inventory sharing.
  - [ ] Backend: minimal inventory schema, ownership, retention and bounded syncing.
  - [ ] Dashboard: real inventory, supported fields, device filter and freshness.
  - [ ] QA: install/update/remove test apps; restricted visibility, revocation and isolation.

### F08 · Notifications and social previews

- [ ] End-to-end optional notification-preview sharing.
  - [x] Dashboard notification route; Messages social tab and source-app filters.
  - [ ] Feasibility/privacy decision: define allowed sources, excluded sensitive content and retention.
  - [ ] Android: visible opt-in, platform notification access, source selection and stop/revoke controls.
  - [ ] Backend: minimized preview ingestion, deduplication, ownership and deletion.
  - [ ] Dashboard: source-labelled previews, timestamps, unavailable/hidden-content states.
  - [ ] QA: synthetic notifications, revoked access, filtering and cross-family isolation.

Notification previews are not complete WhatsApp/Telegram/Instagram/Facebook conversation histories. Hidden or unavailable notification content must not be bypassed.

### F09 · Selected photo sharing

- [ ] End-to-end gallery of explicitly shared images.
  - [x] Dashboard gallery route and empty state.
  - [ ] Android: system photo picker and clear selection/upload/revocation UI.
  - [ ] Backend/storage: private uploads, file validation, metadata minimization and deletion.
  - [ ] Dashboard: authenticated thumbnails/viewer, loading/errors and removal.
  - [ ] QA: selected files only, unauthorized reads, retry and deletion.

Existing private **profile avatars** are complete; phone-gallery sharing is a separate feature.

### F10 · Optional contacts

- [ ] End-to-end explicitly authorized contact sharing, subject to scope review.
  - [x] Dashboard contacts route and empty state.
  - [ ] Define selected/minimal fields, purpose, retention and stop/delete controls.
  - [ ] Android: visible selection or supported permission flow; handle denial/revocation.
  - [ ] Backend: scoped storage/sync and deletion.
  - [ ] Dashboard: authorized records, source device and freshness.
  - [ ] QA: synthetic contacts, denial, revocation, deletion and family isolation.

### F11 · SMS and call history — feasibility gated

- [ ] Decide whether these capabilities can ship on supported Android/distribution channels.
  - [x] Dashboard SMS and Call history routes/empty states.
  - [ ] Review platform eligibility, distribution requirements and privacy scope before implementation.
  - [ ] If approved: Android visible opt-in and supported access, with denial/revocation handling.
  - [ ] If approved: minimal backend contracts, retention and deletion.
  - [ ] If approved: dashboard records, timestamp/source and unavailable states.
  - [ ] If approved: synthetic-data end-to-end and authorization tests on real supported phones.

Not a commitment to ship. No call recording or access to other apps' private chats.

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
