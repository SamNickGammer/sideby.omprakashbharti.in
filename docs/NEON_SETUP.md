# Neon setup

## Local development

Requires Node 22+ and access to the configured Neon project. Never commit environment files. Run from the repository root:

The existing project has `dev` and `production` Neon branches. Local development uses `dev`; do not initialize local development against production. See [environment guide](ENVIRONMENTS.md).

```sh
npm ci
neon checkout dev --project-id mute-rice-90196546 --no-env-pull
neon env pull --branch dev --file .env.dev.local
npm run env:dev
npm run dev
```

The selector validates the branch endpoints and installs matching Postgres, Auth, private storage and Realtime values into root `.env.local` and `apps/parent-web/.env.local`, with mode 600. It sets `APP_ORIGIN=http://127.0.0.1:3005` and creates a distinct dev cookie secret. Preserve that secret on later pulls. Never put server credentials in `NEXT_PUBLIC_*` variables. Restart the app after switching.

Auth trusts both loopback hosts on port 3005. Use `http://127.0.0.1:3005` as the canonical app origin for family mutations. For hosting, set the public HTTPS origin and register it on the intended Auth branch. Neon deploy provisions services; it does not deploy the website.

Production settings are preserved privately in `.env.production.local`. `npm run env:production -- --allow-production` is an explicit local switch, not a deployment; normal development must use `npm run env:dev`. Git checkout alone does not select Neon credentials. Never mix providers from different branches.

The dev branch is an isolated normal copy of production, chosen by the owner after Neon Auth provisioning failed on schema-only branches. Accounts/data present at creation are copied, but subsequent changes are independent. The failed empty branch was removed. The original production data and passwords were not edited.

Before a schema change, review new migrations and run them against dev:

```sh
node --env-file=.env.local scripts/migrate.mjs
npm run build
npm run typecheck
```

## Live verification

With the app running, `TEST_BASE_URL=http://127.0.0.1:3005 node --env-file=.env.local scripts/verify-services.mjs` tests actual Auth, Postgres, Storage and Realtime, including two-family isolation and mutation origin checks. It creates synthetic users/profiles and an image, and saves test-only credentials in ignored `.test-*.json` files for browser QA. Run only against an explicitly chosen test environment or authorized development project. Run `node --env-file=.env.local scripts/cleanup-test-data.mjs` after browser QA. This deletes only recorded accounts whose email and name match the test fixture pattern, plus their family records and uploaded photos. It requires the authenticated Neon CLI linked to the same project/branch. Never use real children in test screenshots.

## Before public launch

Rotate credentials shared outside the secret store. Verify recovery email delivery with a controlled real mailbox. Configure a public HTTPS host and trusted origin, request limits, account deletion, retention, backups and monitoring; review authorization and session revocation. Multi-guardian access and native authentication are separate milestones. Current live tests do not certify production readiness.
