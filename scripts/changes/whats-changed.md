### What's Changed

React Router v8 is here!

We introduced a new [Open Governance](https://remix.run/blog/rr-governance) model last year and this marks the first major release on our new planned yearly major release cadence. We chose the June timeframe this year to align with the EOL timeframe for Node 20. Node 22 is [scheduled](https://nodejs.org/en/about/previous-releases) to reach EOL in the May 2027 timeframe so we'll be aiming for a v9 release around the same time next year.

Our [API Development Strategy](https://reactrouter.com/community/api-development-strategy) aims to make major releases relatively boring by introducing breaking changes ahead of time behind [Future flags](https://reactrouter.com/v7/upgrading/future). If you've adopted all active future flags in v7, then from a React Router API surface you're in good shape for v8. All `future.v8_*` flags have been removed (or lifted to a top-level config) and their behaviors are now the default.

#### Baseline Support

React Router v8 updates the following minimum supported versions:

- Node 22.22.0+
  - Starting with v8, React Router will officially support all Active LTS node versions and only the **latest** minor branch of Maintenance LTS versions
  - This better allows us to bump minimum Maintenance LTS versions to account for newly released security patches
  - It also allows us to more quickly and easily adopt new Active LTS features backported to Maintenance LTS lines
  - Upgraded minimum Maintenance LTS versions will be done in React Router minor releases
- React 19.2.7+
- Vite 7+

To modernize the library, React Router is now published as an ESM-only module and tsconfig `target`/`lib` fields have been updated to ES2022 across the board

#### Adopted Future Flag Behavior

The following v8 future flags have been removed and their behaviors are now the default:

- `future.v8_trailingSlashAwareDataRequests`
- `future.v8_passThroughRequests`
- `future.v8_middleware`
- `future.v8_viteEnvironmentApi`
- `future.v8_splitRouteModules` has been moved to a to a top-level `splitRouteModules` config option and is enabled by default

#### Removed `react-router-dom`

In v7, we collapsed the DOM APIs into `react-router/dom`, but to ease the v6->v7 upgrade we continued re-exporting everything through `react-router-dom`. We have now dropped `react-router-dom`, so if you didn't get around to swapping your imports in v7, you will need to swap them to `react-router` and `react-router/dom` for v8.

#### Removed deprecated `meta` `data` fields

The `data` fields passed to route module `meta` functions were deprecated in v7 and are remove din v8. Use `loaderData` instead of `data` on `MetaArgs` and each item in `MetaArgs.matches`.

#### Cloudflare Vite Plugin

The React Router Cloudflare dev proxy (`@react-router/dev/vite/cloudflare`) has been removed in v8. Cloudflare projects should use [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/) instead.

#### `@react-router/architect` `useRequestContextDomainName`

The `@react-router/architect` `createRequestHandler` `useRequestContextDomainName` option has been removed as that is now the default behavior in v8.
