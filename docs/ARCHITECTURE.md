# Sideby architecture

Status: connected parent-web foundation implemented on 24 October 2026. Neon Postgres, Auth, private Object Storage and Realtime are provisioned on the production branch. Web device pairing and heartbeat APIs are implemented; the Kotlin Android companion now implements pairing and foreground check-ins with Keystore-encrypted session storage. Android content/enforcement/media and multi-guardian architecture below remain planned. See [Android connection](ANDROID_CONNECTION.md).

## Components

- Next.js + TypeScript: independent parent-web and website applications.
- Parent web uses Tailwind CSS and custom styles; the static website uses its own responsive stylesheet and copied master brand SVGs. packages/ui remains reserved, not an implemented shared component library.
- Neon Postgres: durable accounts-related application data, families, guardian memberships, children, devices, rules, requests, and audit metadata.
- Authentication: Neon Auth with its Next.js server adapter and secure session cookies. Server routes verify sessions. Native mobile compatibility remains to be validated.
- Next.js server routes: initial application backend, with contract-first APIs before client integration.
- Vercel: candidate web host; not a host for the media server.
- Kotlin Android app: implemented visible pairing, secure session storage and foreground heartbeat. Permission handling, usage collection, validated enforcement, local rules and live-media publishing remain planned.
- LiveKit: candidate WebRTC media service. Managed cloud first for a prototype; choose paid hosting only after estimating session minutes and traffic.

## Data and authorization

Every protected operation verifies the authenticated guardian's membership and role for the requested family. Device credentials are narrowly scoped and revocable. A child is a profile; a device is a paired installation. Foreign keys and ownership checks must enforce relationships. Database credentials stay server-side. The public marketing site receives no family-data database access.

Before implementing endpoints, define versioned contracts for authentication integration, family membership, children, device pairing, rules, requests, device acknowledgements, and session authorization. Contracts must specify errors, authorization, pagination when relevant, and idempotency for retried actions. Implemented wire formats are documented in API.md and PAIRING.md; future endpoints require their own contracts.

## Synchronization

The server owns desired rules; devices report applied versions and timestamps. An accepted request is not proof of application. Offline devices reconcile on reconnect, with stale commands and expired approvals rejected. Use bounded retry and deduplication. Push notifications can prompt synchronization but are not authoritative state. Select the push provider in the Android implementation milestone.

## Live media separation

Parent web requests session -> backend checks family/device authority -> child receives request and obtains required local authorization -> backend issues short-lived session-scoped media credentials -> Android publishes media through LiveKit -> parent subscribes with view-only permissions.

Only the explicitly paired device and authorized parent may join. Stop/revocation closes streams and prevents rejoin. Do not expose broad provider credentials. Store minimal session audit metadata, not media. Use provider-supported transport encryption; assess end-to-end encryption separately and do not claim it until implemented and verified.

Database traffic stores settings and metadata. Audio/video travels through WebRTC infrastructure, not database rows or a database realtime channel. Live-only streaming still incurs bandwidth and infrastructure usage.

## Storage and operations

Private profile photos use Neon Object Storage. Uploads are limited to 2 MB, decoded and re-encoded to 256px WebP, stripping metadata. Authenticated owner-only routes stream images; no public bucket URLs or browser storage credentials. Recordings are not implemented. Do not put media blobs in Postgres. Select deployment region, backup/restore plan, retention periods, and production budget before handling real child data.

## Implemented web data path

The current schema has one owner per family, multiple children and family routines. Every resource query checks the owner server-side. Multi-guardian membership is a later migration, not an implied capability. `db/migrations/001_family.sql` is the baseline. Neon HTTP queries serve request/response routes; writes that change children or routines increment the family revision in a transaction.

Realtime uses a server-sealed owner-filtered query for the family revision. Browser subscriptions trigger a fresh authenticated family fetch. Broad Realtime secrets stay on the server. Realtime carries account changes, never media. Client creation and teardown tolerate React development effect remounts.

Mutation requests validate the canonical `APP_ORIGIN`, authenticated user and typed input. The UI separately labels saved preferences and unpaired devices. See DEPLOYMENT.md for current frontend hosting state. Neon deployment only provisions backend services. The website is a separate static export without backend secrets.

## Child Space routing

`/dashboard/children/[id]/[[...section]]` validates the UUID and section allowlist, then checks the current session and family owner before loading a profile. Missing/inaccessible children and unsupported sections return 404. Client links retain bookmarkable sections and browser history. The family dashboard accepts an allowlisted `view` query to return to the right family section.

Migration 002 removes the default and NOT NULL constraint from the legacy `daily_limit` column. Existing values are retained for compatibility with stored data, but are no longer exposed or accepted by the child API, and are not enforced. New records use NULL. The migration runner executes numbered idempotent SQL files in order. Future non-idempotent migrations require migration tracking before use. No pause, usage ingestion or media backend is implemented by the routed web views.

## Pairing milestone

Migration 003 adds pairing offers and multiple devices per child. See [pairing contract](PAIRING.md) for code lifecycle, confirmation, scoped credential expiry/revocation and check-in semantics. Pairing uses database row locks and atomic approval; only SHA-256 hashes of codes and device credentials persist. Companion credentials authorize only heartbeat, never family reads or monitoring.
