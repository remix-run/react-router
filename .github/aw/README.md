# React Router agentic workflows

Repository administrators can request work with a slash-command comment, an
applicable command label, or a new comment mentioning `@remix-run-bot`.

| Command      | Target                                | Behavior                                                                                                                                                         |
| ------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/review`    | Issue                                 | Investigate, request information, or close a clear duplicate, proposal, support, invalid, or out-of-scope issue. A high-confidence fix can trigger `/implement`. |
| `/review`    | Pull request                          | Post one read-only review with concrete P1–P3 findings.                                                                                                          |
| `/review`    | Proposal Discussion                   | Post a design assessment without accepting or advancing the proposal.                                                                                            |
| `/implement` | Issue or accepted Proposal Discussion | Implement from trusted `main` and create at most one validated or checkpoint draft PR.                                                                           |
| `/iterate`   | Pull request                          | Apply administrator feedback to the exact triggering PR branch.                                                                                                  |

`aw:review` works on issues and PRs; `aw:implement` works on issues; `aw:iterate`
works on PRs. Labels invoke default behavior and are removed after triggering.
Discussions must be in the `proposals` category and use comments.

The comment router chooses one command from the administrator's comment and
item type. A bare mention or general feedback request defaults to review. It
asks for clarification when the request is ambiguous or unsupported. It
revalidates the administrator, source comment, hash, target, and router run
before the dispatched command starts. If the comment is edited after routing,
post a new comment.

An issue review may add `aw:implement-bot` to request a clearly established,
focused fix. Only `remix-run-bot` can trigger that handoff on an open issue;
explicit requests for review only or no implementation prevent it. The
implementation workflow independently verifies the diagnosis and checks for an
existing PR before making changes.

## Repository setup

Before using these workflows, make these secrets available to
`remix-run/react-router`:

- `SHOPIFY_AI_PROXY`: model access through `https://proxy.shopify.ai/v1`.
- `GH_REMIX_PAT_AW`: a token authenticating as `remix-run-bot`, with Actions write
  access for dispatch, Issues write access for labels and comments, Discussions
  write access for replies, and Contents and Pull requests write access for PR
  creation and updates. The inherited secret name is intentional.

The bot identity and fork guard use `remix-run-bot` and
`remix-run-bot/react-router`. Ensure the bot can access the base repository and
any branch it needs to update. No secrets or GitHub settings are provisioned by
these files.

The agent uses read-only GitHub credentials; the bot PAT is reserved for write
jobs. Reviews never execute contributor code. `/implement` uses Copilot with the
Shopify provider, enables the repository's pnpm version through Corepack, installs
committed dependencies, and runs trusted tests on Node 24. It follows React
Router's five modes, governance, future flags, JSDoc, and package change-file
conventions. Chromium is the default; Firefox is available for explicitly
requested Firefox or cross-browser validation. A coherent patch blocked by
validation may be saved in a checkpoint draft PR that records failed commands,
remaining work, and the workflow run. Such a draft is explicitly incomplete or
unvalidated. `/iterate` does not install dependencies or
execute PR code; it relies on ordinary PR CI for runtime validation.

Both editing commands allow only `README.md`, `packages/`, `integration/`,
`examples/`, `docs/`, `decisions/`, and `tutorials/`, with a 20-file patch limit.
Their prompts prohibit dependency, configuration, workflow, agent-instruction,
and generated-file changes. The inherited gh-aw protected-file policy requests
review for protected changes; it is not a blanket file rejection policy.

`/iterate` rechecks the exact head repository, branch, SHA, open state, and
maintainer-edit permission before writing. Community forks require maintainer
edits. This inherited path dynamically binds gh-aw's `head-repo` even though
arbitrary contributor forks are not documented as supported by gh-aw. Verify
it with a disposable fork PR before relying on it, including after upgrades.

## Editing and validation

Edit `.github/workflows/aw-*.md` and the shared
`shared/resolve-command-request.md`; regenerate the `.lock.yml` files rather
than editing them. The adapted locks are regenerated with gh-aw v0.88.7.

```sh
gh aw compile aw-comment-router aw-command-review-issue \
  aw-command-review-pull-request aw-command-review-proposal \
  aw-command-implement aw-command-iterate \
  --strict --validate --shellcheck
pnpm run format:check
git diff --check
```

`gh aw compile --actionlint` additionally requires Docker in this CLI version.
Standalone actionlint v1.7.12 reports the inherited `concurrency.queue` fields as
unsupported in both the Remix originals and regenerated locks. Keep the
compiler-generated concurrency behavior; use a compatible actionlint version
when available.

Inspect runs in the repository's Actions tab or with
`gh run list --workflow aw-comment-router.lock.yml`. Routed requests create a
router run and a separate command run. Compile and lint success validate the
workflow files; they do not establish model access, repository permissions, or
successful live execution.
