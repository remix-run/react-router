# React Router Development Guide

## Commands

- **Build**: `pnpm build` (all packages) or `pnpm run --filter <package> build` (single package)
- **Test**: `pnpm test` (unit tests, all packages) or `pnpm test packages/<package>/` (single package)
- **Integration tests**: `pnpm test:integration` (build + test) or `pnpm test:integration:run` (test only)
- **Typecheck**: `pnpm run typecheck`
- **Lint**: `pnpm run lint`
- **Docs generation**: `pnpm docs` (regenerates API docs from JSDoc)
- **Type generation**: `pnpm run typegen` (Framework Mode only)
- **Clean**: `pnpm run clean` (git clean -fdX)

## Modes

**Five distinct modes**: Declarative, Data, Framework, RSC Data (unstable), RSC Framework (unstable). **Always identify which mode(s) a feature applies to.**

1. **Declarative**: `<BrowserRouter>`, `<Routes>`, `<Route>`
2. **Data**: `createBrowserRouter()` with `loader`/`action`
3. **Framework**: Vite plugin + `routes.ts` + Route Module API (route exports like `loader`, `action`, `default`) + type generation + SSR/SPA
4. **RSC Data** (unstable): RSC runtime APIs, manual bundler setup, runtime route config
5. **RSC Framework** (unstable): Framework Mode with `unstable_reactRouterRSC` Vite plugin

**RSC mode differences:**

- **RSC Framework**: `unstable_reactRouterRSC` plugin, `@vitejs/plugin-rsc`, different entry points/format
- **RSC Data**: Manual bundler, runtime route config typically in `src/routes.ts`, `unstable_RSCRouteConfig`, different runtime APIs, `setupRscTest` in `integration/rsc/`, tests Vite + Parcel

## Architecture

- **Monorepo**: pnpm workspace, packages in `packages/`
- **Key packages**:
  - `react-router`: Core (all modes) - `lib/components.tsx`, `lib/hooks.tsx`, `lib/router/`, `lib/dom/`, `lib/rsc/`
  - `@react-router/dev`: Framework tooling - `vite/plugin.ts` (Framework), `vite/rsc/plugin.ts` (RSC Framework), `typegen/`
  - `react-router-dom`: Re-exports `react-router` (v6→v7 compat)
  - `@react-router/node`, `@react-router/cloudflare`, `@react-router/express`: Server adapters
  - `@react-router/serve`: Minimal server for Framework Mode
  - `@react-router/fs-routes`: File-system routing (`flatRoutes()`)

## Testing

### Unit Tests (`packages/react-router/__tests__/`)

Use Jest for pure routing logic, pure server runtime behavior, router state, React component behavior. No build required.

```bash
pnpm test                                                          # All packages
pnpm test packages/react-router/                                   # Single package
pnpm test packages/react-router/__tests__/router/fetchers-test.ts # Single test file
pnpm test -- -t "fetcher"                                          # Tests matching name
```

### Integration Tests (`integration/`)

Use Playwright for Vite plugin, build pipeline, SSR/hydration, RSC, type generation.

```bash
pnpm test:integration                                              # Build + run
pnpm test:integration:run                                          # Run (no build)
pnpm test:integration:run --project=chromium                       # Single browser (local dev)
pnpm test:integration:run --project=chromium integration/middleware-test.ts  # Single test
```

**Rebuild when**: First run, after changing `packages/` (not needed for test-only changes)

**Organization**: Use `createFixture()` → `createAppFixture()` → `PlaywrightFixture`. Templates available: `vite-6-template/`, `rsc-vite-framework/`, etc. Test all applicable modes (iterate over template array when behavior should work across modes). Test both states when introducing future flags (one test with flag on, one with flag off).

**RSC testing**:

- **RSC Framework**: Use `createFixture` with `rsc-vite-framework/` template
- **RSC Data**: Use `setupRscTest` in `integration/rsc/`, tests Vite + Parcel

Test shared behavior across multiple templates (e.g., `["vite-5-template", "rsc-vite-framework"]`). Test RSC-specific features against RSC template.

## routes.ts

Framework Mode uses `routes.ts` in `app/`. Most tests use `flatRoutes()` for file-system routing:

```ts
// app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes() satisfies RouteConfig;
```

**File-system conventions** (`app/routes/`):

- `_index.tsx` → `/` (index route)
- `about.tsx` → `/about`
- `blog.$slug.tsx` → `/blog/:slug` (URL param)
- `settings.profile.tsx` → `/settings/profile` (`.` creates nesting)
- `_layout.tsx` → pathless layout route

**Manual config alternative**:

```ts
import { index, route, layout } from "@react-router/dev/routes";
export default [
  index("./home.tsx"),
  route("about", "./about.tsx"),
  layout("./auth-layout.tsx", [route("login", "./login.tsx")]),
];
```

## Documentation

**Don't edit generated files**: `docs/api/` (from JSDoc), `.react-router/types/` (from typegen)

**Mode indicators**: Every doc needs `[MODES: framework, data, declarative]`

**API docs**: Edit JSDoc in `packages/react-router/lib/`, run `pnpm docs`

**Unstable features**: Prefix `unstable_`, add `unstable: true` to frontmatter, include warning block

## Future Flags

- **Future flags** (`vX_*`): Stable breaking changes for next major
- **Unstable flags** (`unstable_*`): Experimental, may change

Test both states (on/off) for future flags. Don't break existing behavior without a flag.

## Changesets

When making changes that affect users, create a changeset at `.changeset/<unique-meaningful-name>.md`. If iterating on a change that hasn't shipped yet, update the existing changeset file instead of creating a new one.

Format:

```markdown
---
"react-router": patch
"@react-router/dev": minor
---

Brief description of the change

- Additional details if needed
```

## Branching

- **`main`**: Latest stable release
- **`dev`**: Active development (branch from here for code changes)
- **`v6`**: v6.x maintenance
- Branch from `main` for docs-only changes

## Key Files

| Purpose           | Location                                                    |
| ----------------- | ----------------------------------------------------------- |
| Router            | `packages/react-router/lib/router/router.ts`                |
| React API         | `packages/react-router/lib/components.tsx`, `lib/hooks.tsx` |
| Vite plugin       | `packages/react-router-dev/vite/plugin.ts`                  |
| RSC Vite plugin   | `packages/react-router-dev/vite/rsc/plugin.ts`              |
| Type generation   | `packages/react-router-dev/typegen/`                        |
| Unit tests        | `packages/react-router/__tests__/`                          |
| Integration tests | `integration/`                                              |
| Decision docs     | `decisions/`                                                |
