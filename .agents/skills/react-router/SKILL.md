---
name: react-router
description: Build applications with React Router in Framework, Data, Declarative, and unstable RSC modes. Use when configuring routes, route modules, loaders, actions, forms, fetchers, navigation, pending UI, SSR/SPA/pre-rendering, middleware, URL params/search params, or React Router upgrades.
license: MIT
---

# React Router

React Router is a multi-strategy router for React. It can be used as a full framework, as a data-aware router, or as a simple declarative client router. Before changing an app, identify which mode it uses and read the docs for that mode.

## First: Identify the Mode

React Router guidance is mode-specific. Do not apply Framework/Data patterns to a Declarative app unless you are intentionally migrating modes.

### Framework Mode

Use Framework Mode guidance when you see:

- `@react-router/dev` in dependencies
- `react-router.config.ts`
- `app/routes.ts`
- route modules under `app/routes/`
- route exports like `loader`, `action`, `clientLoader`, `clientAction`, `ErrorBoundary`, `meta`, `links`, or `headers`
- imports from `./+types/...`
- the React Router Vite plugin from `@react-router/dev/vite`

Framework examples usually use the default `app/` directory, but check `react-router.config.ts` for a custom `appDirectory` before assuming exact paths.

Then read `references/framework-mode.md`.

### Data Mode

Use Data Mode guidance when you see:

- `createBrowserRouter`, `createHashRouter`, `createMemoryRouter`, or `createStaticRouter`
- `<RouterProvider router={router}>`
- route objects with properties like `path`, `children`, `loader`, `action`, `Component`, `ErrorBoundary`, or `lazy`
- data APIs without the Framework Vite plugin

Then read `references/data-mode.md`.

### Declarative Mode

Use Declarative Mode guidance when you see:

- `<BrowserRouter>`, `<HashRouter>`, or `<MemoryRouter>`
- `<Routes>` and `<Route>` JSX route configuration
- route components passed with `element={<Component />}`
- no data router, no route module convention, and no loaders/actions

Then read `references/declarative-mode.md`.

### RSC Framework and RSC Data Modes

React Server Components support is unstable and exists in both Framework and Data variants. Use RSC guidance when you see:

- `unstable_reactRouterRSC`
- `@vitejs/plugin-rsc`
- `unstable_RSCRouteConfig`
- RSC entry files such as `entry.rsc`
- `ServerComponent`, `ServerErrorBoundary`, `ServerLayout`, or `ServerHydrateFallback`
- React directives or boundary packages such as `"use client"`, `"server-only"`, or `"client-only"`

For RSC Framework, read both `references/framework-mode.md` and `references/rsc.md`.
For RSC Data, read both `references/data-mode.md` and `references/rsc.md`.

## Use the Installed Docs as the Source of Truth

React Router publishes a subset of the official markdown docs with the `react-router` package. Prefer these local docs because they match the installed package version.

The docs live under the installed package:

```txt
node_modules/react-router/dist/docs/
```

Resolve that directory through package exports when available so npm, pnpm, and symlinked workspace layouts do not matter:

```sh
node -p "require.resolve('react-router/docs')"
node -p "require.resolve('react-router/docs/start/modes.md')"
```

When this skill references `react-router/docs/...`, treat it as a package-doc specifier: resolve it through package exports when possible, or read the matching file under `node_modules/react-router/dist/docs/`.

If `react-router/docs` is not exported by the installed version, that package did not ship local markdown docs. In that case, use the repo `docs/` directory when working inside the React Router repository; in a consuming app, fall back to version-matched website docs.

### How the Docs Are Organized

The docs mirror the website content:

```txt
node_modules/react-router/dist/docs/index.md
node_modules/react-router/dist/docs/start/
node_modules/react-router/dist/docs/how-to/
node_modules/react-router/dist/docs/explanation/
node_modules/react-router/dist/docs/upgrading/
```

- `index.md` is the landing page.
- `start/modes.md` explains how to choose between Framework, Data, and Declarative modes.
- `start/<mode>/` contains introductory, mode-specific guides.
- `how-to/` contains task-oriented guides for implementation details.
- `explanation/` contains conceptual docs and tradeoffs.
- `upgrading/` contains migration and future-flag guidance.

Most docs include a mode marker near the top:

```txt
[MODES: framework, data, declarative]
```

Only apply a doc when its mode marker matches the app mode. If a task spans modes, prefer the section or file that matches the current app.

RSC is documented primarily in:

```txt
node_modules/react-router/dist/docs/how-to/react-server-components.md
```

## Critical Agent Rules

### Version and Mode First

- Check the installed version before using newer APIs:
  ```sh
  npm list react-router @react-router/dev
  ```
- Identify the mode before editing routes or data APIs.
- If the mode is ambiguous, inspect `package.json`, the top-level router setup, and route configuration before editing. Ask the user if the app appears to be mid-migration.
- If changing shared behavior, consider all five modes: Declarative, Data, Framework, RSC Data, and RSC Framework.

### Imports

- Match the app's existing import style.
- For new React Router v7+ code, prefer imports from `react-router`.
- Do not churn existing `react-router-dom` imports unless the user is intentionally migrating import paths.
- In Framework Mode, keep Framework tooling imports from `@react-router/dev/*` where the docs show them.

### Navigation

- Use `<Link>` or `<NavLink>` for user-initiated internal navigation.
- Use `useNavigate` for imperative navigation caused by client-side events.
- In Data/Framework modes, prefer `redirect` from loaders/actions when navigation is part of data loading or mutation.
- Do not use plain `<a href>` for internal routes unless intentionally forcing a document navigation.

### Forms, Mutations, and Fetchers

For Data and Framework modes:

- Use `<Form method="get">` for search/filter forms that update URL search params.
- Use `<Form method="post">` for mutations that should submit and navigate/revalidate the route.
- Use `useFetcher` / `<fetcher.Form>` for inline mutations that should not navigate, like favorites, ratings, toggles, and row-level actions.
- Use `fetcher.formData` or `navigation.formData` for optimistic UI.
- When unsure between `<Form>` and `useFetcher`, read `node_modules/react-router/dist/docs/explanation/form-vs-fetcher.md`.

### Data Loading

For Data and Framework modes:

- Prefer route loaders for route data instead of fetching route data in `useEffect`.
- Use actions for route mutations.
- Let React Router handle revalidation after actions unless there is a documented reason to customize `shouldRevalidate`.
- Use URL params/search params as the source of truth for URL state.

### URL Values

- URL params are strings and can be absent; validate/parse them before use.
- Preserve unrelated search params when updating query strings unless intentionally resetting them.
- Prefer URL state for shareable/bookmarkable filters, tabs, pagination, and search.

### Framework Route Modules

For Framework Mode:

- Use the Route Module API instead of inventing custom route conventions.
- Import generated route types from `./+types/<route>`.
- `meta` receives `loaderData`; do not use deprecated `data` args.
- Put global app shell UI, providers, and document structure in `app/root.tsx`.
- Use nested routes/layout routes for section-specific layouts.

### Declarative Mode Boundaries

For Declarative Mode:

- Use `<Routes>` and `<Route>` for routing.
- Use URL hooks like `useParams`, `useSearchParams`, `useLocation`, and `useNavigate`.
- Do not add loaders, actions, `<Form>`, or `useFetcher` unless migrating to Data or Framework Mode.

## Skill References

Load the relevant reference after identifying the mode:

| Reference                        | Use When                                      |
| -------------------------------- | --------------------------------------------- |
| `references/framework-mode.md`   | Framework Mode or RSC Framework base behavior |
| `references/data-mode.md`        | Data Mode or RSC Data base behavior           |
| `references/declarative-mode.md` | Declarative Mode                              |
| `references/rsc.md`              | Any unstable RSC app                          |
