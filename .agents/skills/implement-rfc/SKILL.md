---
name: implement-rfc
description: Implement a React Router RFC from a GitHub discussion URL. Fetches the proposal, evaluates community feedback, resolves outstanding questions interactively, then implements the feature with tests, future flags (if breaking), and a changeset.
disable-model-invocation: true
---

# Implement React Router RFC

Implement the RFC from the following GitHub discussion: $ARGUMENTS

## Branching

RFC implementations should start from a clean working tree. If there are uncommitted changes, stop and ask me to resolve them before continuing.

- If you are already on a named branch that is at the same HEAD as `dev`, use that branch.
- Otherwise, create a branch from `dev` using the format `{author}/rfc-{semantic-name}`:
  ```sh
  git branch {author}/rfc-{semantic-name} dev
  git checkout {author}/rfc-{semantic-name}
  ```

## Workflow

### 1. Fetch and Understand the RFC

Use `WebFetch` to read the discussion URL. If a GitHub discussion number is given instead of a URL, construct:
`https://github.com/remix-run/react-router/discussions/<number>`

Extract:

- **Problem being solved**: what pain point does this RFC address?
- **Proposed API**: exact function signatures, hook names, types, option shapes
- **Affected modes**: Declarative / Data / Framework / RSC Data / RSC Framework
- **Breaking changes**: does this change or remove existing public API?
- **Open questions**: anything explicitly marked as unresolved, "TBD", or asked as a question in the proposal
- **Status**: are there linked tracking issues? Look for links to other github issues and read them to see if there is additional context.

  ```sh
  gh issue view <number> --repo remix-run/react-router
  ```

### 2. Evaluate Community Feedback

Fetch all comments from the discussion:

Use `WebFetch` on `https://github.com/remix-run/react-router/discussions/<number>` and scroll through the full thread. Look for:

- **Concerns or objections** raised by community members or maintainers
- **Alternative proposals** or API shape suggestions
- **Edge cases** raised that the proposal does not address
- **Positive signals** — repeated praise for a specific approach signals it's the right direction
- **Maintainer responses** — Ryan Florence, Michael Jackson, or other core team members clarifying intent

Summarize the community sentiment into:

- Points of consensus (safe to proceed)
- Points of contention (need resolution before implementing)
- Unanswered questions from the original proposal

### 3. Resolve Outstanding Questions

Before writing any code, present me with a numbered list of every unresolved question — from both the RFC itself and from community feedback. For each question:

- State the question clearly
- Summarize relevant community input
- Offer a recommended answer with reasoning

Ask me to confirm, override, or skip each question. Do not proceed to implementation until all questions are either answered or explicitly deferred.

Example format:

```
## Unresolved Questions

1. **Should `useRouterState()` accept a path argument for scoped matching?**
   Community feedback: 3 comments in favor, 1 against (concerns about complexity).
   Recommendation: Yes — scoped matching improves type safety for nested routes.
   → Your decision: [confirm / override / defer]

2. **What should happen when the path doesn't match the current location?**
   Recommendation: Return `null` for active state (consistent with `useMatch()`).
   → Your decision: [confirm / override / defer]
```

Save the resolved decisions to a scratch file at `tasks/rfc-decisions.md` for reference during implementation.

### 4. Plan the Implementation

Before writing code, produce a concise implementation plan covering:

- New types/interfaces to add
- New functions/hooks to implement and their file locations
- Existing APIs to deprecate (mark with `@deprecated` JSDoc + console warning in dev)
- Whether a future flag is needed (see §5 below)
- Test files to create or extend (unit and/or integration)
- Changeset bump level (`minor` for new features, `major` for breaking changes behind a future flag that is now defaulted on)

Present the plan to me and wait for approval before implementing.

### 5. Future Flags for Breaking Changes

If the RFC changes or removes existing public API behavior, it **must** ship behind a future flag which will start with an `unstable_` prefix.

**Future flag pattern:**

1. Add the flag to `FutureConfig` in `packages/react-router/lib/router/utils.ts`:

   ```ts
   export interface FutureConfig {
     // existing flags...
     unstable_myNewBehavior: boolean;
   }
   ```

2. Gate the new behavior on the flag:

   ```ts
   if (router.future.unstable_myNewBehavior) {
     // new behavior
   } else {
     // legacy behavior
   }
   ```

3. Document the flag in `docs/upgrading/future-flags.md` if it exists.

New additive APIs (no behavior change to existing code) do **not** need a future flag.

### 6. Key File Locations

| Area                  | Files                                        |
| --------------------- | -------------------------------------------- |
| Core router logic     | `packages/react-router/lib/router/router.ts` |
| Router types/utils    | `packages/react-router/lib/router/utils.ts`  |
| React components      | `packages/react-router/lib/components.tsx`   |
| React hooks           | `packages/react-router/lib/hooks.tsx`        |
| Public exports        | `packages/react-router/index.ts`             |
| DOM utilities         | `packages/react-router/lib/dom/`             |
| Framework/Vite plugin | `packages/react-router-dev/vite/plugin.ts`   |
| RSC runtime           | `packages/react-router/lib/rsc/`             |
| Unit tests            | `packages/react-router/__tests__/`           |
| Integration tests     | `integration/`                               |
| Future flags doc      | `docs/upgrading/future-flags.md`             |

Confirm existing patterns before writing new code - prefer using the LSP but `Grep`/`Glob` also work. Match naming conventions and code style exactly.

### 7. Implement the Feature

Follow the approved plan. For each logical unit of work:

1. Write the implementation
2. Export from the appropriate public entry point (`packages/react-router/index.ts`)
3. Add `@deprecated` JSDoc to any APIs being superseded
4. Run typecheck to catch type errors early:
   ```sh
   pnpm typecheck
   ```

Keep changes minimal and focused. Do not refactor unrelated code. Commit as often as needed.

### 8. Write Tests

**Unit tests** (for hooks, pure router logic, component behavior — no build):

- Location: `packages/react-router/__tests__/`
- Runner: Jest → `pnpm test packages/react-router/__tests__/<file>`
- Cover: happy path, edge cases identified in RFC/community feedback, future flag gating (if applicable), deprecation warnings

**Integration tests** (for Vite/Framework Mode, SSR, hydration):

- Location: `integration/`
- Runner: Playwright → `pnpm test:integration:run --project chromium integration/<file>`
- Required if the RFC touches Framework Mode, file-system routing, or SSR behavior

Run all tests and confirm they pass:

```sh
pnpm test packages/react-router/
pnpm test:integration:run --project chromium  # only if integration tests were added/changed
```

### 9. Lint and Typecheck

```sh
pnpm lint
pnpm typecheck
```

Fix all errors before proceeding.

### 10. Create a Change File

Create `packages/<package>/.changes/<bump-level>.<descriptive-name>.md`. Use the RFC title or tracking issue as the description:

```markdown
feat: <brief description matching the RFC title>

Implements the `useRouterState()` RFC (#12358). Deprecates `useLocation`,
`useParams`, `useSearchParams`, `useNavigation`, `useMatches`, `useMatch`,
`useNavigationType`, and `useViewTransitionState` in favor of a unified API.

Enable the `unstable_consolidatedRouterState` future flag to opt in.
```

Bump levels:

- `patch` — bug-adjacent fix only
- `minor` — new additive API (no breaking changes)
- `major` — breaking change (should be rare; most breaking changes go behind a future flag as `minor` first)
- `unstable` — new API that is not yet stable (e.g. added in a future flag, or an experimental API that may be removed without a major bump)

### 11. Report and Review

Summarize:

- What RFC was implemented and which decisions were made
- New public APIs added (with brief usage example)
- APIs deprecated and the migration path
- Future flag name (if applicable) and how to opt in
- Test coverage added
- Anything deferred or explicitly out of scope

Ask me to review and iterate before opening a PR.

### 12. Commit

Once I approve, commit and open a PR to `dev`:

```sh
gh pr create --base dev --title "feat: <RFC title>" --body "..."
```

PR body should include:

- Link to the RFC discussion (Closes or Implements #NNNN)
- Summary of what was implemented
- Future flag instructions if applicable
- Testing notes
- Any decisions that deviated from the original proposal and why
