# Sideby roadmap

1. Foundation — documentation, vector brand kit, repository layout, Git conventions. Delivered by this initial commit.
2. Web prototype — parent dashboard implemented with synthetic data and interactive local state. The separate static landing site now introduces the product and roadmap; no live device state is implied.
3. Connected web foundation — implemented Neon Auth, Postgres families/children/routines, private profile photos, live family revisions, responsive screens and cross-family authorization tests. Web pairing, multiple device records, parent confirmation and heartbeat APIs are implemented and tested with a simulated companion. Co-parent access, account deletion and public-app launch hardening remain pending.
4. Android connection first — build the visible companion, secure pairing credential storage, heartbeat, reconnect and revocation. Then verify permissions, usage, restrictions, offline rules and battery behavior on real phones. Decide minimum supported Android version from evidence.
5. Connected beta — device acknowledgements, rules, requests, check-ins, location permissions, guardian access, deletion and recovery.
6. Live-media experiment — authorized view-only screen, one-camera-at-a-time switching, microphone audio, session revocation, network recovery and cost measurement. Ship only validated capabilities.
7. Expansion — rewards, geofences, reports, shared allowances, parent mobile app. Evaluate iPhone separately.

No delivery dates or feature parity promises are committed. Public release requires security review, retention decisions, launch-market privacy review, and operational readiness.
