# Decisions and open questions

## Selected

Sideby brand; Sideby Parent and Sideby Connect product names. Web first. Separate landing website. One parent account across future web/mobile clients. Multiple children and devices. Neon rather than Supabase for the proposed database. Next.js/TypeScript, Tailwind, Vercel, and Kotlin are the starting stack. Live media is view-only, visible, authorized, and not recorded by default.

## Pending before implementation milestones

- Verified recovery email delivery and account recovery/MFA policy (Neon Auth is already implemented).
- Launch countries, ages, languages, subscription limits, and budget.
- Supported Android versions and empirically verified controls.
- Hosting region, data retention, backup restore, and deletion policy.
- LiveKit plan and real-world session/network tests.
- Name/trademark clearance, DNS, and public legal documents.
- Mobile parent framework and any iPhone scope.

Do not silently resolve these questions by making production promises. Record a dated decision with rationale when resolved.

## 24 October 2026 — Web and companion sequence

Neon Auth is the implemented web authentication provider. The public website is an independent static Next.js export with no family-data access, hosted separately from the parent backend. Parent web pairing and heartbeat APIs are implemented; the next companion milestone is connection and revocation before any content permissions. The parent application still needs a separately verified HTTPS deployment for remote physical-device testing. See DEPLOYMENT.md for hosting state.
