# Admin, policy archive and support contract

Status: implementation in progress. New app `apps/admin`, isolated from parent authentication. Development uses Neon dev. Production domain/data source require owner confirmation. No public signup, child media access or parent impersonation is included.

## Authentication and authorization

One configured admin identity; password verified with Node scrypt against a salted server-only hash. No password in source, browser storage or logs. Random 256-bit session tokens are stored only as SHA-256 hashes in Postgres, expire after 8 hours and are revoked on logout. Host-only HttpOnly SameSite=Strict cookies; Secure in production. Every admin endpoint checks the session. Mutation requests require the configured exact Origin and JSON content type. Login attempts use durable rate limits (per source and per account), with generic failures. No shared parent cookie or public signup. Production credentials are separate from development credentials.

## APIs

All responses no-store except immutable published policy versions (public data). JSON errors: `{error:string}`. No stack traces, database secrets or password fields returned.

- `POST /api/login`: `{email,password}` → 200; generic 401, rate-limit 429. Origin required.
- `POST /api/logout`: revoke current session and clear cookie → 200.
- `GET /api/overview`: authenticated aggregate users, families, active children, paired devices and check-ins within 24h, plus recent 30-day counts. No phone contents or raw child records. Unconfigured/missing metrics must be labeled unavailable rather than zero.
- `GET /api/policies`: authenticated latest 100 policy versions, drafts and published records.
- `POST /api/policies`: create immutable draft `{slug,title,body,effectiveDate,summary}`. Slug is privacy/terms/support. Plain text only, max 60,000 chars. UUID revision id, database creation timestamp, no overwrite/delete endpoint.
- `POST /api/policies/:id/publish`: authenticated explicit publish; creates a publish timestamp without changing the text. Effective date cannot be future. Publish atomically changes the current pointer for that policy and logs the action. Prior published versions remain available. Drafts never appear publicly.
- `GET /api/public/policies?slug=privacy[&version=UUID]`: current published version and published version index, or specific published version; 404 if absent. No drafts or admin metadata.
- `POST /api/public/bugs`: exact website Origin; `{name,email,category,subject,description,website}` (last field honeypot). Name optional, reply email required, bounded text only, no attachments; returns opaque reference id. Durable source throttling, bounded request body, no public read endpoint. No email is sent automatically.
- `GET /api/bugs?page=1`: authenticated paginated reports, newest first, 25 per page.
- `PATCH /api/bugs/:id`: authenticated `{status:open|investigating|resolved}`; audit status change. No outbound messaging.

## Storage and deployment

Migration 008 adds admin sessions, rate-limit counters, immutable policy revisions/current pointers, bug reports and an audit table. It does not modify family data. Metrics use aggregate read queries. Website stays static; it calls only public admin APIs over HTTPS. Public endpoint responses have CORS restricted to the website origin; admin APIs have no cross-origin access. Production startup fails closed without configured origins, database and credential hash. Database credentials are never NEXT_PUBLIC values.

## Policy publication gate

Detailed policy drafts must identify actual operator/contact, target markets, purposes, permission categories, third parties, retention, rights, children/guardian consent, security and change history. Do not invent compliance, residency, response-time or backup-erasure promises. Owner details and legal review remain necessary before a public child-data launch. Archived policies evidence what was published, not proof that a particular user accepted it; acceptance receipts are separate future work.

## Verification plan

Test login success/failure, absent/forged/expired/revoked sessions, cross-origin rejection, rate limits, input bounds, draft invisibility, immutable archive/current replacement, bug submission/private access, status audit, missing metrics and UI at mobile/desktop sizes. Use only synthetic reports in Neon dev. Root build and typecheck must pass. Production verification uses public pages and aggregate reads, not synthetic family records.

Support reports expire after 180 days from submission, regardless of status. Vercel daily cron calls `/api/maintenance` at 03:23 UTC with server-only CRON_SECRET; it removes eligible reports, expired sessions and expired source-hash counters. Unauthenticated calls fail closed. Outages can delay cleanup. Audit references contain no report text/email. Policy archive retention is indefinite. No legal-hold exception is claimed by this implementation.

Legal drafting references reviewed 1 November 2026: [MeitY DPDP Rules 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025), [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), [FTC verifiable parental consent](https://www.ftc.gov/business-guidance/privacy-security/verifiable-parental-consent-childrens-online-privacy-rule). These sources inform disclosure/launch gates, not a certification of compliance or a substitute for jurisdiction-specific legal review. The owner requested no public email; contact is the private support form and supplied postal address. No target markets were confirmed, so policies do not claim global release eligibility.
