# Agent Skills Consolidation — Working Notes

Working memory for moving React Router's agent skills into this repo and reshaping them. This is a scratch/planning doc, not a formal ADR (those live in `decisions/`).

Reference discussion: https://github.com/remix-run/react-router/discussions/15099

## Background / Decisions already locked in (from #15099)

- ✅ Move `remix-run/agent-skills` into `remix-run/react-router` and archive the standalone repo.
- ✅ Add a step in the CLI (`create-react-router`) to include skills, defaulting to "yes".
- ✅ Publish a subset of `docs/` to `node_modules` so agents can read official docs locally.
- ✅ Update the skills to point agents at the `node_modules` docs when they need more detail — same model as the `remix` skill, which points at package-local docs.
- Skills are versioned with the branch that owns them (e.g. v7 guidance on a `v7` branch, `main` evolves with the current major).

## Docs-in-package decision

Docs publishing work is in PR #15121.

The package docs are generated into:

```txt
node_modules/react-router/dist/docs/
```

They are also exposed through package export subpaths:

```txt
react-router/docs
react-router/docs/*
```

Agents should prefer resolving docs through package exports, e.g.:

```sh
node -p "require.resolve('react-router/docs/start/modes.md')"
```

Published docs currently include:

- `start/`
- `how-to/`
- `explanation/`
- `upgrading/`

Published docs currently exclude:

- `api/`
- `community/`
- `tutorials/`
- top-level docs/tooling files that are not useful as local reference material

## Current shape

The three upstream skills were consolidated into one skill:

```txt
.agents/skills/react-router/
├── SKILL.md
└── references/
    ├── declarative-mode.md
    ├── data-mode.md
    ├── framework-mode.md
    └── rsc.md
```

The single skill is intentionally thin. It acts as:

1. a mode detector,
2. a guide for locating installed docs,
3. a docs-structure explainer,
4. a place for agent-specific guardrails and anti-patterns.

Depth should come from the installed docs in `react-router/dist/docs`, not from duplicated long-form reference files in the skill.

## Important skill behavior

- Always identify the React Router mode before making changes.
- Treat RSC Framework and RSC Data as unstable variants that layer on top of Framework/Data guidance.
- Explain how docs are organized instead of maintaining a giant file-by-file mapping.
- Tell agents to respect `[MODES: ...]` markers in docs before applying guidance.
- Keep only high-value agent-specific rules inline, such as:
  - use `<Form method="get">` for search forms in Data/Framework modes,
  - use `useFetcher` for inline no-navigation mutations,
  - use loaders/actions for route data/mutations in Data/Framework modes,
  - use `loaderData` in Framework `meta`,
  - avoid adding Data/Framework APIs to Declarative apps unless migrating modes.

## Remaining work

1. Wait for or coordinate with the docs-in-package PR (#15121), since the skill now points at package-local docs.
2. Add CLI integration in `create-react-router` to include the consolidated skill, defaulting to yes.
3. Decide exactly where generated app templates should place copied skills for the supported agent formats.
4. After CLI integration, remove this scratch file or replace it with durable docs if useful.
