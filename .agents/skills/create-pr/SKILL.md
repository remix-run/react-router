---
name: create-pr
description: Create and package React Router pull requests. Use when the user asks to create, open, prepare, or finish a PR for this repository, including branch/commit/push handoff, draft PR creation, PR body writing, and applying GitHub labels such as pkg:*, feat:*, docs, github-actions, or dependencies.
---

# Create React Router PR

Create the pull request handoff for completed React Router work. Default to a draft PR targeting `main` unless the user explicitly asks for a ready PR or a different base branch.

## Preconditions

- Inspect `git status --short --branch` and `git branch --show-current`.
- Do not include unrelated dirty files. If unrelated changes are present, leave them unstaged and mention them.
- If the worktree is detached, create a branch from the current `HEAD` before committing. Use the branch name requested by the user, an existing repository convention, or `<author>/<semantic-name>` when no stronger convention is available.
- If already on a suitable named branch, use it.
- Confirm appropriate automated coverage exists or was added. Do not list routine CI-covered checks in the PR body.
- If user-facing functionality is being updated, check that the appropriate package has a change file under `packages/<package>/.changes/`. This is not necessary for docs-only, GitHub Actions/workflow-only, or dependency-maintenance PRs unless the dependency change itself has user-facing impact.

## Context

- Capture what changed, why it changed, and who it affects.
- Find related issues, discussions, or PRs and include links when relevant.
- Prefer `git diff --stat` plus focused `git diff` over broad repo archaeology when the change is small.
- If the user supplies a report, issue, discussion, or related PR, treat that as the primary context source.
- For new feature work, include a concise usage snippet. If the feature replaces or improves an older approach, include before/after examples when they help reviewers.

## Commit and Push

1. Review the diff with `git diff --stat` and focused `git diff` as needed.
2. Stage only the intended files.
3. Commit with a concise imperative subject.
4. Push the branch before creating the PR.

## PR Creation

Save the PR body to a temporary file, then use `gh pr create` with:

```sh
gh pr create --draft --base main --head <branch> --title "<title>" --body-file <file>
```

- Omit `--draft` only when the user explicitly asks for a ready PR.
- Change `--base` only when the user explicitly requests a different base branch.
- Keep shell quoting simple. Prefer a body file if the body contains backticks, quotes, or multiple paragraphs.
- Include issue/discussion links when known. Use `Closes #NNNN` for bug fixes the PR should close; use `Implements #NNNN` or a plain link for RFCs/discussions when closing semantics are not appropriate.
- Include testing notes only for manual checks, unusual verification, skipped non-CI checks, or failures that reviewers should know about.
- If `gh pr create` fails, leave the branch pushed when possible and give the user a ready-to-open compare URL plus the prepared title and body.

Recommended PR body shape:

````markdown
This change ...

- Optional extra detail when useful.

```tsx
// Optional feature usage example
```
````

```tsx
// Optional before/after example
```

**Testing**

- Optional manual or non-CI verification notes only.

````

- Do not use a `## Summary` heading. Start with one or two short sentences explaining what the change accomplishes.
- Add bullets after the opening only when more detail is useful.
- Include usage examples for new features, and before/after examples for replacements or improvements, when they help reviewers understand the change.
- Add `**Testing**` with bullets below the description only when there are manual checks, unusual verification steps, skipped non-CI checks, or failures reviewers should know about. Omit it for routine automated coverage.

## Testing Notes

- Do not list linting, typechecking, unit test, or integration test commands in the PR body, even if they were run locally. CI runs these automatically.
- Do not say that CI will run routine linting, typechecking, unit tests, or integration tests. That is assumed for every PR.
- Do not add manual testing instructions by default.
- Add manual testing instructions only when necessary, such as visual/UI behavior that needs human review, environment-specific behavior not covered by CI, release/publish dry-run steps, external service integration, or a reproduction that cannot be expressed reliably in automated tests.
- When manual testing is necessary, keep the instructions minimal and directly tied to the uncovered risk.

## Labels

Apply labels after the PR exists. Rely on the stable labels listed in this skill for normal PRs.

Apply labels with:

```sh
gh pr edit <number-or-url> --add-label "<label>"
````

If `gh pr edit --add-label` fails because the specified label is invalid or missing, run:

```sh
gh label list --limit 200
```

Then choose the correct label from the live list and update this skill in place so the stable label guidance stays current. Use real labels only. If the right label does not exist, do not invent one; mention the missing label.

### Package Labels

Add every applicable `pkg:*` label based on touched package paths:

| Touched path                                         | Label                                           |
| ---------------------------------------------------- | ----------------------------------------------- |
| `packages/react-router/`                             | `pkg:react-router`                              |
| `packages/react-router-dev/`                         | `pkg:@react-router/dev`                         |
| `packages/create-react-router/`                      | `pkg:create-react-router`                       |
| `packages/react-router-architect/`                   | `pkg:@react-router/architect`                   |
| `packages/react-router-cloudflare/`                  | `pkg:@react-router/cloudflare`                  |
| `packages/react-router-node/`                        | `pkg:@react-router/node`                        |
| `packages/react-router-serve/`                       | `pkg:@react-router/serve`                       |
| `packages/react-router-express/`                     | `pkg:@react-router/express`                     |
| `packages/react-router-fs-routes/`                   | `pkg:@react-router/fs-routes`                   |
| `packages/react-router-remix-routes-option-adapter/` | `pkg:@react-router/remix-routes-option-adapter` |

If a package path is unclear, inspect its `package.json` `name` and use `pkg:<name>` when that label exists. If a change touches generated artifacts or integration tests only, infer the package label from the runtime/tooling area being tested. For example, Vite plugin or prerender integration coverage usually maps to `pkg:@react-router/dev`.

### Feature Labels

Add applicable `feat:*` labels for the behavior area being changed. Common labels include:

| Behavior area                                                                     | Label                       |
| --------------------------------------------------------------------------------- | --------------------------- |
| Core navigation, loaders/actions, fetchers, redirects, matching, and router state | `feat:router`               |
| Route config APIs and `routes.ts`                                                 | `feat:routes.ts`            |
| Vite plugin and build pipeline behavior                                           | `feat:vite`                 |
| SPA mode                                                                          | `feat:spa-mode`             |
| Prerendering                                                                      | `feat:prerender`            |
| Lazy route discovery                                                              | `feat:lazy-route-discovery` |
| Hydration and hydration fallback behavior                                         | `feat:hydration`            |
| View transition APIs                                                              | `feat:view-transitions`     |
| Middleware behavior                                                               | `feat:middleware`           |
| Split route module behavior                                                       | `feat:split-route-modules`  |
| Streaming behavior                                                                | `feat:streaming`            |
| CSS handling                                                                      | `feat:css`                  |
| Windows-specific fixes                                                            | `feat:windows`              |
| RSC Data or RSC Framework behavior                                                | `feat:rsc`                  |
| Path matching semantics                                                           | `feat:path-matching`        |
| Single fetch behavior                                                             | `feat:single-fetch`         |
| Types, typegen, and TypeScript behavior                                           | `feat:typescript`           |

Multiple feature labels are fine when the diff truly spans multiple areas. Prefer the most specific label that exists.

### Non-Package Labels

Some PRs do not need package or feature labels:

- Add `docs` for documentation-only changes.
- Add `github-actions` for `.github/workflows/` or Actions infrastructure changes.
- Add `dependencies` for dependency or lockfile-only maintenance.
- Add version labels such as `v6`, `v7`, or `v8` only when the PR is intentionally scoped to that release line or the user asks for it.

## Final Report

Report:

- Branch name.
- Commit hash.
- PR URL and whether it is draft or ready.
- Base branch.
- Labels applied.
- Verification performed or skipped.
