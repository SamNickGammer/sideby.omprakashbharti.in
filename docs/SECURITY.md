# Security and child privacy

## Required boundaries

Enforce family-level authorization server-side on every read and write. Use expiring single-use pairing codes, attempt limits, explicit parent confirmation, and revocable device credentials. Reauthenticate for sensitive guardian/account changes. Audit invitations, rule changes, pairing, and live-session access without storing sensitive content.

Live sessions are visible, authorized, short-lived, and stoppable on the child device. Never hide the app or misrepresent it as an operating-system service. No background permission workarounds. Guardian revocation must terminate future access and active media sessions.

## Data handling

Collect only data required for enabled features. Avoid message content, recordings, full browsing logs, and precise location histories in the first release. Location is optional, clearly disclosed, and timestamped. Keep secrets out of Git and logs. Use synthetic data in development. Encrypt transport and verify provider storage protection before production.

Retention periods, regional hosting, age/guardian verification, export/deletion behavior, and applicable launch-market requirements must be resolved before a public beta. Define backup deletion expectations separately from active-data deletion. Never sell child data or use it for advertising.

## Reporting

No dedicated security contact is configured yet. Until one is established, use an existing private contact with the repository owner; do not open public issues containing child information or exploit details. Configure private vulnerability reporting before public launch.

## Device permission status

The approved device credential can replace only its own latest permission snapshot through `POST /api/device/permissions`. The owner-authorized device list returns that snapshot. Reports contain fixed status keys plus app/API version, never phone content. This does not grant access to messages, calls, camera or screen. Android sends reports after foreground check-ins and exposes a visible local status dialog. See [Device permissions](DEVICE_PERMISSIONS.md) for the strict schema, freshness and consent distinctions.
