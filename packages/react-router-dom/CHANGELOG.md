# react-router-dom

## 6.4.0-pre.14

### Patch Changes

- fix: rename resetScroll -> preventScrollReset (#9199)
- Updated dependencies
  - react-router@6.4.0-pre.14

## 6.4.0-pre.13

### Patch Changes

- fix: pass `useMatches` objects to `ScrollRestoration` `getKey` (#9157)
- feat: add `relative=path` option for url-relative routing (#9160)

  Adds a `relative=path` option to navigation aspects to allow users to opt-into paths behaving relative to the current URL instead of the current route hierarchy. This is useful if you're sharing route patterns in a non-nested structure for UI reasons:

  ```jsx
  // Contact and EditContact do not share UI layout
  <Route path="contacts/:id" element={<Contact />} />
  <Route path="contacts:id/edit" element={<EditContact />} />

  function EditContact() {
    return <Link to=".." relative="path">Cancel</Link>
  }
  ```

  Without this, the user would need to reconstruct the `contacts/:id` url using `useParams` and either hardcoding the `/contacts` prefix or parsing it from `useLocation`.

  This applies to all path-related hooks and components:

  - `react-router`: `useHref`, `useResolvedPath`, `useNavigate`, `Navigate`
  - `react-router-dom`: `useLinkClickHandler`, `useFormAction`, `useSubmit`, `Link`, `Form`
  - `react-router-native`: `useLinkPressHandler`, `Link`

- fix: `useFormAction` should not include pathless splat portion (#9144)
- Updated dependencies
  - react-router@6.4.0-pre.13

## 6.4.0-pre.12

### Patch Changes

- fix: do not overwrite input value from button with same name (#9139)
- fix: unspecified `<Form>` action should preserve search params (#9060)
- Updated dependencies
  - react-router@6.4.0-pre.12

## 6.4.0-pre.11

### Patch Changes

- Updated dependencies [c3406eb9]
  - react-router@6.4.0-pre.11

## 6.4.0-pre.10

### Patch Changes

- SSR Updates for React Router (#9058)

  _Note: The Data-Router SSR aspects of `@remix-run/router` and `react-router-dom` are being released as **unstable** in this release (`unstable_createStaticHandler` and `unstable_DataStaticRouter`), and we plan to finalize them in a subsequent minor release once the kinks can be worked out with the Remix integration. To that end, they are available for use, but are subject to breaking changes in the next minor release._

  - Remove `useRenderDataRouter()` in favor of `<DataRouterProvider>`/`<DataRouter>`
  - Support automatic hydration in `<DataStaticRouter>`/`<DataBrowserRouter>`/`<DataHashRouter>`
    - Uses `window.__staticRouterHydrationData`
    - Can be disabled on the server via `<DataStaticRouter hydrate={false}>`
    - Can be disabled (or overridden) in the browser by passing `hydrationData` to `<DataBrowserRouter>`/`<DataHashRouter>`
  - `<DataStaticRouter>` now tracks it's own SSR error boundaries on `StaticHandlerContext`
  - `StaticHandlerContext` now exposes `statusCode`/`loaderHeaders`/`actionHeaders`
  - `foundMissingHydrationData` check removed since Remix routes may have loaders (for modules) that don't return data for `loaderData`

- Updated dependencies
  - react-router@6.4.0-pre.10

## 6.4.0-pre.9

### Patch Changes

- feat: add basename support for data routers (#9026)
- Updated dependencies
  - react-router@6.4.0-pre.9

## 6.4.0-pre.8

### Patch Changes

- fix: Make path resolution trailing slash agnostic (#8861)
- fix: export ActionFunctionArgs/LoaderFunctionArgs up through router packages (#8975)
- Updated dependencies
  - react-router@6.4.0-pre.8

## 6.4.0-pre.7

### Patch Changes

- Respect the `<Link replace>` prop if it is defined (#8779)
- Updated dependencies
  - `react-router@6.4.0-pre.7`

## 6.4.0-pre.6

### Patch Changes

- Updated dependencies
  - `react-router@6.4.0-pre.6`

## 6.4.0-pre.5

### Patch Changes

- Fix broken require for CJS builds
- Updated dependencies
  - `react-router@6.4.0-pre.5`

## 6.4.0-pre.4

### Patch Changes

- Fix missing `dist` files

## 6.4.0-pre.3

### Patch Changes

- Make `fallbackElement` optional and change type to `ReactNode` (type changes only) (#8896)
- Properly trigger error boundaries on 404 routes
