# `@remix-run/router`

## 1.3.2

### Patch Changes

- Remove inaccurate console warning for POP navigations and update active blocker logic ([#10030](https://github.com/remix-run/react-router/pull/10030))
- Only check for differing origin on absolute URL redirects ([#10033](https://github.com/remix-run/react-router/pull/10033))

## 1.3.1

### Patch Changes

- Fixes 2 separate issues for revalidating fetcher `shouldRevalidate` calls ([#9948](https://github.com/remix-run/react-router/pull/9948))
  - The `shouldRevalidate` function was only being called for _explicit_ revalidation scenarios (after a mutation, manual `useRevalidator` call, or an `X-Remix-Revalidate` header used for cookie setting in Remix). It was not properly being called on _implicit_ revalidation scenarios that also apply to navigation `loader` revalidation, such as a change in search params or clicking a link for the page we're already on. It's now correctly called in those additional scenarios.
  - The parameters being passed were incorrect and inconsistent with one another since the `current*`/`next*` parameters reflected the static `fetcher.load` URL (and thus were identical). Instead, they should have reflected the the navigation that triggered the revalidation (as the `form*` parameters did). These parameters now correctly reflect the triggering navigation.
- Respect `preventScrollReset` on `<fetcher.Form>` ([#9963](https://github.com/remix-run/react-router/pull/9963))
- Do not short circuit on hash change only mutation submissions ([#9944](https://github.com/remix-run/react-router/pull/9944))
- Remove `instanceof` check from `isRouteErrorResponse` to avoid bundling issues on the server ([#9930](https://github.com/remix-run/react-router/pull/9930))
- Fix navigation for hash routers on manual URL changes ([#9980](https://github.com/remix-run/react-router/pull/9980))
- Detect when a `defer` call only contains critical data and remove the `AbortController` ([#9965](https://github.com/remix-run/react-router/pull/9965))
- Send the name as the value when url-encoding `File` `FormData` entries ([#9867](https://github.com/remix-run/react-router/pull/9867))

## 1.3.0

### Minor Changes

- Added support for navigation blocking APIs ([#9709](https://github.com/remix-run/react-router/pull/9709))
- Expose deferred information from `createStaticHandler` ([#9760](https://github.com/remix-run/react-router/pull/9760))

### Patch Changes

- Improved absolute redirect url detection in actions/loaders ([#9829](https://github.com/remix-run/react-router/pull/9829))
- Fix URL creation with memory histories ([#9814](https://github.com/remix-run/react-router/pull/9814))
- Fix `generatePath` when optional params are present ([#9764](https://github.com/remix-run/react-router/pull/9764))
- Fix scroll reset if a submission redirects ([#9886](https://github.com/remix-run/react-router/pull/9886))
- Fix 404 bug with same-origin absolute redirects ([#9913](https://github.com/remix-run/react-router/pull/9913))
- Support `OPTIONS` requests in `staticHandler.queryRoute` ([#9914](https://github.com/remix-run/react-router/pull/9914))

## 1.2.1

### Patch Changes

- Include submission info in `shouldRevalidate` on action redirects ([#9777](https://github.com/remix-run/react-router/pull/9777), [#9782](https://github.com/remix-run/react-router/pull/9782))
- Reset `actionData` on action redirect to current location ([#9772](https://github.com/remix-run/react-router/pull/9772))

## 1.2.0

### Minor Changes

- Remove `unstable_` prefix from `createStaticHandler`/`createStaticRouter`/`StaticRouterProvider` ([#9738](https://github.com/remix-run/react-router/pull/9738))

### Patch Changes

- Fix explicit `replace` on submissions and `PUSH` on submission to new paths ([#9734](https://github.com/remix-run/react-router/pull/9734))
- Fix a few bugs where loader/action data wasn't properly cleared on errors ([#9735](https://github.com/remix-run/react-router/pull/9735))
- Prevent `useLoaderData` usage in `errorElement` ([#9735](https://github.com/remix-run/react-router/pull/9735))
- Skip initial scroll restoration for SSR apps with `hydrationData` ([#9664](https://github.com/remix-run/react-router/pull/9664))

## 1.1.0

This release introduces support for [Optional Route Segments](https://github.com/remix-run/react-router/issues/9546). Now, adding a `?` to the end of any path segment will make that entire segment optional. This works for both static segments and dynamic parameters.

**Optional Params Examples**

- Path `lang?/about` will match:
  - `/:lang/about`
  - `/about`
- Path `/multistep/:widget1?/widget2?/widget3?` will match:
  - `/multistep`
  - `/multistep/:widget1`
  - `/multistep/:widget1/:widget2`
  - `/multistep/:widget1/:widget2/:widget3`

**Optional Static Segment Example**

- Path `/home?` will match:
  - `/`
  - `/home`
- Path `/fr?/about` will match:
  - `/about`
  - `/fr/about`

### Minor Changes

- Allows optional routes and optional static segments ([#9650](https://github.com/remix-run/react-router/pull/9650))

### Patch Changes

- Stop incorrectly matching on partial named parameters, i.e. `<Route path="prefix-:param">`, to align with how splat parameters work. If you were previously relying on this behavior then it's recommended to extract the static portion of the path at the `useParams` call site: ([#9506](https://github.com/remix-run/react-router/pull/9506))

```jsx
// Old behavior at URL /prefix-123
<Route path="prefix-:id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: '123' }
  let id = params.id; // "123"
  ...
}

// New behavior at URL /prefix-123
<Route path=":id" element={<Comp /> }>

function Comp() {
  let params = useParams(); // { id: 'prefix-123' }
  let id = params.id.replace(/^prefix-/, ''); // "123"
  ...
}
```

- Persist `headers` on `loader` `request`'s after SSR document `action` request ([#9721](https://github.com/remix-run/react-router/pull/9721))
- Fix requests sent to revalidating loaders so they reflect a GET request ([#9660](https://github.com/remix-run/react-router/pull/9660))
- Fix issue with deeply nested optional segments ([#9727](https://github.com/remix-run/react-router/pull/9727))
- GET forms now expose a submission on the loading navigation ([#9695](https://github.com/remix-run/react-router/pull/9695))
- Fix error boundary tracking for multiple errors bubbling to the same boundary ([#9702](https://github.com/remix-run/react-router/pull/9702))

## 1.0.5

### Patch Changes

- Fix requests sent to revalidating loaders so they reflect a `GET` request ([#9680](https://github.com/remix-run/react-router/pull/9680))
- Remove `instanceof Response` checks in favor of `isResponse` ([#9690](https://github.com/remix-run/react-router/pull/9690))
- Fix `URL` creation in Cloudflare Pages or other non-browser-environments ([#9682](https://github.com/remix-run/react-router/pull/9682), [#9689](https://github.com/remix-run/react-router/pull/9689))
- Add `requestContext` support to static handler `query`/`queryRoute` ([#9696](https://github.com/remix-run/react-router/pull/9696))
  - Note that the unstable API of `queryRoute(path, routeId)` has been changed to `queryRoute(path, { routeId, requestContext })`

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

[rr-docs]: https://reactrouter.com
[rr-feature-overview]: https://reactrouter.com/start/overview
[rr-tutorial]: https://reactrouter.com/start/tutorial
[remix-router-readme]: https://github.com/remix-run/react-router/blob/main/packages/router/README.md
