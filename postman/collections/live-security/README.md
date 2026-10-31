# Live session security probes

Set `base_url` to the local dev backend. The saved v3 requests check no-auth rejection and no-store headers. The full authenticated lifecycle suite is `node --env-file=.env.local scripts/verify-live.mjs`; it creates synthetic accounts and requires Neon dev plus the media supervisor. These requests mirror the contract in docs/LIVE_SHARING.md. No production credentials belong here.
