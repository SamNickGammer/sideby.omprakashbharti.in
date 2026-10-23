# Sideby

![Sideby logo](assets/brand/wordmark.svg)

Connected families. Healthy habits.

Sideby helps parents manage multiple children and their devices through a shared parent account on web and, later, mobile. The child companion is **Sideby Connect**. The parent experience is **Sideby Parent**.

## Status

Project foundation only: documentation, brand assets, repository workflow, and application directories. There is no running application, database, authentication, Android app, or streaming service yet. No paid services have been provisioned.

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

There is no install or run command until application scaffolding is implemented. Example configuration names are in `.env.example`; never commit real secrets.

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
