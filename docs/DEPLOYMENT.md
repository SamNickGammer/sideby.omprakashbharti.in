# Web deployment

Sideby has two independent web applications in one npm workspace repository. Do not import the repository root as if it were a single app.

| Project | Vercel root | Purpose | Environment |
| --- | --- | --- | --- |
| Public website | `apps/website` | Static product introduction | No secrets or environment variables |
| Parent web | `apps/parent-web` | Accounts, dashboard and pairing backend | Server-only values from `.env.example` |

Use Next.js framework detection and the root npm lockfile. The public website exports static pages. Keep production tracking `main`; feature PRs receive previews. Do not automatically merge a feature PR to publish it.

## Public website and Cloudflare

Intended URL: https://sideby.omprakashbharti.in. Deployment state is recorded below after verification.

1. Import `SamNickGammer/sideby.omprakashbharti.in` into Vercel with root `apps/website`.
2. Deploy the reviewed commit and confirm its page renders before changing DNS.
3. Add `sideby.omprakashbharti.in` in that project's Domains settings.
4. In the Cloudflare `omprakashbharti.in` zone, add/update only the `sideby` record with the exact target Vercel supplies. Prefer DNS-only for the initial Vercel validation. Preserve unrelated records and mail settings; do not change nameservers.
5. Confirm Vercel domain validation, an issued HTTPS certificate and the public homepage. A DNS save alone is not proof of a live deployment.

See official [Vercel monorepo setup](https://vercel.com/docs/monorepos) and [custom-domain setup](https://vercel.com/docs/domains/set-up-custom-domain). Use current project-generated DNS values, not a hard-coded example IP.

## Parent application: separate later deployment

The landing site does not expose the authenticated backend. Configure a separate host/project before connecting a physical Android device remotely. Set APP_ORIGIN to the exact HTTPS parent-app origin, register that trusted domain with Neon Auth and supply server variables securely in Vercel. Keep preview and production secrets/environments separate. Do not expose sensitive parent functionality through the public website project.

Review [Neon setup](NEON_SETUP.md) and [parent readiness](PARENT_WEB_READINESS.md). Run build/type checks and controlled end-to-end tests on the actual host before calling it ready. Database migrations are explicit reviewed operations, not part of every Vercel build. Never run fixture cleanup or seed scripts during deployment.

## Rollback

Use Vercel's previously verified deployment for rollback, then revert the corresponding Git change through the normal review process. Preserve the prior DNS target before changing an existing record. Rollbacks of this static website do not affect the parent database.

## Verified deployment state

Pending this milestone's deployment checks. Parent web has not been publicly deployed by this milestone.
