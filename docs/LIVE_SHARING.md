# Live sharing contract — v1

Local implementation milestone. No production deployment, background request delivery, recording, remote control or hidden capture. LiveKit carries media; Neon stores session metadata only. Each request names one device and one kind (`screen`, `camera`, `audio`). Screen and camera never implicitly include microphone audio.

## Lifecycle and limits

Parent presses Start → `pending` (60 seconds) → child opens Live sharing, explicitly accepts, and completes Android permission flow → `approved` → device publishes → `active` → `ended`, `declined` or `expired`. Terminal states cannot be resumed. One pending/active session per device, five-minute maximum, ten requests per device per hour. Browser and device renew separate 20-second leases every five seconds. Loss of either lease, credential expiry, archive, disconnect or stop ends access. Clients stop locally on control-plane errors. A required media supervisor checks every two seconds and deletes terminal/invalid rooms; startup fails closed if its heartbeat is stale. Room cleanup failures remain retryable. Transport loss and provider failures can delay server cleanup; clients still stop locally. Tokens last 15 seconds and are confined to a random room and fixed participant identity. The supervisor repeatedly deletes terminal rooms during the token replay window. This is not a claim of instantaneous revocation or E2EE.

Camera/microphone sessions stop when their Android activity leaves the foreground. Screen sharing alone may continue through other apps after the system consent dialog, with Android foreground notification and its Stop action. Device app can always stop. No accessibility/admin auto-approval. A new session requires new local approval.

## API

All bodies are strict JSON, maximum 4 KiB, UUID identifiers. Parent mutations require authenticated owner and canonical Origin. Device requests require current paired bearer credential, scope enforced by server. Responses are no-store, errors `{error}`: 400 validation, 401 authentication, 403 origin, 404 inaccessible resource, 409 state/conflict/request limit, 503 infrastructure unavailable. Tokens are never in GET responses or logs.

- `GET /api/children/:child/live`: available devices and latest session per device; public metadata only.
- `POST /api/children/:child/live` `{device_id,kind,lens?:"front"|"back"}`: create pending session, 201. Lens only for camera, defaults front.
- `POST /api/children/:child/live/:session` `{action:"poll"|"join"|"stop"|"lens",lens?}`: poll renews parent lease; join after approval returns short-lived subscribe-only LiveKit token; stop ends; lens changes desired camera only during approved/active camera session. Parent UI reports actual lens separately, never assumes command applied.
- `POST /api/device/live` `{action:"poll"}`: pending/current request for this device; does not approve or issue token.
- `POST /api/device/live/:session` `{action:"approve"|"join"|"decline"|"stop"|"pulse",lens?:"front"|"back"}`: approve only after explicit local approval and OS prompt; join issues publish-only grant restricted to requested track source; pulse renews device lease and reports actual camera lens after successful switch. Pulse marks active only after successful local publication. Decline/stop terminal and idempotent.

Public session fields: id, device_id, kind, status, desired_lens, actual_lens, created_at, expires_at. Join adds url, token. Device join may use a separately configured emulator-reachable URL; never a client-supplied URL. Browser cannot publish media or data. Device cannot subscribe, publish other media sources, or send data commands.

## Local setup

Requires a separate LiveKit server and `scripts/live-supervisor.mjs`; Vercel functions alone cannot host them. Configure `LIVEKIT_URL`, `LIVEKIT_DEVICE_URL`, `LIVEKIT_API_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` in ignored dev env. No cloud purchase is required for local testing. Bind local development services to loopback; use adb reverse and ICE TCP for emulator tests. Hosted setup requires trusted TLS, reachable ICE/TURN, operational supervision and a separate production review.

Apply migration 007 to Neon dev. Start the web app on port 3005 and media supervisor with the matching env. Open Live sharing on the paired child app before pressing Start in the dashboard. Synthetic emulator tests do not certify physical camera/audio quality, other Android versions or mobile browsers.

## Retention

Store no recordings, media frames or tokens. Session metadata is removed after seven days by the supervisor. Provider logging configuration must be reviewed before production. State and audit rows are scoped to the child/device; cascading deletes remove them.

### Repeatable local commands

Install LiveKit from its official Homebrew formula: `brew install livekit`. Add the five LiveKit variables to `.env.dev.local`; for this emulator use `ws://127.0.0.1:7880` for both client URLs and `http://127.0.0.1:7880` for API URL. Generate a unique local key/secret; never reuse production credentials. Then:

```sh
npm run env:dev
node --env-file=.env.local scripts/migrate.mjs
npm run dev:media
# In another terminal:
npm run dev
# With the emulator connected:
adb reverse tcp:3000 tcp:3005
adb reverse tcp:7880 tcp:7880
adb reverse tcp:7881 tcp:7881
```

The local runner binds signaling to loopback and runs the required supervisor. Keep both terminals running. Physical phones require a separately reachable, TLS-secured media/backend configuration; adb reverse here is a development convenience. The website deployment remains independent.

Official references: [LiveKit local server](https://docs.livekit.io/transport/self-hosting/local/), [Android SDK](https://github.com/livekit/client-sdk-android), [Android MediaProjection](https://developer.android.com/media/grow/media-projection). Android uses LiveKit 2.29.2 with a narrowly scoped JitPack repository for its pinned audio-switch dependency.

## Verification recorded locally

- 61 authenticated/unauthenticated API checks plus token source, subscribe-only parent grants, cross-family/device scope, expiry, revocation, archive, stale-supervisor rejection and terminal-room cleanup assertions.
- 13 Android unit tests; debug/release APK builds; lint: zero errors, five warnings. Root web build and typecheck pass.
- API 37 paired emulator: screen frames appeared in the parent viewer; device Stop ended sharing. Front camera test pattern and rear virtual scene streamed. Final APK callback reported `actual_lens=back` after a requested switch, and dashboard matched. Microphone track reached the HTML audio player; leaving the activity ended the session. This does not certify audible sound quality.
- Browser layout at 390px had no horizontal overflow. Physical phones, other Android versions, full permission-denial/revocation matrix, background interruption, real microphone quality and hosted TURN remain pending.
- Dependency audit reports pre-existing Auth-tree advisories, including a critical better-auth finding; resolve/review before public parent-app deployment. This change does not upgrade the Auth stack.

Backend-outage drill: stopping the local web backend during an active camera session made the Android app stop sharing; the independent supervisor expired the leases and removed the room. Restoring the backend did not restart capture. Removing adb reverse alone did not interrupt existing keep-alive connections, so it was not treated as evidence of network-loss handling.

### Viewer presentation

The video occupies the full inner bezel without an inset panel. Screen mode follows the incoming video dimensions, including rotation, to preserve the complete screen without stretching or cropping. Camera mode fills the phone display with a centered crop. Decorative notch/home/status overlays are hidden during video so they do not cover the device’s own UI; live status remains in the caption. Idle/ended icons and copy are centered together. Layout was checked with synthetic display dimensions at desktop and mobile widths; this polish did not change session authorization or capture.

Android screen capture uses LiveKit’s native display dimensions (`VideoCaptureParameter(0, 0, 10)`) rather than a fixed 16:9 virtual display. This avoids Android embedding black side bars around taller phones; the parent viewer follows the resulting video ratio. Native resolution can increase bandwidth and encoder load; physical-device performance remains to be measured. Android may still letterbox a single shared app whose bounds differ from the display.

Verified the capture correction on API 37: encoder logs report 1080 × 2400 input/output and a fresh, OS-approved entire-screen session displayed without side bars in the signed-in parent dashboard. Debug/release builds, 13 unit tests, lint, root build and typecheck passed. The updated APK preserves the emulator pairing.
