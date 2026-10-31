# Sideby agent instructions

Read README.md, docs/PRD.md, docs/ARCHITECTURE.md, and docs/SECURITY.md before changing behavior. These instructions apply throughout this repository.

- Keep apps/website separate from apps/parent-web. Reuse web design components through packages/ui when implemented.
- Support a family with multiple children, and a child with multiple devices. Never conflate child identity with device identity.
- Enforce authorization on the server for every family resource. Never trust a client-supplied family ID without checking membership and role.
- No hidden monitoring, misleading system-app identities, permission bypasses, or remote touch/control. Live sessions require visible disclosure, device authorization, and platform permission compliance.
- Never put secrets, real child data, location histories, recordings, or production database dumps in Git, test fixtures, logs, or screenshots.
- Distinguish implemented, planned, and platform-dependent capabilities. Label demo data visibly.
- Work on feat/, fix/, docs/, chore/, or refactor/ branches; use Conventional Commits. Inspect existing changes before editing. Never force-push main.
- Reuse fix/maintenance for small fixes, polish, and routine documentation updates, bringing in latest origin/main before work. Do not open a PR for each small change. Brand-new features use a dedicated feat/ branch and PR for the owner to merge. Do not merge into main automatically.
- Establish API contracts before implementing endpoints. Use applicable Postman skills for API work; keep contracts and tests versioned locally.
- Update relevant docs with behavior changes. Test meaningful security and behavior boundaries; do not fabricate test results.
- Ask before paid purchases, production deployment, or destructive data changes unless explicitly authorized. Do not weaken security to resolve setup friction.
- The parent web app is connected to Neon Auth, Postgres, private Object Storage and Realtime. Run npm run build and npm run typecheck from the root. Web pairing and heartbeat APIs are implemented. The separate static landing site is implemented in apps/website. Android pairing and foreground check-ins are implemented; run the Gradle build, unit tests and lint in apps/child-android for Android changes. Background syncing, content collection and co-parent invitations remain unimplemented. Root build/type checks cover both web apps; the landing site must never receive backend secrets. Saved rules are not device enforcement. See docs/NEON_SETUP.md before running live service tests, which create synthetic accounts.

- Local work uses feature/maintenance Git branches based on `main`, Neon `dev`, and port 3005. Neon `production` retains production data. Do not create or require Git environment branches; the owner clarified that dev/prod separation is for Neon. Git checkout does not switch env files. Read docs/ENVIRONMENTS.md and use npm run env:dev before live local tests. Never mix Auth, database, storage or Realtime between branches.

## Feature tracking

Maintain `docs/FEATURE_TRACKER.md` as the working feature board. Before implementing a user request, add or update its card and Android/backend/dashboard/QA subtasks; mark the active work in progress. In the same commit as implementation, tick only verified completed scope, record evidence and limitations, and distinguish implemented, merged and deployed. Keep an end-to-end feature unchecked while required submodules remain incomplete. Add new requirements before starting them; never mark placeholder UI as a working device capability.
