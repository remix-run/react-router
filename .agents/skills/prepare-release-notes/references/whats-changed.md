# What's Changed Reference

Load this when deciding whether a React Router release needs `scripts/changes/whats-changed.md`.

## Include A Manual Section For

- Major releases with baseline changes, removed packages, removed deprecated APIs, new runtime requirements, or migration guidance
- Stabilizations and flag renames where adopters of unstable APIs need explicit before/after guidance
- New APIs or flags that deserve a narrative introduction or usage example
- Cross-cutting performance or behavior work where several bullets form one user-facing story
- Breaking bug fixes, deployment-sensitive fixes, or adapter/runtime behavior changes where users may need to test or update config

## Usually Do Not Include One For

- Straightforward bug fixes
- Dependency removals or upgrades where the bullet is sufficient
- Internal refactors with no public API change
- A minor feature that is fully understandable from one concise bullet and nested detail bullets
- Releases where the only content is a normal patch list

## Existing Changelog Patterns

- `v8.1.0`: Uses headings for agent skill installation and observability metadata, including an instrumentation code example. The generated minor bullets still carry the per-package details.
- `v8.0.0`: Uses long-form migration notes for a major release: baseline support, adopted future flags, removed packages/APIs, and behavior changes.
- `v7.18.0`: Explains a CSRF check fix that may be a breaking bug fix for reverse-proxy deployments and tells users what to test.
- `v7.15.0`: Groups several unstable-to-stable API renames and route matching optimizations into narrative sections before listing individual minor bullets.
- `v7.15.1`: Uses a "What's New" style section for an unstable hook with a code example. For new release notes, prefer the current `What's Changed` file path; the generated heading will be `### What's Changed`.

## Drafting Tips

- Use `####` headings inside `scripts/changes/whats-changed.md`; the release script wraps the file in `### What's Changed` if needed
- Mention applicable React Router modes when the distinction matters: Declarative, Data, Framework, RSC Data, or RSC Framework
- Keep examples short and directly tied to adoption
- Avoid repeating the package prefix and PR-link details already provided by generated change sections
- If unsure, run `pnpm changes:preview` with and without the manual section and keep it only if the generated notes are meaningfully clearer with the narrative
