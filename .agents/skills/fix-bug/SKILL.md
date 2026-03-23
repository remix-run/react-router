---
name: fix-bug
description: Fix a reported bug in React Router from a GitHub issue. Use when the user provides a GitHub issue URL and asks to fix a bug, investigate an issue, or reproduce a problem. Handles the full workflow: fetching the issue, finding the reproduction, writing a failing test, and implementing the fix.
disable-model-invocation: true
---

# Fix React Router Bug

Fix the bug reported in the following GitHub issue: $ARGUMENTS

## Branching

Bug fixes should start from a clean working tree. If there are changes, prompt me to resolve them before continuing.

Bugs should be fixed from the `dev` branch in in a new branch using the format `{author}/{semantic-branch-name}` (i.e., `brophdawg11/fix-navigation`):

```sh
git branch {author}/{semantic-branch-name} dev
git checkout {author}/{semantic-branch-name}
```

## Workflow

### 1. Fetch and Understand the Issue

Use `gh issue view <number> --repo remix-run/react-router` or `WebFetch` to read the full issue.

Extract:

- Bug description and expected vs actual behavior
- React Router version and mode (Declarative / Data / Framework / RSC)
- Any code snippets in the issue
- Links to reproductions (StackBlitz, CodeSandbox, GitHub repo, etc.)

### 2. Validate the Reproduction

**If there's a StackBlitz/CodeSandbox/online sandbox link:**

- Use `WebFetch` to read the sandbox URL and extract the relevant code
- Identify the exact sequence of events that triggers the bug

**If there's a GitHub repository link:**

- Use `WebFetch` to read key files (`package.json`, relevant source files) from the raw GitHub URL
- Identify the route configuration, loaders, actions, or components involved

**If no reproduction link exists:**

- Search the issue comments with `gh issue view <number> --repo remix-run/react-router --comments`
- Look for code snippets in comments
- Ask the user: "No reproduction was provided. Can you share a minimal reproduction or paste the relevant code?"

### 3. Identify the Affected Code

Based on the bug, locate the relevant source files. Consult the key file map:

| Area                   | Files                                                       |
| ---------------------- | ----------------------------------------------------------- |
| Core router logic      | `packages/react-router/lib/router/router.ts`                |
| React components/hooks | `packages/react-router/lib/components.tsx`, `lib/hooks.tsx` |
| DOM utilities          | `packages/react-router/lib/dom/`                            |
| Vite/Framework plugin  | `packages/react-router-dev/vite/plugin.ts`                  |
| RSC                    | `packages/react-router/lib/rsc/`                            |

Use `Grep` and `Glob` to trace the relevant code paths.

### 4. Write a Failing Test

**Unit test** (for router logic, hooks, pure component behavior — no build needed):

- Location: `packages/react-router/__tests__/`
- Use Jest; run with: `pnpm test packages/react-router/__tests__/<file>`
- Match the style of nearby test files (describe/it blocks, `createStaticHandler`, `createMemoryRouter`, `render`, `screen`, etc.)

**Integration test** (for Vite plugin, SSR, hydration, Framework Mode):

- Location: `integration/`
- Use Playwright with `createFixture()` → `createAppFixture()` → `PlaywrightFixture`
- Run with: `pnpm test:integration:run --project chromium integration/<file>`
- Build first if needed: `pnpm test:integration --project chromium`

Write the test to **reproduce the bug exactly** — it must fail before the fix.

Run it and confirm it fails:

```bash
pnpm test packages/react-router/__tests__/<file>  # unit
# or
pnpm test:integration:run --project chromium integration/<file>  # integration
```

### 5. Implement the Fix

- Make the minimal change needed to fix the bug
- Do not refactor unrelated code
- Confirm the fix addresses the root cause, not just the symptom
- Consider all five modes: does this fix break anything in Declarative / Data / Framework / RSC?

Run the failing test again — it must now pass:

```bash
pnpm test packages/react-router/__tests__/<file>
```

Run the broader test suite to check for regressions:

```bash
pnpm test packages/react-router/
```

If the fix touches Framework/Vite code, run integration tests too:

```bash
pnpm test:integration:run --project chromium
```

Confirm linting and typechecking pass:

```bash
pnpm lint
pnpm typecheck
```

### 6. Create a Changeset

Create `.changeset/<descriptive-name>.md`:

```markdown
---
"react-router": patch
---

fix: <brief description of what was fixed>
```

Use `patch` for bug fixes. Only include packages in the frontmatter that were actually changed.

### 7. Report Results

Summarize:

- What the bug was and why it happened
- What code was changed and why
- That the test now passes
- Any edge cases or related issues noticed

Ask me to review the changes and iterate based on any feedback.

### 8. Open PR

Once I approve the fix, commit the changes and open a PR to `dev`. Include a `Closes #NNNN` in the description to link the PR to the original issue. Also link the issue in the `Development` sidebar
