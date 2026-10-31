<div align="center">

<img src="assets/brand/wordmark.svg" alt="Sideby" width="220" />

# Connected families. Healthy habits.

A shared family space for parents, with a visible Android companion for children’s devices.

**[Visit the website](https://sideby.omprakashbharti.in)** · [Documentation](#documentation) · [Getting started](#getting-started) · [Feature checklist](docs/FEATURE_TRACKER.md) · [Roadmap](docs/ROADMAP.md)

</div>

---

## Overview

Sideby brings family profiles, device connections and digital habits into one place. One parent can manage multiple children, and each child can have multiple devices. Every child has a dedicated **Child’s Space**, with its own URL and navigation.

The project is developed as a monorepo with independent public website, parent web, child Android and future parent mobile applications.

> **Development status:** the public website is live, and the connected parent web foundation is implemented. The first Android connection milestone is implemented and tested against the local parent dashboard on an emulator. Device monitoring, enforcement and live media are not available yet.

## Applications

| Application | Purpose | Status | Guide |
| --- | --- | --- | --- |
| **Sideby website** | Public product overview, roadmap and FAQ | Live on Vercel at [sideby.omprakashbharti.in](https://sideby.omprakashbharti.in) | [Website](apps/website/README.md) |
| **Sideby Parent — web** | Family dashboard, child profiles, routines and device pairing | Implemented and tested locally; separate public hosting pending | [Parent web](apps/parent-web/README.md) |
| **Sideby Connect — Android** | Visible child companion for pairing and device check-ins | Local pairing/check-in milestone implemented | [Child Android](apps/child-android/README.md) |
| **Sideby Parent — mobile** | Future mobile access to the same family account | Planned; framework not selected | [Parent mobile](apps/parent-mobile/README.md) |

A debug Android APK can be built locally; no public mobile release is available yet. Android is the first companion platform; equivalent iPhone capabilities are not promised.

## Current capabilities

### Parent workspace

- Account signup, sign-in and sign-out through Neon Auth.
- Multiple child profiles, private profile photos, profile editing and archive/restore.
- Family settings, saved routines, JSON export and live account updates across signed-in browsers.
- Responsive Child’s Space pages for desktop and mobile browsers.
- Separate Photo gallery, Messages, Contacts and Call history views, ready for later companion integration.
- SMS and Social notifications views, with filters for WhatsApp, Telegram, Instagram, Facebook, other apps and all apps.

### Device connection foundation

- Expiring pairing codes and explicit parent confirmation.
- Multiple device records for each child.
- Scoped device credentials, heartbeat status and revocation.
- Server-side family ownership checks and tested pairing boundaries.

Pairing, check-ins, restart, network recovery and revocation have been verified with the Android app on an API 37 emulator. Check-ins currently run only while the app is open; physical-phone and older-Android testing remain pending. Content pages currently show empty states; they do not collect phone data. Saved routines are preferences, not enforced restrictions. Pause, location, usage and screen/camera/microphone features remain pending even after a device record is paired. Recovery email delivery and a full password reset still require verification.

See [verification evidence](docs/VERIFICATION.md) and [parent-web readiness](docs/PARENT_WEB_READINESS.md) for the exact scope and remaining launch requirements.

## Repository structure

```text
sideby.omprakashbharti.in/
├── apps/
│   ├── website/          # Public landing website — Next.js static export
│   ├── parent-web/       # Parent dashboard and initial backend
│   ├── child-android/    # Sideby Connect — native Kotlin companion
│   └── parent-mobile/    # Reserved for the future parent mobile client
├── packages/
│   └── ui/               # Reserved for shared web components
├── assets/brand/          # Master SVG logos, icons and design tokens
├── db/migrations/        # Reviewed database migrations
├── scripts/              # Setup, demo data and service verification
├── postman/              # Versioned API test collections
└── docs/                 # Product, architecture, security and delivery guides
```

Reserved directories contain planning documentation; they are not runnable applications yet.

## Technology

| Layer | Current choice |
| --- | --- |
| Web applications | Next.js, React and TypeScript |
| Styling | Tailwind CSS and custom styles in parent web; dedicated responsive CSS in the website |
| Backend | Next.js server routes with server-side authorization |
| Database and identity | Neon Postgres and Neon Auth |
| Files and live account updates | Private Neon Object Storage and Neon Realtime |
| Public website hosting | Vercel, with DNS managed in Cloudflare |
| Android companion | Kotlin, Android platform Views, Gradle |
| Parent mobile | To be selected |
| Live media | LiveKit under evaluation; no integration implemented |

The public website has no database access or backend secrets. Future audio/video sessions require separate media infrastructure; database Realtime is used for account updates.

## Getting started

Use **Node.js 22+** and npm. Local builds have been validated with Node.js 24.

```sh
npm ci
```

### Public website

No environment variables are needed.

```sh
npm run dev:website
```

Open [localhost:3001](http://127.0.0.1:3001). For a production static export:

```sh
npm run build:website
```

The output is generated in `apps/website/out/` and is not committed.

### Parent dashboard

Use the `dev` code branch and isolated Neon `dev` environment for local work; `prod` retains reviewed production code. See [environment switching and email-code recovery](docs/ENVIRONMENTS.md).

Follow [Neon setup](docs/NEON_SETUP.md) to configure the selected backend, environment and migrations. The variable names are listed in [.env.example](.env.example). Next.js reads `apps/parent-web/.env.local`; repository scripts read the root `.env.local`.

```sh
npm run dev
```

Open [localhost:3005](http://127.0.0.1:3005), create a parent account and set up a family. For optional synthetic profiles, follow [demo data setup and cleanup](docs/DEMO_DATA.md).

Never commit environment files or put server credentials in browser-visible variables.

### Build and validation

From the repository root:

```sh
npm run build
npm run typecheck
```

Both commands cover both web applications. Live service tests create synthetic records and require a deliberately selected backend; follow the [test plan](docs/TEST_PLAN.md) and [Neon guide](docs/NEON_SETUP.md) before running them.

## Mobile development roadmap

The first **Sideby Connect** milestone now proves the connection on an emulator. Follow the [Android setup guide](apps/child-android/README.md) and [test evidence](docs/ANDROID_CONNECTION.md):

1. Install a visible companion on an Android emulator or test phone.
2. Enter a pairing code and confirm the device in Sideby Parent.
3. Store the scoped device credential securely.
4. Send check-ins and verify status in the dashboard.
5. Test restart, offline recovery and revocation; expand device and expiry testing next.

This milestone does not need contacts, SMS, notification, location, camera or microphone permissions. Those capabilities require separate implementation, disclosure and platform testing. A physical phone also needs a reachable parent backend; the public landing website is not that backend.

The future parent mobile app will use the same family model. Its framework and native authentication approach remain open decisions. See the [roadmap](docs/ROADMAP.md) and [decisions](docs/DECISIONS.md).

## Documentation

| Topic | Reference |
| --- | --- |
| Live feature checklist and next work | [Feature board](docs/FEATURE_TRACKER.md) |
| Product scope and requirements | [PRD](docs/PRD.md) |
| System design and data boundaries | [Architecture](docs/ARCHITECTURE.md) |
| Parent web completion and next steps | [Readiness checklist](docs/PARENT_WEB_READINESS.md) |
| Child dashboard routes and views | [Child’s Space](docs/CHILD_SPACE.md) |
| Backend contracts and device lifecycle | [API](docs/API.md) · [Pairing](docs/PAIRING.md) |
| Local backend configuration | [Neon setup](docs/NEON_SETUP.md) |
| Hosting, domain and rollback | [Deployment](docs/DEPLOYMENT.md) |
| Test scope and completed checks | [Test plan](docs/TEST_PLAN.md) · [Verification](docs/VERIFICATION.md) |
| Privacy and security boundaries | [Security](docs/SECURITY.md) |
| Contributions and AI assistance | [Contributing](CONTRIBUTING.md) · [Git workflow](docs/GIT_WORKFLOW.md) · [Agent instructions](AGENTS.md) |

## Privacy and security

Sideby is designed around visible, permission-based connections. The child app must not hide itself, impersonate a system service or bypass platform permissions. Planned live sessions are view-only, authorized and stoppable on the child device.

Use synthetic data for development and screenshots. Do not commit real child information, credentials, recordings or database dumps. Account deletion, retention, recovery, operational monitoring and further security review remain public-app launch requirements. See [security guidance](docs/SECURITY.md).

## Brand

![Sideby brand banner](assets/brand/social-banner.svg)

**Sideby Parent** is the parent experience. **Sideby Connect** is the child companion. The linked symbol represents family members side by side.

Editable logos, app icons, monochrome variants and design tokens live in [assets/brand](assets/brand/README.md). Trademark clearance remains pending.

## Contributing and ownership

Use a dedicated `feat/` branch and pull request for new features. Routine fixes and documentation updates use `fix/maintenance`. Follow Conventional Commits and include relevant verification; the owner reviews and merges feature PRs.

This repository does not grant an open-source license. See [LICENSE.md](LICENSE.md).
