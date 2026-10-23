# Contributing

Read the PRD and architecture before implementation. Create a dedicated feature branch from current main for brand-new features. Reuse `fix/maintenance` for small fixes and routine updates, bringing in latest `origin/main` first. Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, or `test:`. See [Git workflow](docs/GIT_WORKFLOW.md).

For new features, submit a pull request explaining the problem, behavior change, checks performed, and limitations for the owner to merge. Push small fixes to the shared maintenance branch without opening individual PRs or automatically merging main. Include screenshots for UI changes using synthetic data. Keep dependency lockfiles with the application setup. Do not commit credentials or generated build output.

Run `npm run build` and `npm run typecheck` from the repository root before review. Both web apps must pass. Validate changed Markdown links and SVG assets; browser-check responsive UI changes. For backend changes run the relevant service/pairing checks using synthetic accounts in an authorized environment, then clean up. See docs/TEST_PLAN.md and docs/VERIFICATION.md. The owner merges reviewed feature PRs; do not merge automatically.
