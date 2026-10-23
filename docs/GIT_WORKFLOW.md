# Git workflow

## Branches

`main` is the stable reviewed branch. Use short-lived branches: `feat/family-dashboard`, `fix/pairing-expiry`, `docs/update-prd`, `chore/dependencies`, or `refactor/request-state`.

Start from an up-to-date main. Keep one concern per branch, open a pull request, run relevant checks, review, then squash merge. Delete merged branches. No separate develop branch is needed initially.

## Commits

Use Conventional Commits, for example `feat: add child profiles`, `fix: reject expired pairing codes`, and `docs: define live-session requirements`. Never commit secrets, real child data, or generated build outputs.

The initial repository bootstrap may be committed directly to main because no baseline exists. Subsequent work uses pull requests. Never force-push main; avoid rewriting shared history.

## GitHub settings to enable

Require pull requests and successful checks on main, block force pushes and deletion, and require an independent review when another maintainer is available. These settings are recommendations, not configured by adding this file. Enable private vulnerability reporting where supported. Configure CODEOWNERS once maintainers are chosen.

Use semantic version tags once releases exist. Do not tag this documentation foundation as a production release.
