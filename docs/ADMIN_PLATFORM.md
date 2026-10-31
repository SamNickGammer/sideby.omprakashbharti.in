# Admin, policy archive and support contract

Status: implemented, owner-merged in PR #21 and deployed. New app `apps/admin`, isolated from parent authentication. Development uses Neon dev. Owner confirmed admin.sideby.omprakashbharti.in and production counts. No public signup, child media access or parent impersonation is included.

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
- `GET /api/public/policies?slug=privacy`: current published policy only; 404 if absent. Any `version` parameter returns 400. No public version index. Historical requests use the existing private support report contract: category privacy, subject Historical policy request, and policy type plus date/range in description.
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

## Verified deployment — 1 November 2026

- PR #21 merged by owner. Vercel website deployment `dpl_5McAhi8WMTDrTfWimQYrA4Zd7Ffm` and admin deployment `dpl_BT2AewDq7XA6r511QrY2j2YfNJn9` both READY/success on merged app commit `ba96f5a`.
- Admin project `sideby-admin`, root `apps/admin`; production secrets only, no preview credentials. Cloudflare added only DNS-only CNAME `admin.sideby` → `93de1cd1e3f129dd.vercel-dns-017.com`. Vercel confirms valid DNS and HTTPS. Existing records unchanged.
- Migration 008 applied to dev and production. Production family data was not seeded or modified. Current metrics verified against production; “seen in 24h” is not a live-presence signal.
- Production login, Secure/HttpOnly cookie, protected overview, logout revocation and published privacy/terms/support checked. All policy effective dates return calendar text `2026-11-01`, avoiding timezone date shifts.
- Live website form delivered a synthetic report to the authenticated production admin inbox; that report was removed after verification. Dev synthetic report also removed. No email was sent. Public support/terms/privacy load via the admin API; prior policy overview remains accessible.
- Vercel cron is enabled at `23 3 * * *`; authenticated cleanup tested in dev with expired/fresh reports. The scheduled production invocation has not yet occurred during this verification.
- 62 dev API assertions, root build/typecheck and mobile/desktop layout passed. One test run was repeated after browser QA shared the local rate-limit bucket; final run was isolated and passed. No test accounts or passwords were committed.

Legal review before public child-data enrollment, jurisdiction-specific guardian verification and consent receipts remain release gates. No public contact email was requested; the published contact is the private form and owner-supplied postal address. Chat and automatic support replies remain future work.
