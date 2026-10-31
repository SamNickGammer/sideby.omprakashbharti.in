# Admin security probes

Set `admin_url` to the local admin origin (port 3006). This v3 request preserves the unauthenticated aggregate-access boundary. Full authenticated, archive, report and retention checks run with `node --env-file=apps/admin/.env.local scripts/verify-admin.mjs`; a synthetic credential must be provisioned in ignored `.test-admin.json`. The runner refuses production, retains immutable synthetic policy versions in dev and removes its synthetic reports. Source-hash counters are cleared only in dev. Contract: docs/ADMIN_PLATFORM.md. Never commit credentials.
