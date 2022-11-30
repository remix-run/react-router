# `@remix-run/router`

## 1.0.4

### Patch Changes

- Throw an error if an `action`/`loader` function returns `undefined` as revalidations need to know whether the loader has previously been executed. `undefined` also causes issues during SSR stringification for hydration. You should always ensure you `loader`/`action` returns a value, and you may return `null` if you don't wish to return anything. ([#9511](https://github.com/remix-run/react-router/pull/9511))
- Properly handle redirects to external domains ([#9590](https://github.com/remix-run/react-router/pull/9590), [#9654](https://github.com/remix-run/react-router/pull/9654))
- Preserve the HTTP method on 307/308 redirects ([#9597](https://github.com/remix-run/react-router/pull/9597))
- Support `basename` in static data routers ([#9591](https://github.com/remix-run/react-router/pull/9591))
- Enhanced `ErrorResponse` bodies to contain more descriptive text in internal 403/404/405 scenarios

## 1.0.3

### Patch Changes

- Fix hrefs generated when using `createHashRouter` ([#9409](https://github.com/remix-run/react-router/pull/9409))
- fix encoding/matching issues with special chars ([#9477](https://github.com/remix-run/react-router/pull/9477), [#9496](https://github.com/remix-run/react-router/pull/9496))
- Support `basename` and relative routing in `loader`/`action` redirects ([#9447](https://github.com/remix-run/react-router/pull/9447))
- Ignore pathless layout routes when looking for proper submission `action` function ([#9455](https://github.com/remix-run/react-router/pull/9455))
- properly support `index` routes with a `path` in `useResolvedPath` ([#9486](https://github.com/remix-run/react-router/pull/9486))
- Add UMD build for `@remix-run/router` ([#9446](https://github.com/remix-run/react-router/pull/9446))
- fix `createURL` in local file execution in Firefox ([#9464](https://github.com/remix-run/react-router/pull/9464))
- Updates to `unstable_createStaticHandler` for incorporating into Remix ([#9482](https://github.com/remix-run/react-router/pull/9482), [#9465](https://github.com/remix-run/react-router/pull/9465))

## 1.0.2

### Patch Changes

- Reset `actionData` after a successful action redirect ([#9334](https://github.com/remix-run/react-router/pull/9334))
- Update `matchPath` to avoid false positives on dash-separated segments ([#9300](https://github.com/remix-run/react-router/pull/9300))
- If an index route has children, it will result in a runtime error. We have strengthened our `RouteObject`/`RouteProps` types to surface the error in TypeScript. ([#9366](https://github.com/remix-run/react-router/pull/9366))

## 1.0.1

### Patch Changes

- Preserve state from `initialEntries` ([#9288](https://github.com/remix-run/react-router/pull/9288))
- Preserve `?index` for fetcher get submissions to index routes ([#9312](https://github.com/remix-run/react-router/pull/9312))

## 1.0.0

This is the first stable release of `@remix-run/router`, which provides all the underlying routing and data loading/mutation logic for `react-router`. You should _not_ be using this package directly unless you are authoring a routing library similar to `react-router`.

For an overview of the features provided by `react-router`, we recommend you go check out the [docs][rr-docs], especially the [feature overview][rr-feature-overview] and the [tutorial][rr-tutorial].

For an overview of the features provided by `@remix-run/router`, please check out the [`README`][remix-router-readme].

[rr-docs]: https://reactrouter.com/
[rr-feature-overview]: https://reactrouter.com/en/6.4.0/start/overview
[rr-tutorial]: https://reactrouter.com/en/6.4.0/start/tutorial
[remix-router-readme]: https://github.com/remix-run/react-router/blob/main/packages/router/README.md
