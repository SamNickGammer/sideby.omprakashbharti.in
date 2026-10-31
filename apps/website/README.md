# Sideby public website

A separate, responsive Next.js static landing page for `sideby.omprakashbharti.in`. It introduces Sideby, explains the current local-test pairing journey, answers common questions and labels implemented versus planned functionality. Illustrative profiles are not real child data.

## Local development

From the repository root:

```sh
npm ci
npm run dev:website
# http://127.0.0.1:3001
npm run build:website
npm run typecheck --workspace=@sideby/website
```

The production static export is `apps/website/out/`. It is ignored by Git. No environment variables, database, auth session, analytics, forms or device permissions are needed. The site does not offer a public signup or Android download yet.

## Files

- `app/page.tsx`: homepage, product illustration, roadmap and native FAQ disclosures.
- `app/globals.css`: responsive styles, keyboard focus and reduced-motion support.
- `app/layout.tsx`: title, canonical URL, description, Open Graph metadata and favicon.
- `public/brand/`: copied brand SVGs from `assets/brand/`; refresh these when the master assets change.
- `public/robots.txt` and `public/sitemap.xml`: search crawler configuration.
- `next.config.ts`: static export configuration.

## Hosting

Import the existing GitHub repository into a **separate Vercel project** with root `apps/website` and Next.js preset. Use the workspace lockfile and default build settings. Production should follow `main` after the feature PR is merged. See [deployment and DNS](../../docs/DEPLOYMENT.md) for the verified deployment state and Cloudflare setup. Do not copy parent-web or Neon secrets into this project.

## Content maintenance

Update public claims only after the related capability is implemented and verified. Keep the Android status and dashboard launch status truthful. Add a parent-app link only after its public HTTPS deployment and trusted authentication origin are verified. The FAQ is product information, not a substitute for a launch-ready privacy policy or terms.

## Public help pages

`/setup/` explains pairing, optional permissions and per-session approval. `/privacy/` describes current development data handling and unresolved launch requirements. `/support/` provides troubleshooting and links to public issues for non-sensitive bugs only. All pages are static, responsive and included in the sitemap, with individual canonical metadata. Public dashboard/APK links remain intentionally absent until those releases are verified.

## Policy and support integration

The website stays statically exported. `NEXT_PUBLIC_ADMIN_API_ORIGIN` is a public HTTPS origin (not a secret) pointing to the separate admin service. Published policy text/version history is loaded from its read-only public endpoint. The support form POSTs bounded text to the private report inbox; it never posts to GitHub. If the service fails, the UI shows an error instead of inventing a current policy or claiming a report was saved. Footer links use one consistent size, including Support. `/terms/` is included in the sitemap.
