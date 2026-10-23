# Sideby Parent web

Interactive Next.js / React / TypeScript prototype with Tailwind CSS and Lucide icons. Run `npm ci` and `npm run dev` from the repository root; visit http://127.0.0.1:3000.

## Available

Family overview, child details with multiple devices, per-device demo allowances, approve/decline requests, routine toggles, new demo profiles, and reset. Sample locations and usage are static fixtures. All changes reset on reload. No login, database, pairing, enforcement, location collection, or live media is implemented.

## Checks

`npm run build` and `npm run typecheck` from the root. Browser checks covered adding a demo child, approving a request, changing one device allowance independently, routine toggling, reset, and 390 px / 1440 px layouts. Native device behavior is not testable in this prototype.

Brand SVGs in public/brand are copies of the canonical assets/brand files; update both when branding changes. Do not enter real child information into the prototype.
