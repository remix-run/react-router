# Agent Skills Consolidation — Working Notes

Working memory for moving React Router's agent skills into this repo and
reshaping them. Update as decisions get made. This is a scratch/planning doc,
not a formal ADR (those live in `decisions/`).

Reference discussion: https://github.com/remix-run/react-router/discussions/15099

## Background / Decisions already locked in (from #15099)

- ✅ Move `remix-run/agent-skills` into `remix-run/react-router` and archive the
  standalone repo.
- ✅ Add a step in the CLI (`create-react-router`) to include skills, defaulting
  to "yes".
- ✅ Publish a subset of `docs/` to `node_modules` so agents can read official
  docs locally. The published subset excludes things like `api/` (just repeats
  JSDoc) and `community/`.
- ✅ Update the skills to point agents at the `node_modules` docs when they need
  more detail — same model as the `remix` skill, which points at
  `node_modules/remix/src/<subpath>/README.md`.
- Skills are versioned with the branch that owns them (e.g. v7 guidance on a
  `v7` branch, `main` evolves with the current major).

## Done so far

- Copied the three upstream skills into `.agents/skills/`:
  - `react-router-framework-mode/` (SKILL.md + 11 references)
  - `react-router-data-mode/` (SKILL.md + 7 references)
  - `react-router-declarative-mode/` (SKILL.md + 3 references)

## Target shape: collapse to a single `react-router` skill

```
.agents/skills/react-router/
├── SKILL.md                  # what RR is, the modes, how to pick, cross-cutting
│                             # agent-specific rules, where to find deeper docs
└── references/
    ├── framework-mode.md     # thin overview → points to published docs
    ├── data-mode.md          # thin overview → points to published docs
    └── declarative-mode.md   # thin overview → points to published docs
```

- SKILL.md absorbs the mode-picker content. Good source: `docs/start/modes.md`
  (includes the API/mode availability table that's annotated "mostly for the
  LLMs").
- Each `references/<mode>.md` is a thin orientation layer that points into the
  published docs rather than re-documenting routing/actions/loaders inline.
- The skills stay thin; depth comes from the docs in `node_modules`.

## Open decisions

1. **Sequencing of docs-in-node_modules vs. the skill rewrite.**
   - The `react-router` package currently only ships `dist/`, `CHANGELOG`,
     `LICENSE`, `README`. So there is no `node_modules` doc target yet.
   - Decision: **do the docs-publishing work FIRST** (separate branch off main),
     then rewrite the skill to point at it. (This is the work being started now.)

2. **Path convention for docs in node_modules.**
   - Remix uses `node_modules/remix/src/<subpath>/README.md`.
   - Proposed for us: ship the docs subset under `node_modules/react-router/docs/...`
     mirroring the repo's `docs/` tree. CONFIRM the exact path once the
     publishing approach is implemented so the skill can hardcode pointers.

3. **Which `docs/` subdirectories to publish vs. ignore.**
   - Ignore: `api/` (repeats JSDoc), `community/`.
   - Evaluate also ignoring: `tutorials/`, `upgrading/` — TBD (see publishing
     work). Keep: `start/`, `how-to/`, `explanation/` at minimum.

4. **Fate of the existing rich per-topic references** (`routing.md`,
   `actions.md`, `data-loading.md`, etc. — 21 files across the 3 skills).
   - Thin-skill vision implies we don't carry these forward verbatim.
   - But some content is agent-specific guidance NOT present in `docs/` (the
     ❌/✅ anti-patterns, "use `useFetcher` not `<Form>`", `meta` uses
     `loaderData` not `data`, etc.).
   - Proposed: fold the most critical agent-specific rules into SKILL.md and drop
     the per-topic reference files, relying on published docs for depth.

5. **CLI integration** (`create-react-router --with-agent-skills`, default yes) —
   separate follow-up after the skill shape settles.

## Current branch plan

- `agent-skills-consolidation`: holds the copied skills + this notes doc.
- New branch off `main`: docs-in-node_modules publishing work (open decision #1)
  — started next.
