# Child Space

## What changed

Creating a child now collects name, age and profile color. Usage is unrestricted by default. Child cards link to a bookmarkable space; no allowance fields remain in the child API or UI.

The desktop layout uses a compact family icon rail and a child sidebar. On mobile the family rail becomes a top row and the child sections scroll horizontally within their own navigation strip. Family links return to the matching family section.

Routes under `/dashboard/children/:id`:

| Path suffix | View |
| --- | --- |
| none | Child overview and pause entry point |
| `/usage` | Digital wellbeing |
| `/apps` | Installed applications |
| `/notifications` | Authorized notifications |
| `/screen` | View-only screen viewer |
| `/camera` | Shared phone-shaped viewer, front/back lens choice |
| `/audio` | Microphone session view |
| `/accounts` | Authorized account-label view |
| `/services` | Supported device services/permission status |
| `/devices` | Companion pairing explanation |
| `/settings` | Profile edit, private avatar and archive/restore |

The pages are real routes with server-side ownership checks. Device data, pairing, pause enforcement and live media are not implemented. Controls requiring a phone remain disabled with an explanation. Camera selection changes the UI's requested lens only. A profile is not a paired device; one profile can eventually contain multiple devices. Account credentials and private account content are never collected.

## Database compatibility

Migration `002_unrestricted_children.sql` sets the legacy daily_limit column's default to NULL and permits NULL. Existing values are preserved but are no longer used by the application. Both numbered migrations are repeatable; the runner executes them in filename order. The schema change was tested on temporary Neon branch `sideby-child-space-check` before application to the linked production branch. New inserts without an allowance were verified to store NULL. Migration does not delete family data.

The child API intentionally rejects legacy daily_limit request fields. Existing open browser tabs must refresh to load the new client.

## Verification

- `npm run build` and `npm run typecheck` passed.
- The live service test passed all eleven child routes for the owner; another family's camera URL returned 404, as did an unknown section.
- Profile creation without an allowance succeeded; the response excluded daily_limit and a legacy allowance request returned 400.
- Existing Auth, storage, Realtime, profile archive/restore, routines and cross-origin checks passed.
- Browser checked no allowance field in child creation, direct child navigation, front/back camera selection, mobile profile editing and responsive layout at 1440×1000 and 390×844. Mobile document width was 375px within the 390px viewport (no page overflow).
- Screenshots use synthetic QA data. No real device was accessed or controlled.

Screenshots: [desktop camera](previews/child-camera-desktop.png), [mobile camera](previews/child-camera-mobile.png).
