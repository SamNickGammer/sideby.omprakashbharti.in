# Sideby agent instructions

Read README.md, docs/PRD.md, docs/ARCHITECTURE.md, and docs/SECURITY.md before changing behavior. These instructions apply throughout this repository.

- Keep apps/website separate from apps/parent-web. Reuse web design components through packages/ui when implemented.
- Support a family with multiple children, and a child with multiple devices. Never conflate child identity with device identity.
- Enforce authorization on the server for every family resource. Never trust a client-supplied family ID without checking membership and role.
- No hidden monitoring, misleading system-app identities, permission bypasses, or remote touch/control. Live sessions require visible disclosure, device authorization, and platform permission compliance.
- Never put secrets, real child data, location histories, recordings, or production database dumps in Git, test fixtures, logs, or screenshots.
- Distinguish implemented, planned, and platform-dependent capabilities. Label demo data visibly.
- Work on feat/, fix/, docs/, chore/, or refactor/ branches; use Conventional Commits. Inspect existing changes before editing. Never force-push main.
- Establish API contracts before implementing endpoints. Use applicable Postman skills for API work; keep contracts and tests versioned locally.
- Update relevant docs with behavior changes. Test meaningful security and behavior boundaries; do not fabricate test results.
- Ask before paid purchases, production deployment, or destructive data changes unless explicitly authorized. Do not weaken security to resolve setup friction.
- The parent web app is a demo-only Next.js workspace. Run npm run build and npm run typecheck from the root. Do not claim authentication, device integration, or landing-site implementation exists.
