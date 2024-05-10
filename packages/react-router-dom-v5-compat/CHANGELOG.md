# `react-router-dom-v5-compat`

## 6.23.1

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.16.1`
  - `react-router-dom@6.23.1`
  - `react-router@6.23.1`

## 6.23.0

### Minor Changes

- Add a new `unstable_dataStrategy` configuration option ([#11098](https://github.com/remix-run/react-router/pull/11098))
  - This option allows Data Router applications to take control over the approach for executing route loaders and actions
  - The default implementation is today's behavior, to fetch all loaders in parallel, but this option allows users to implement more advanced data flows including Remix single-fetch, middleware/context APIs, automatic loader caching, and more

### Patch Changes

- Updated dependencies:
  - `@remix-run/router@1.16.0`
  - `react-router@6.23.0`
  - `react-router-dom@6.23.0`

## 6.22.3

### Patch Changes

- Updated dependencies:
  - `react-router@6.22.3`
  - `react-router-dom@6.22.3`

## 6.22.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.22.2`
  - `react-router-dom@6.22.2`

## 6.22.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.22.1`
  - `react-router-dom@6.22.1`

## 6.22.0

### Minor Changes

- Include a `window__reactRouterVersion` tag for CWV Report detection ([#11222](https://github.com/remix-run/react-router/pull/11222))

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.22.0`
  - `react-router@6.22.0`

## 6.21.3

### Patch Changes

- Remove leftover `unstable_` prefix from `Blocker`/`BlockerFunction` types ([#11187](https://github.com/remix-run/react-router/pull/11187))
- Updated dependencies:
  - `react-router-dom@6.21.3`
  - `react-router@6.21.3`

## 6.21.2

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.21.2`
  - `react-router@6.21.2`

## 6.21.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.21.1`
  - `react-router-dom@6.21.1`

## 6.21.0

### Minor Changes

- Add a new `future.v7_relativeSplatPath` flag to implement a breaking bug fix to relative routing when inside a splat route. ([#11087](https://github.com/remix-run/react-router/pull/11087))

  This fix was originally added in [#10983](https://github.com/remix-run/react-router/issues/10983) and was later reverted in [#11078](https://github.com/remix-run/react-router/pull/11078) because it was determined that a large number of existing applications were relying on the buggy behavior (see [#11052](https://github.com/remix-run/react-router/issues/11052))

  **The Bug**
  The buggy behavior is that without this flag, the default behavior when resolving relative paths is to _ignore_ any splat (`*`) portion of the current route path.

  **The Background**
  This decision was originally made thinking that it would make the concept of nested different sections of your apps in `<Routes>` easier if relative routing would _replace_ the current splat:

  ```jsx
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard/*" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
  ```

  Any paths like `/dashboard`, `/dashboard/team`, `/dashboard/projects` will match the `Dashboard` route. The dashboard component itself can then render nested `<Routes>`:

  ```jsx
  function Dashboard() {
    return (
      <div>
        <h2>Dashboard</h2>
        <nav>
          <Link to="/">Dashboard Home</Link>
          <Link to="team">Team</Link>
          <Link to="projects">Projects</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="team" element={<DashboardTeam />} />
          <Route path="projects" element={<DashboardProjects />} />
        </Routes>
      </div>
    );
  }
  ```

  Now, all links and route paths are relative to the router above them. This makes code splitting and compartmentalizing your app really easy. You could render the `Dashboard` as its own independent app, or embed it into your large app without making any changes to it.

  **The Problem**

  The problem is that this concept of ignoring part of a path breaks a lot of other assumptions in React Router - namely that `"."` always means the current location pathname for that route. When we ignore the splat portion, we start getting invalid paths when using `"."`:

  ```jsx
  // If we are on URL /dashboard/team, and we want to link to /dashboard/team:
  function DashboardTeam() {
    // ❌ This is broken and results in <a href="/dashboard">
    return <Link to=".">A broken link to the Current URL</Link>;

    // ✅ This is fixed but super unintuitive since we're already at /dashboard/team!
    return <Link to="./team">A broken link to the Current URL</Link>;
  }
  ```

  We've also introduced an issue that we can no longer move our `DashboardTeam` component around our route hierarchy easily - since it behaves differently if we're underneath a non-splat route, such as `/dashboard/:widget`. Now, our `"."` links will, properly point to ourself _inclusive of the dynamic param value_ so behavior will break from it's corresponding usage in a `/dashboard/*` route.

  Even worse, consider a nested splat route configuration:

  ```jsx
  <BrowserRouter>
    <Routes>
      <Route path="dashboard">
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  </BrowserRouter>
  ```

  Now, a `<Link to=".">` and a `<Link to="..">` inside the `Dashboard` component go to the same place! That is definitely not correct!

  Another common issue arose in Data Routers (and Remix) where any `<Form>` should post to it's own route `action` if you the user doesn't specify a form action:

  ```jsx
  let router = createBrowserRouter({
    path: "/dashboard",
    children: [
      {
        path: "*",
        action: dashboardAction,
        Component() {
          // ❌ This form is broken!  It throws a 405 error when it submits because
          // it tries to submit to /dashboard (without the splat value) and the parent
          // `/dashboard` route doesn't have an action
          return <Form method="post">...</Form>;
        },
      },
    ],
  });
  ```

  This is just a compounded issue from the above because the default location for a `Form` to submit to is itself (`"."`) - and if we ignore the splat portion, that now resolves to the parent route.

  **The Solution**
  If you are leveraging this behavior, it's recommended to enable the future flag, move your splat to it's own route, and leverage `../` for any links to "sibling" pages:

  ```jsx
  <BrowserRouter>
    <Routes>
      <Route path="dashboard">
        <Route index path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  </BrowserRouter>

  function Dashboard() {
    return (
      <div>
        <h2>Dashboard</h2>
        <nav>
          <Link to="..">Dashboard Home</Link>
          <Link to="../team">Team</Link>
          <Link to="../projects">Projects</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="team" element={<DashboardTeam />} />
          <Route path="projects" element={<DashboardProjects />} />
        </Router>
      </div>
    );
  }
  ```

  This way, `.` means "the full current pathname for my route" in all cases (including static, dynamic, and splat routes) and `..` always means "my parents pathname".

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.21.0`
  - `react-router@6.21.0`

## 6.20.1

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.20.1`
  - `react-router@6.20.1`

## 6.20.0

### Minor Changes

- Export the `PathParam` type from the public API ([#10719](https://github.com/remix-run/react-router/pull/10719))

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.20.0`
  - `react-router@6.20.0`

## 6.19.0

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.19.0`
  - `react-router@6.19.0`

## 6.18.0

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.18.0`
  - `react-router@6.18.0`

## 6.17.0

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.17.0`
  - `react-router@6.17.0`

## 6.16.0

### Minor Changes

- Updated dependencies:
  - `react-router-dom@6.16.0`
  - `react-router@6.16.0`

## 6.15.0

### Minor Changes

- Add's a new `redirectDocument()` function which allows users to specify that a redirect from a `loader`/`action` should trigger a document reload (via `window.location`) instead of attempting to navigate to the redirected location via React Router ([#10705](https://github.com/remix-run/react-router/pull/10705))

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.15.0`
  - `react-router@6.15.0`

## 6.14.2

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.14.2`
  - `react-router@6.14.2`

## 6.14.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.14.1`
  - `react-router-dom@6.14.1`

## 6.14.0

### Patch Changes

- Upgrade `typescript` to 5.1 ([#10581](https://github.com/remix-run/react-router/pull/10581))
- Updated dependencies:
  - `react-router@6.14.0`
  - `react-router-dom@6.14.0`

## 6.13.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.13.0`
  - `react-router-dom@6.13.0`

## 6.12.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.12.1`
  - `react-router-dom@6.12.1`

## 6.12.0

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.12.0`
  - `react-router@6.12.0`

## 6.11.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.2`
  - `react-router-dom@6.11.2`

## 6.11.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.1`
  - `react-router-dom@6.11.1`

## 6.11.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.11.0`
  - `react-router-dom@6.11.0`

## 6.10.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.10.0`
  - `react-router-dom@6.10.0`

## 6.9.0

### Minor Changes

- Updated dependencies:
  - `react-router@6.9.0`
  - `react-router-dom@6.9.0`

### Patch Changes

- Add missed data router API re-exports ([#10171](https://github.com/remix-run/react-router/pull/10171))

## 6.8.2

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.8.2`
  - `react-router@6.8.2`

## 6.8.1

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.8.1`
  - `react-router@6.8.1`

## 6.8.0

### Patch Changes

- Fix SSR `useLayoutEffect` `console.error` when using `CompatRouter` ([#9820](https://github.com/remix-run/react-router/pull/9820))
- Updated dependencies:
  - `react-router-dom@6.8.0`
  - `react-router@6.8.0`

## 6.7.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.7.0`
  - `react-router-dom@6.7.0`

## 6.6.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.6.2`
  - `react-router-dom@6.6.2`

## 6.6.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.6.1`
  - `react-router-dom@6.6.1`

## 6.6.0

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.6.0`
  - `react-router@6.6.0`

## 6.5.0

### Patch Changes

- Updated dependencies:
  - `react-router@6.5.0`
  - `react-router-dom@6.5.0`

## 6.4.5

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.5`
  - `react-router-dom@6.4.5`

## 6.4.4

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.4.4`
  - `react-router@6.4.4`

## 6.4.3

### Patch Changes

- Updated dependencies:
  - `react-router-dom@6.4.3`
  - `react-router@6.4.3`

## 6.4.2

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.2`
  - `react-router-dom@6.4.2`

## 6.4.1

### Patch Changes

- Updated dependencies:
  - `react-router@6.4.1`
  - `react-router-dom@6.4.1`

## 6.4.0

**Updated dependencies**

- `react-router-dom@6.4.0`
- `react-router@6.4.0`
