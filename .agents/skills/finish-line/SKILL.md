---
name: finish-line
description: Bring a blocked React Router community pull request across the finish line. Use when the user invokes `/finish-line` or `$finish-line`, provides a PR number or URL, and asks Codex to resolve merge blockers such as a missing change file, missing documentation, missing tests, or stale contributor follow-up. Handles evaluating the blocker and pushing small maintainer fixes onto a contributor PR branch when authorized.
---

# Finish Line

## Overview

Finish blocked community PRs in `remix-run/react-router` while respecting contributor ownership and the repo's PR packaging conventions.

Treat the PR number or URL in `$ARGUMENTS` as the target PR. If no target is provided, ask for it before doing anything.

## Triage

1. Inspect local state with `git status --short --branch`. If unrelated dirty files exist, do not overwrite or stage them.
2. Fetch current main before making branch decisions:

```sh
git fetch origin main
```

3. Gather PR context:

```sh
gh pr view <pr> --repo remix-run/react-router --json number,title,body,state,isDraft,author,baseRefName,headRefName,headRepository,headRepositoryOwner,maintainerCanModify,mergeStateStatus,reviewDecision,labels,files,commits,statusCheckRollup,url
gh pr checks <pr> --repo remix-run/react-router
gh pr diff <pr> --repo remix-run/react-router --stat
gh pr view <pr> --repo remix-run/react-router --comments
```

4. Identify merge blockers. In particular:

- If the PR only needs repo-maintainer additions such as tests, a change file, or docs, use the contributor-branch workflow.
- If the contributor branch cannot be modified, summarize the evidence and ask the user whether to wait for the contributor or recreate the work on a maintainer branch.
- If the blocker is unclear, summarize the evidence and ask the user which path to take.

5. Evaluate test coverage before deciding the finish-line changes:
   - Inspect the PR diff, changed files, existing nearby tests, review comments, and failed checks for test expectations.
   - If the PR changes runtime behavior, build/plugin behavior, routing semantics, generated types, RSC behavior, docs rendering, or any bug/feature surface that can regress, add or preserve a focused test unless equivalent coverage already exists.
   - If tests are already included, verify they exercise the changed behavior and cover the affected React Router mode(s): Declarative, Data, Framework, RSC Data, and/or RSC Framework.
   - If tests are not needed because the change is documentation-only, packaging-only, a change file, or otherwise not executable behavior, note that rationale in the final report.
   - If a useful test is required but too large or risky for the finish-line scope, stop and ask the user before broadening the PR.

## Contributor-Branch Workflow

Use this path when the missing work is a small maintainer follow-up, such as tests, a change file, or docs, and the contributor branch can be modified.

1. Check out the PR branch:

```sh
gh pr checkout <pr-number> --repo remix-run/react-router
```

2. Confirm the branch and local state:

```sh
git status --short --branch
git branch --show-current
```

3. Make only the missing finish-line changes, including focused tests when the coverage evaluation requires them. Do not refactor the contributor's work unless it is necessary to unblock mergeability and the user agrees.
4. Validate the exact content with the user before pushing:
   - For a change file, show the package path, file name, change type, and full markdown contents.
   - For docs, show the affected files and the relevant prose/API snippets.
   - For tests, show the test file path, the behavior covered, and the mode(s) covered.
   - Ask explicitly for approval to commit and push back to the PR branch.
5. After approval, run focused validation when appropriate, commit the maintainer follow-up, and push to the PR branch. If `git push` fails because the contributor branch cannot be modified, stop and report the failure instead of opening a replacement PR unless the user approves that pivot.

## Change Files

Create change files under the affected package:

```text
packages/<package>/.changes/<type>.<unique-meaningful-name>.md
```

Use `patch`, `minor`, `major`, or `unstable` for `<type>`. For bug fixes and narrow behavior fixes, default to `patch`. Keep the content concise:

```markdown
Brief description of the user-facing change
```

If the PR spans multiple packages, prefer the package with the direct user-facing API or runtime behavior. Ask the user when the package or change type is not obvious.

## Documentation

Do not add documentation by default for ordinary bug fixes. Add docs when the PR changes a documented API, introduces new behavior users need to discover, changes examples, or the user/reviewer explicitly requested docs.

Follow repo docs rules:

- Edit source docs or JSDoc, not generated `docs/api/` output.
- Include mode context when adding docs for React Router behavior: Declarative, Data, Framework, RSC Data, or RSC Framework.
- For API docs generated from JSDoc, edit `packages/react-router/lib/` comments and note that `pnpm run docs` may be required.

## Final Report

Report the path taken and the current PR state:

- Original PR number and blocker.
- Whether changes were pushed to the contributor branch or a replacement PR was opened.
- Branch, commit hash, and PR URL when applicable.
- Any old-PR comment/close action taken.
- Validation performed or skipped.
- Test coverage decision: added, already present, or intentionally omitted with rationale.
