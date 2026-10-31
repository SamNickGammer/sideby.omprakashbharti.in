# Sideby Admin

Separate Next.js app for a single operator: aggregate growth counts, immutable policy revisions/publication, and private support reports. No signup and no access to child media/content. The website remains a static app and calls only public policy/report APIs.

## Development

Copy `.env.example` to ignored `.env.local`; use Neon dev only. Configure a dedicated test credential hash and rate-limit secret. Root `npm install`, `npm run dev:admin` (port 3006). `npm run build` and `npm run typecheck` include this app.

Migration 008 must be applied explicitly using a direct database connection. `scripts/migrate.mjs` executes SQL files transactionally without splitting PostgreSQL function bodies. Do not run all historical migrations against production without reviewing them.

## Credentials

Provision exactly one admin email and a salted Node scrypt password hash through server-side environment variables. Sessions expire after eight hours and are revocable. Rotating the password hash does not delete existing sessions: also clear `sideby_admin_sessions` through a controlled operator operation when rotating/revoking access. No password reset endpoint or signup is exposed.

## Hosting

Use a separate Vercel project rooted at `apps/admin`, with server-only database and credential variables. `ADMIN_ORIGIN` is its exact HTTPS domain; `WEBSITE_ORIGIN` is the marketing site origin. Set `NEXT_PUBLIC_ADMIN_API_ORIGIN` on the website to the admin origin and redeploy the website. Preview deployments must not receive production database or credential variables.

Aggregate account counts include accounts in the configured Auth database; child counts exclude archived profiles; paired devices exclude revoked, expired credentials and archived children. “Seen in 24 hours” is check-in freshness, not an online guarantee. Growth reports new records per UTC day, not a historical retention/cohort metric. If required parent tables are absent, show unavailable.

Policies are plain text, not HTML. Drafts are private; publishing is explicit and preserves all previous published content. The public reader shows only the current policy. Historical copies can be requested through Support by date or date range; immutable history remains private in admin. This is a publication archive, not a consent receipt system. Report emails are unverified reply addresses; do not treat a submission as proof of account ownership. No chat, attachments or automatic email delivery is implemented.

See [API/security contract](../../docs/ADMIN_PLATFORM.md). Production log retention, policy content and operator details must match published disclosures.
