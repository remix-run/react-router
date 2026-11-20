# React Server Components (RSC)

React Router's RSC support is unstable and exists in two variants:

- **RSC Framework Mode**: Framework Mode with the unstable RSC Vite plugin.
- **RSC Data Mode**: lower-level RSC runtime APIs and manual bundler/server integration.

Use this reference in addition to `framework-mode.md` or `data-mode.md` after the main skill identifies an RSC app.

## Read the Local RSC Docs

Start with:

```txt
react-router/docs/how-to/react-server-components.md
```

Then read the relevant base mode docs:

```txt
react-router/docs/start/framework/
react-router/docs/start/data/
```

RSC docs may describe differences from non-RSC mode rather than repeating every Framework/Data concept, so keep both layers in mind.

## Detect RSC Framework Mode

Look for:

- `unstable_reactRouterRSC` imported from `@react-router/dev/vite`
- `@vitejs/plugin-rsc`
- `vite.config.ts` with `plugins: [reactRouterRSC(), rsc()]`
- Framework route modules plus RSC route exports
- RSC entry files such as `entry.rsc`

RSC Framework Mode uses a different Vite plugin from non-RSC Framework Mode. Do not swap it for the regular `reactRouter()` plugin.

## Detect RSC Data Mode

Look for:

- `unstable_RSCRouteConfig`
- route config passed to lower-level RSC APIs
- APIs such as `unstable_matchRSCServerRequest`, `unstable_routeRSCServerRequest`, `unstable_RSCHydratedRouter`, or `unstable_RSCStaticRouter`
- custom bundler/server setup around RSC

RSC Data Mode is more manual than RSC Framework Mode. Match the app's bundler and server abstractions before changing routes or entries.

## RSC Route Module Differences

In RSC Framework Mode, many normal Framework Mode concepts still apply, but routes can use server component exports.

Important route-module concepts from the RSC docs include:

- `ServerComponent` instead of the usual client `default` component
- `ServerErrorBoundary` paired with `ErrorBoundary`
- `ServerLayout` paired with `Layout`
- `ServerHydrateFallback` paired with `HydrateFallback`
- server-rendered React elements returned from loaders/actions

A route module cannot export both the normal client component and its server component counterpart for the same role. Read the RSC docs before adding these exports.

## Client/Server Boundaries

RSC code must respect React's client/server split:

- Use `"use client"` for components that need hooks, browser APIs, or event handlers.
- Use server-only modules for server data access and secrets.
- In RSC Framework Mode, prefer the `server-only` and `client-only` boundary imports described in the docs.
- Do not assume `.server`/`.client` file naming works the same way in RSC Framework Mode; read the RSC docs before relying on those conventions.

## Data Loading in RSC

RSC changes where data can be loaded:

- Server Components can fetch data directly on the server.
- Loaders/actions may still exist and can have RSC-specific behavior.
- Client components still need client-safe data and cannot directly access server-only modules.

When choosing between a server component fetch, a loader, and a client loader/action, follow the RSC docs and match existing app patterns.

## Stability

RSC APIs are explicitly unstable. Before implementing or refactoring RSC code:

- Check the installed React Router version.
- Check the installed `@vitejs/plugin-rsc` version.
- Read the app's existing RSC entry/config files.
- Prefer minimal changes that match current patterns.
