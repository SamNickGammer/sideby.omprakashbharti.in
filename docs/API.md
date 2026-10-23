# Web API contract

All /api/family, /api/children, /api/routines, /api/avatar, /api/export and /api/live routes require a Neon Auth session. Server derives the family owner from that session; never accept an owner ID from request JSON. Mutations also require a matching Origin header. Responses use no-store. Error shape: {error: string}; 401 for missing sessions, 403 for origin failures, 404 for inaccessible resources, 400 for invalid input, 503 for upstream failure. UUIDs and lengths are validated. Live-token requests must match the page's original user ID.

- GET /api/family: current parent, optional family, active/archived children and saved routines.
- POST /api/family: {name}; create the signed-in parent's family once.
- PATCH /api/family: {name}; rename family.
- POST /api/children: {name, age, color, daily_limit}; create a profile (not a device).
- PATCH /api/children/:id: {name, age, color, daily_limit, archived}; edit or archive/restore own profile.
- POST /api/routines: {name, start_time, end_time, days, enabled}; save family routine.
- PATCH /api/routines/:id: same fields; edit saved routine.
- DELETE /api/routines/:id: remove own routine after UI confirmation.
- POST /api/avatar/:childId: multipart image; JPEG/PNG/WebP only, 2 MB maximum, normalized/reencoded to WebP before private storage. Membership required.
- GET /api/avatar/:childId: authorized private image response, no shared caching.
- GET /api/live?userId=: sealed family revision query and endpoint URL; its capability expires after 60 seconds and renews through an authenticated endpoint.
- GET /api/export: authenticated family data as downloadable JSON.
- /api/auth/*: Neon SDK same-origin auth proxy. No custom password storage.

Database schema and revision updates are transactional. A family revision subscription invalidates the authenticated family snapshot. Child archive is reversible. Limits/routines are saved preferences, not enforced until a real device companion exists. No public device ingestion or media endpoints exist yet.
