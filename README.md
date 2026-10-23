# Sideby

![Sideby logo](assets/brand/wordmark.svg)

Connected families. Healthy habits.

Sideby helps parents manage multiple children and their devices through a shared parent account on web and, later, mobile. The child companion is **Sideby Connect**. The parent experience is **Sideby Parent**.

## Status

An interactive parent-web prototype is available with clearly labeled synthetic data. It includes family and child views, device allowance editing, extra-time requests, routine toggles, and adding demo profiles. All changes are in memory and reset on reload. Authentication, database integration, Android companion, and live streaming are not implemented. No paid services have been provisioned.

## Structure

- `apps/parent-web/`: parent dashboard, built first.
- `apps/website/`: separate public landing website.
- `apps/child-android/`: future Android companion.
- `apps/parent-mobile/`: future parent mobile client.
- `packages/ui/`: future shared web components.
- `assets/brand/`: editable SVG brand assets and color tokens.
- `docs/`: product, architecture, security, roadmap, and delivery guidance.

## Proposed technology

Next.js and TypeScript for both websites; Tailwind CSS for styling; Neon Postgres for family data; Vercel for web hosting; Kotlin for the Android companion. Authentication provider selection is pending a web/mobile compatibility review. LiveKit is the candidate for visible, authorized live media sessions, subject to a real-device feasibility milestone.

## Start here

1. Read [product requirements](docs/PRD.md), [architecture](docs/ARCHITECTURE.md), and [roadmap](docs/ROADMAP.md).
2. Follow [contribution guidance](CONTRIBUTING.md) and [Git workflow](docs/GIT_WORKFLOW.md).
3. Follow [AI instructions](AGENTS.md) when using coding assistants.

## Run the parent dashboard

Use Node.js 22 or newer (validated locally with Node.js 24).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No credentials or environment variables are required for demo mode.

```sh
npm run build
npm run typecheck
```

The landing website remains a separate reserved directory. Example future configuration names are in `.env.example`; never commit real secrets.

## Brand assets

![Sideby brand banner](assets/brand/social-banner.svg)

| Sideby Parent | Sideby Connect |
| --- | --- |
| ![Parent icon](assets/brand/parent-icon.svg) | ![Connect icon](assets/brand/connect-icon.svg) |

The logo uses two open links that form an abstract **S**, representing family members side by side. The kit includes light/dark logos, product lockups, distinct app icons, monochrome symbols, a favicon, a social banner, and a background pattern.

Browse the [asset guide](assets/brand/README.md) or open [the brand gallery](assets/brand/preview.html) locally. SVG sources stay editable; native mobile and raster social exports will be added during integration.

## Brand and domain

Sideby is the selected working brand. Trademark and domain availability have not been verified. `sideby.omprakashbharti.in` is the intended landing address; deployment and DNS are not configured. A parent dashboard subdomain remains to be configured.

## Ownership

No open-source license is granted by this repository. See [license status](LICENSE.md).
