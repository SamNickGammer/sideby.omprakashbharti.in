# Testing with sample data

Neon Auth manages signups, password credentials and sessions in the `neon_auth` schema. In the Neon table browser, change the schema selector from `public` to `neon_auth` to see managed tables such as `user`, `account` and `session`. Do not manually edit password/session records.

Sideby's three public tables contain application data:

- `sideby_families`: a family and its parent's Auth user ID (`owner_id`).
- `sideby_children`: child profiles belonging to that family.
- `sideby_routines`: saved family schedules.

The server verifies the session and matches its user ID to `owner_id` before returning family data. Signup creates an Auth user; creating a family creates application records. An empty public schema therefore does not mean authentication is missing.

## Seed your account

Create a parent account through the app, then run from the repository root using that email:

```sh
node --env-file=.env.local scripts/demo-data.mjs seed parent@example.com
```

This creates a Demo family if you have no family, then adds Demo Maya (12), Demo Arjun (9), Demo Zoe (15) and three routines: homework, bedtime and weekend quiet time. Existing family names and profiles are preserved. Repeat runs do not duplicate or overwrite samples. Refresh your dashboard if needed.

Samples are ordinary editable records with stable IDs. They are not automatically added to new accounts. No fake usage, location, requests or connected phones are created. Allowances remain saved preferences until the Android client exists.

## Remove samples before launch

```sh
node --env-file=.env.local scripts/demo-data.mjs clean parent@example.com
```

This removes only the six seeded records for that account (including samples you renamed and photos uploaded to them). It removes the seeded family only if no other profiles/routines remain. Your Auth account and separately created profiles/routines stay intact. It never truncates tables or deletes the managed Auth schema.

For a completely fresh public launch, use an isolated clean production environment: apply the versioned migrations, provision Auth/private Storage/Realtime, set new server credentials, trusted HTTPS domain and APP_ORIGIN, and create the real owner account. Verify all services before switching the website. Keep development/sample data in a separate development branch. Any deletion of other test accounts or manually added data should be reviewed separately; a blanket database reset is not needed to remove these samples.

## Verification

Validated on 24 October 2026 with a disposable synthetic Auth account: seed twice yielded exactly three children; cleanup removed a renamed sample while retaining a separately created profile and the Auth account. The disposable account was then removed. `npm run build` and `npm run typecheck` passed. Seeding a real testing account still requires its registered email.
