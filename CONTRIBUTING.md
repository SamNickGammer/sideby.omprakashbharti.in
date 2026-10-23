# Contributing

Read the PRD and architecture before implementation. Create a dedicated feature branch from current main for brand-new features. Reuse `fix/maintenance` for small fixes and routine updates, bringing in latest `origin/main` first. Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, or `test:`. See [Git workflow](docs/GIT_WORKFLOW.md).

For new features, submit a pull request explaining the problem, behavior change, checks performed, and limitations for the owner to merge. Push small fixes to the shared maintenance branch without opening individual PRs or automatically merging main. Include screenshots for UI changes using synthetic data. Keep dependency lockfiles with the application setup. Do not commit credentials or generated build output.

Run applicable checks before review. For this foundation, check Markdown links and SVG validity. Future application work must add lint, type checking, and meaningful behavioral tests. Squash merge reviewed changes and delete merged branches.
