---
name: prepare-release-notes
description: Prepare React Router release notes before running the changes/versioning scripts. Use when asked to review, polish, normalize, or prepare pending change files under packages/*/.changes, remove semantic commit prefixes from release bullets, enforce imperative tense, decide whether a manual scripts/changes/whats-changed.md section is warranted, or draft long-form release notes for new features, stable future flags, or unstable flags.
---

# Prepare Release Notes

Polish pending React Router change files and add manual release notes only when the release needs narrative context beyond the generated change lists.

## Workflow

1. Inspect local state:

```sh
git status --short
find packages -path '*/.changes/*.md' -not -name README.md -not -name .gitkeep -print | sort
```

2. Read every pending change file. Do not edit generated changelogs or released notes directly.

3. Normalize each change file:
   - Remove `feat:`, `feat(...)`, `fix:`, and `fix(...)` semantic-commit prefixes from prose
   - Use present or imperative tense for the first line and top-level release bullets: prefer `Add`, `Fix`, `Remove`, `Support`, `Stabilize`, `Preserve`, `Update`, `Avoid`, `Prevent`, `Throw`, `Warn`, `Expose`
   - Nested detail bullets can stay explanatory when they expand on the parent bullet; do not rewrite them solely to force present or imperative tense
   - Remove terminal sentence periods from bullet items because release generation appends PR/commit links after the first bullet line
   - Remove terminal sentence periods from nested bullet items too, unless the punctuation is part of code, a URL, an abbreviation, a version number, or another token where removing it would be wrong
   - If one bullet contains multiple sentences, split it into a shorter parent bullet plus nested bullet items
   - Keep the first line concise and user-facing; use nested bullets for details or migration notes

4. Review whether `scripts/changes/whats-changed.md` is needed:
   - Read `CHANGELOG.md` examples or `references/whats-changed.md` when uncertain
   - Add `scripts/changes/whats-changed.md` only for features, future flag stabilizations, unstable flags, migration guidance, breaking bug fixes, or complex behavior that needs long-form text or examples
   - Do not add it for ordinary bug fixes, dependency cleanup, internal refactors, or release bullets that are already clear
   - If adding it, write the body only; the release script adds `### What's Changed` when missing

5. Validate:

```sh
pnpm changes:validate
pnpm changes:preview
```

Use `changes:preview` to inspect the generated root release notes and confirm the PR/commit link placement, section ordering, and any manual What's Changed placement. If dependencies are missing or the command is too expensive for the context, state what was skipped.

## Change File Style

Single-line entries should read well with an auto-appended PR link:

```markdown
Fix `href()` to stringify and URL-encode param values like `generatePath()`
```

Use nested bullets for additional sentences:

```markdown
Fix route ranking for dynamic parameters with static extension suffixes

- Identify `/:name.xml` as a dynamic segment instead of a static segment
- Preserve static route priority for paths like `/sitemap.xml`
```

Avoid semantic commit prefixes:

```markdown
Add support for nub as a package manager
```

not:

```markdown
feat: add support for nub as a package manager.
```

## What's Changed Guidance

Use `scripts/changes/whats-changed.md` for release-level narrative, not package-specific bullets. Good candidates include:

- A new user-facing API or feature that benefits from example code
- Stabilization or renaming of unstable APIs/flags, especially when adopters must migrate
- A stable future flag that changes behavior and needs adoption guidance
- A breaking bug fix or adapter/runtime behavior change that may require deployment checks
- A cluster of related changes whose combined effect matters more than the individual bullet list

Keep the tone direct and practical. Prefer headings under the generated `### What's Changed` section:

````markdown
#### Feature Name

Explain what changed, who it affects, and how to adopt it.

```ts
// Optional short example
```
````

Do not duplicate every bullet from Minor/Patch/Unstable Changes. Let generated change files carry ordinary PR-level details.

See `references/whats-changed.md` for examples distilled from the existing changelog.
