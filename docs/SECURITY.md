# Security and child privacy

## Required boundaries

Enforce family-level authorization server-side on every read and write. Use expiring single-use pairing codes, attempt limits, explicit parent confirmation, and revocable device credentials. Reauthenticate for sensitive guardian/account changes. Audit invitations, rule changes, pairing, and live-session access without storing sensitive content.

Live sessions are visible, authorized, short-lived, and stoppable on the child device. Never hide the app or misrepresent it as an operating-system service. No background permission workarounds. Guardian revocation must terminate future access and active media sessions.

## Data handling

Collect only data required for enabled features. Optional contact/SMS/call/notification sharing is separately disclosed and minimized under DEVICE_CONTENT.md. Exclude recordings, full browsing logs and precise location histories. Location is optional, clearly disclosed, and timestamped. Keep secrets out of Git and logs. Use synthetic data in development. Encrypt transport and verify provider storage protection before production.

Retention periods, regional hosting, age/guardian verification, export/deletion behavior, and applicable launch-market requirements must be resolved before a public beta. Define backup deletion expectations separately from active-data deletion. Never sell child data or use it for advertising.

## Reporting

No dedicated security contact is configured yet. Until one is established, use an existing private contact with the repository owner; do not open public issues containing child information or exploit details. Configure private vulnerability reporting before public launch.

## Device permission status

The approved device credential can replace only its own latest permission snapshot through `POST /api/device/permissions`. The owner-authorized device list returns that snapshot. Reports contain fixed status keys plus app/API version, never phone content. This does not grant access to messages, calls, camera or screen. Android sends reports after foreground check-ins and exposes a visible local status dialog. See [Device permissions](DEVICE_PERMISSIONS.md) for the strict schema, freshness and consent distinctions.

## Opt-in Digital wellbeing

Companion 0.3.0 can share today’s estimated app foreground durations after separate visible opt-in and Usage Access. The device can write only its own bounded latest snapshot; parent reads enforce family ownership. Stop/revoke/disconnect clear or withhold data as described in [the usage contract](USAGE.md). Foreground-only syncing, no raw events, no historical series, and no full installed-app inventory. Enforcement remains unimplemented; later local content/media milestones are described below.

## Optional device content sharing (0.4.0, local development)

The companion adds separate sharing controls for launcher-visible apps, selected-source notification previews, contacts, installer-permitted SMS/call records and explicitly selected photos. The parent pages use authenticated device snapshots with source, timestamps, search/filter, empty/error states and clear controls. No hidden collection or permission bypass. Foreground sync only; notification collection is limited to the visible sharing screen. SMS/call availability is device/installer-dependent, and Google Play eligibility is unverified. See [device content contract](DEVICE_CONTENT.md) and the feature tracker for actual QA status.

## Live sharing local milestone (0.5.0)

Screen, camera and microphone routes now have a local LiveKit integration under [LIVE_SHARING.md](LIVE_SHARING.md). Android explicitly approves each request; screen capture retains OS consent and a visible foreground notification. Camera/audio remain foreground-only. Short-lived source-scoped tokens, two-sided leases and a required room-cleanup supervisor bound access; no recordings or remote control. A permission grant is not session approval. Production hosting, physical-device quality and operational failure drills remain pending. Screen permission reports use `session_required`, never a permanent granted state.

## Operator workspace

The admin app has one configured identity, salted scrypt password verification, random hashed server sessions, an eight-hour lifetime, HttpOnly host-only cookies, production Secure cookies, exact-Origin mutation checks, durable throttling and per-route authorization. No signup, parent-session reuse or child-content browser is provided. Public bug reports are input-bounded and stored privately; email is unverified and must never serve as identity proof. Public policy reads exclude drafts; published text is immutable at the database layer. Production and dev credentials are separate; Vercel previews receive no production secrets. Daily authenticated cron removes reports older than 180 days and expired sessions/counters. See ADMIN_PLATFORM.md.
