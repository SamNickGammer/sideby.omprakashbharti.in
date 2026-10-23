# Git workflow

## Branches

`main` is the stable reviewed branch. Use a dedicated short-lived `feat/` branch for each brand-new feature, for example `feat/family-dashboard`.

Start feature branches from an up-to-date main, run relevant checks, and open a pull request for the owner to review and merge. Delete merged feature branches. No separate develop branch is needed initially.

Reuse `fix/maintenance` for small fixes, UI polish, and routine documentation or maintenance. Bring in latest `origin/main` before starting and preserve existing maintenance commits. Use focused commits and push to this shared branch without opening a PR for each small change. The owner decides when to integrate maintenance into main; do not merge automatically.

## Commits

Use Conventional Commits, for example `feat: add child profiles`, `fix: reject expired pairing codes`, and `docs: define live-session requirements`. Never commit secrets, real child data, or generated build outputs.

The initial repository bootstrap may be committed directly to main because no baseline exists. Subsequent work follows the feature and maintenance workflow above. Never force-push main; avoid rewriting shared history.

## GitHub settings to enable

Require pull requests and successful checks on main, block force pushes and deletion, and require an independent review when another maintainer is available. These settings are recommendations, not configured by adding this file. Enable private vulnerability reporting where supported. Configure CODEOWNERS once maintainers are chosen.

Use semantic version tags once releases exist. Do not tag this documentation foundation as a production release.
