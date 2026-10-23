---
name: release-react-router
description: Perform React Router releases through the generated release PR, from readiness review through merge and verification of npm versions, dist-tags, git tags, and the GitHub release. Also use for release-readiness reviews or following an already merged release through publication.
---

# Release React Router

Use the existing release automation. Read [DEVELOPMENT.md](../../../DEVELOPMENT.md), [.github/workflows/release.yml](../../../.github/workflows/release.yml), and `scripts/changes/{pr,publish}.ts` for the current process and tag rules. This skill covers generated release PRs; experimental releases use a separate workflow.

A request to perform a release authorizes merging the verified PR and following publication. A readiness-only request stops with the review. Creating or editing this skill does not authorize a live release.

## Review the release PR

- Find the generated release PR in `remix-run/react-router`, targeting `main` by default or the requested `v7`/existing `hotfix` branch. Confirm its source repository and generated branch match `scripts/changes/pr.ts`. Attach the PR to the chat when the app provides that tool.
- Record the exact head SHA and current base tip. Require the candidate to contain that tip; otherwise wait for automatic PR regeneration and review the updated head. Use GitHub APIs or fetched Git objects to inspect files without changing the user's checkout.
- Review the diff for the expected package version bumps, root/package changelogs, deleted pending change files, and consumption of `scripts/changes/whats-changed.md` when present. Confirm the notes represent the pending changes and preserve any manual narrative. Under the current generator, package manifests change only their version; investigate extra paths or fields.
- Capture the expected package/version pairs and their npm/git tags from the candidate and current publish script. Discover the package set and versions each run. For non-main releases, record GitHub's current latest release ID before merging so it can be checked afterward.
- Use **PR CI** for build, test, typecheck, lint, and integration validation. Check all required and applicable jobs on the reviewed head/test merge, accounting for current workflow path filters and intentional matrix skips. Pending, failed, canceled, missing, or stale checks hold the release. No local dependency install, build, packing, consumer smoke, or regeneration is part of the normal release review.

Report ready/hold with any blockers, the reviewed SHA, and CI evidence. For an authorized release, continue directly when ready. Fix source notes on the base through the normal process if authorized; let automation regenerate the release PR instead of editing its branch.

## Merge and follow the workflow

1. Refresh the PR, base tip, reviews, mergeability, and checks immediately before merging. If the reviewed head or base changed, review the updated candidate first. Honor branch protection and blocking reviews.
2. Briefly state the version, PR, and verified SHA, then merge with a supported strategy and a head guard. For example, when squash merge is enabled:

   ```sh
   gh pr merge <number> --repo remix-run/react-router --squash --match-head-commit <reviewed-head-sha>
   ```

   Do not use `--admin` or enable unattended auto-merge while readiness is incomplete. If queued, follow the queue until the PR is actually merged. Capture the resulting merge SHA; check that its tree contains the reviewed release changes against the reviewed base, since the head guard does not freeze the base.

3. Follow the `release.yml` **push** run on the intended branch at that merge SHA. Use waits of at most 60 seconds and report meaningful progress. Confirm readiness selected publication, then follow Publish and the applicable release-comment job. A skipped Publish job or PR-regeneration path needs investigation.

The merge triggers stable publication. Keep publishing in the workflow; do not run local publish commands or dispatch the experimental job for this release.

## Verify publication

After Publish completes, verify the external artifacts with read-only `npm`, `git`, and `gh` commands:

- For **every expected package**, query the exact version and its dist-tag against `https://registry.npmjs.org`. For example, `npm view '<package>@<version>' version --json --registry=https://registry.npmjs.org` and `npm view '<package>' dist-tags --json --registry=https://registry.npmjs.org`. Require the version to exist and the intended tag to point to it. Registry/network errors are inconclusive, not evidence of a missing or successfully published version.
- Verify every remote `<package-name>@<version>` git tag resolves to the merge SHA, peeling annotated tags when needed. Check the remote, not cached local tags.
- Verify the `react-router@<version>` GitHub release exists, is published rather than draft/prerelease, is named `v<version>`, and links to this version's changelog. For `main`, confirm it is GitHub's latest release; for other branches, confirm the previously recorded latest release was not displaced.

Current rules: `main` and `hotfix` use npm `latest`; `v7` uses `version-7` except `react-router-dom`, which uses `latest`. All published packages get git tags, including scoped packages. Only `react-router` gets a GitHub release. Reconfirm these rules against the current scripts.

Allow registry propagation with bounded retries. On workflow failure or partial publication, inspect logs and report which packages, tags, or releases are missing. **Do not blindly rerun:** the workflow's core-version guard may skip publishing after npm succeeds, leaving tags/releases incomplete. Diagnose read-only and obtain authorization for any recovery beyond the original release, such as moving tags or manually creating a release.

## Completion

Report the PR and merge SHA, Release run URL/conclusion, npm version/dist-tag results for every expected package, remote git tag verification, and the GitHub release URL/latest status. Report release-comment failures separately. Say **released and verified** only after publication checks pass; otherwise describe the exact pending or partial state.
