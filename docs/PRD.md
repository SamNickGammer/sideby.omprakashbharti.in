# Sideby product requirements

Status: product baseline with connected web milestone, 24 October 2026. Requirements below include planned functionality.

Implemented: web signup/sign-in/sign-out, family creation, multiple child profiles, unrestricted child profiles, private avatars, archive/restore, routines, family rename, export and live account updates. Recovery screens are wired; email delivery and complete reset flow still require verification with a real mailbox. Implemented pairing milestone: web codes, parent confirmation, multiple devices, credential revocation and heartbeat APIs. Not implemented: Android client, co-parent invitations, account deletion, device enforcement, usage/location, requests or media.

## Purpose and audience

Help guardians establish healthy device habits and stay connected with their children. The initial audience hypothesis is families with children aged approximately 8–16. Launch geography, languages, budget, and age-specific onboarding remain open decisions before a public beta.

## Product surfaces

Sideby Parent starts as a web app, with a mobile app later using the same account and family data. Sideby Connect is the Android child companion. A separate public website explains the product. No equivalent iPhone monitoring coverage is promised.

## Family model

One family supports multiple guardians and multiple children. One child supports multiple devices. The family owner invites guardians, assigns permitted access, and revokes membership. Children and devices have independent identities. Profile creation does not mean a device is paired or protected.

## First usable release

- Parent signup, login, account recovery, and family creation.
- Add, edit, and remove child profiles; pair a device through an expiring single-use code with explicit parent confirmation.
- Family dashboard: per-child usage summaries, device health, pending requests, and timestamped last location where enabled.
- Child creation asks only for profile details. Usage is unrestricted by default. A parent reviews activity and can request a pause on a supported connected device; display pending delivery separately from an acknowledged pause. Emergency/contact paths remain available. Saved routines do not imply enforcement.
- Extra-time and access requests with approval/decline states and expiry. Display pending delivery separately from applied changes.
- Child app: rules, remaining time where reliably measurable, requests, check-ins, and clear explanation of guardian access.
- Visible status for offline devices, disabled permissions, stale location, and protection limitations.
- Local rules should continue offline where the validated platform implementation permits; new remote actions wait for connection.

## Later family features

Co-parent permissions, geofences, website filtering, family chat, weekly summaries, approved chores and bonus time, family agreements, and shared cross-device budgets. Prioritize after user feedback; no unlimited device entitlement is promised.

## Live media feasibility milestone

The requested experience is view-only screen sharing, front/rear camera viewing with switching, and microphone listening. No touch injection, remote typing, or general device control. Default to one camera at a time; simultaneous dual-camera capture is out of scope.

These capabilities require an Android companion, device authorization, visible session status, and platform permissions. A parent requests a session; the child device presents required authorization and allows it to stop. Screen capture uses the operating system consent flow for each session. Camera and microphone background restrictions must be honored. Session access ends on revocation, expiry, or a stop action. Recordings and screenshots are not product features in this milestone.

Do not claim unattended or hidden access, universal compatibility, or parity with AirDroid. Prototype on real supported phones before placing features in a release commitment.

## Success criteria

A parent can manage three child profiles with independent rules, including one child with two devices. Unauthorized families cannot retrieve each other's data. Pairing codes cannot be reused. Offline/stale information is labeled. A remote setting is never shown as applied before acknowledgement. Children can see monitoring status and stop live sessions. Essential emergency/contact paths must remain accessible under restrictions.

## Exclusions

Hidden apps, disguised system services, stealth recording, bypassing device permissions, adult partner surveillance, sale of child data, advertising in the child app, and guaranteed emergency-response service.

## Routed Child Space

Each child has a direct, owner-authorized URL with a contextual sidebar. Family navigation collapses to an icon rail. Separate sections cover overview, digital wellbeing, installed apps, notifications, screen viewing, camera, microphone, authorized account labels, supported services, device setup and profile settings. Screen and camera share a phone-shaped viewer. Front/back lens selection chooses a future requested camera and does not access a camera before authorization. The Devices section supports real pairing and check-in states; data and media sections remain unavailable until companion integration. Notification collection requires explicit device permission; account passwords/tokens/private content are excluded. Android may limit account/app/service visibility; no full inventory is promised.

## Planned child content, dashboard views available

The web dashboard includes separate Photo gallery, Messages, Contacts and Call history routes. No content is collected yet. Photos initially cover explicitly selected/shared images; contacts are optional and permission-based. SMS and call-log support requires Android/distribution feasibility review. Call history excludes recordings; SMS does not imply access to private conversations in other apps. Device-side disclosure, authorization, revocation and retention must be specified before ingestion is built.

Messages has separate SMS and Social notifications tabs. The Social view filters notification previews by source app (WhatsApp, Telegram, Instagram, Facebook, other apps or all apps). It does not provide complete chat histories or content hidden from notifications. The web controls are implemented; collection and syncing await the Android companion.
