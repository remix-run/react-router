---
name: react-router
description: Build applications with React Router in Framework, Data, Declarative, and unstable RSC modes. Use when configuring routes, route modules, loaders, actions, forms, fetchers, navigation, pending UI, SSR/SPA/pre-rendering, middleware, URL params/search params, or React Router upgrades.
license: MIT
---

# React Router

React Router is mode-specific. Before changing an app, identify the mode, load the matching reference, then read the installed docs for the installed package version.

## Identify the Mode

Do not apply Framework/Data patterns to a Declarative app unless you are intentionally migrating modes.

### Framework Mode

Use Framework Mode guidance when you see:

- `@react-router/dev` in dependencies
- `react-router.config.ts`
- `app/routes.ts`
- `app/entry.server.tsx` and/or `app/entry.client.tsx` files
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

## Use Installed Docs as Source of Truth

React Router ships markdown docs in the package so guidance can match the installed version:

```txt
node_modules/react-router/docs/
```

Key docs paths:

```txt
node_modules/react-router/docs/index.md
node_modules/react-router/docs/start/
node_modules/react-router/docs/how-to/
node_modules/react-router/docs/explanation/
node_modules/react-router/docs/upgrading/
```

When this skill references `react-router/docs/...`, read the matching file under `node_modules/react-router/docs/`. If the installed version does not include local docs, use the repo `docs/` directory when working inside the React Router repository; in a consuming app, fall back to version-matched website docs.

Most docs include a mode marker near the top:

```txt
[MODES: framework, data, declarative]
```

Only apply a doc when its mode marker matches the app mode. If a task spans modes, prefer the section or file that matches the current app.

RSC is documented primarily in:

```txt
node_modules/react-router/docs/how-to/react-server-components.md
```

## Skill References

Load the relevant reference after identifying the mode:

| Reference                        | Use When                                      |
| -------------------------------- | --------------------------------------------- |
| `references/framework-mode.md`   | Framework Mode or RSC Framework base behavior |
| `references/data-mode.md`        | Data Mode or RSC Data base behavior           |
| `references/declarative-mode.md` | Declarative Mode                              |
| `references/rsc.md`              | Any unstable RSC app                          |

## Mode Migration Doc Index

If the user explicitly asks to switch modes, read the target mode reference plus the migration-relevant docs:

| Migration                            | Docs to read                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Declarative → Data                   | `react-router/docs/start/modes.md`, `react-router/docs/start/data/routing.md`, `react-router/docs/start/data/data-loading.md`, `react-router/docs/start/data/actions.md`                                                              |
| Declarative/Data → Framework         | `react-router/docs/start/modes.md`, `react-router/docs/start/framework/routing.md`, `react-router/docs/start/framework/route-module.md`, `react-router/docs/how-to/route-module-type-safety.md`                                       |
| Framework SPA/SSR/pre-render changes | `react-router/docs/start/framework/rendering.md`, `react-router/docs/how-to/spa.md`, `react-router/docs/how-to/pre-rendering.md`, `react-router/docs/start/framework/data-loading.md`, `react-router/docs/start/framework/actions.md` |
| Future flags/upgrades                | `react-router/docs/upgrading/future.md` and relevant files under `react-router/docs/upgrading/`                                                                                                                                       |
