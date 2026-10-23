# Neon setup

## Local development

Requires Node 22+ and access to the configured Neon project. Never commit environment files. Run from the repository root:

```sh
npm ci
npx neon@latest init -y --org-id org-quiet-lab-92227973 --project-id mute-rice-90196546 --branch production --services postgres,auth,object-storage,realtime
npx neon@latest deploy
```

Existing checkout is already initialized and deployed. Deployment pulls provider variables into root `.env.local`. Copy that file to `apps/parent-web/.env.local`; Next.js runs from the app directory. Add `STORAGE_BUCKET=assets`, `APP_ORIGIN=http://127.0.0.1:3000` and a cryptographically random `NEON_AUTH_COOKIE_SECRET` of at least 32 characters. Keep both files private (mode 600). Never put server secrets in `NEXT_PUBLIC_*` variables. If refreshing env values, preserve the cookie secret to avoid invalidating sessions.

Register `http://127.0.0.1:3000` and `http://localhost:3000` as Neon Auth trusted domains (already done). Keep APP_ORIGIN consistent with the address used in the browser. For hosting, set the HTTPS application origin, add that trusted domain and configure the same server variables in the host. Neon deploy does not deploy the Next.js website.

```sh
node --env-file=.env.local scripts/migrate.mjs
npm run build
npm run typecheck
npm run dev
```

The baseline migration is repeatable for creating missing tables, not a schema-diff engine. Future schema changes need new reviewed migrations. Validate them on a temporary Neon branch before production. The existing baseline has already been applied.

## Live verification

With the app running, `node --env-file=.env.local scripts/verify-services.mjs` tests actual Auth, Postgres, Storage and Realtime, including two-family isolation and mutation origin checks. It creates synthetic users/profiles and an image, and saves test-only credentials in ignored `.test-*.json` files for browser QA. Run only against an explicitly chosen test environment or authorized development project. Run `node --env-file=.env.local scripts/cleanup-test-data.mjs` after browser QA. This deletes only recorded accounts whose email and name match the test fixture pattern, plus their family records and uploaded photos. It requires the authenticated Neon CLI linked to the same project/branch. Never use real children in test screenshots.

## Before public launch

Rotate credentials shared outside the secret store. Verify recovery email delivery with a controlled real mailbox. Configure a public HTTPS host and trusted origin, request limits, account deletion, retention, backups and monitoring; review authorization and session revocation. Multi-guardian access and native authentication are separate milestones. Current live tests do not certify production readiness.
