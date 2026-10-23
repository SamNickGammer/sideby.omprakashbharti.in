# Sideby architecture

Status: Next.js parent-web prototype implemented using client-side sample state. The remaining architecture is proposed; no external services provisioned or integrations implemented.

## Components

- Next.js + TypeScript: independent parent-web and website applications.
- Tailwind CSS and shared UI package: consistent web design.
- Neon Postgres: durable accounts-related application data, families, guardian memberships, children, devices, rules, requests, and audit metadata.
- Authentication: provider undecided; require server-verified sessions, recovery, revocation, and compatibility with web and future mobile clients. Do not implement custom password cryptography.
- Next.js server routes: initial application backend, with contract-first APIs before client integration.
- Vercel: candidate web host; not a host for the media server.
- Kotlin Android app: permission handling, usage collection, validated enforcement, local rules, and live-media publishing.
- LiveKit: candidate WebRTC media service. Managed cloud first for a prototype; choose paid hosting only after estimating session minutes and traffic.

## Data and authorization

Every protected operation verifies the authenticated guardian's membership and role for the requested family. Device credentials are narrowly scoped and revocable. A child is a profile; a device is a paired installation. Foreign keys and ownership checks must enforce relationships. Database credentials stay server-side. The public marketing site receives no family-data database access.

Before implementing endpoints, define versioned contracts for authentication integration, family membership, children, device pairing, rules, requests, device acknowledgements, and session authorization. Contracts must specify errors, authorization, pagination when relevant, and idempotency for retried actions. No wire format is fixed by this foundation.

## Synchronization

The server owns desired rules; devices report applied versions and timestamps. An accepted request is not proof of application. Offline devices reconcile on reconnect, with stale commands and expired approvals rejected. Use bounded retry and deduplication. Push notifications can prompt synchronization but are not authoritative state. Select the push provider in the Android implementation milestone.

## Live media separation

Parent web requests session -> backend checks family/device authority -> child receives request and obtains required local authorization -> backend issues short-lived session-scoped media credentials -> Android publishes media through LiveKit -> parent subscribes with view-only permissions.

Only the explicitly paired device and authorized parent may join. Stop/revocation closes streams and prevents rejoin. Do not expose broad provider credentials. Store minimal session audit metadata, not media. Use provider-supported transport encryption; assess end-to-end encryption separately and do not claim it until implemented and verified.

Database traffic stores settings and metadata. Audio/video travels through WebRTC infrastructure, not database rows or a database realtime channel. Live-only streaming still incurs bandwidth and infrastructure usage.

## Storage and operations

Use bundled avatars and SVG branding initially. If uploads or recordings are later approved, select object storage with restricted access, retention, and deletion policies. Do not put media blobs in Postgres. Select deployment region, backup/restore plan, retention periods, and production budget before handling real child data.
