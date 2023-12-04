---
"react-router-dom-v5-compat": minor
"react-router-native": minor
"react-router-dom": minor
"react-router": minor
"@remix-run/router": minor
---

Add a new `future.v7_relativeSplatPath` flag to implenent a breaking bug fix to relative routing when inside a splat route.

This fix was originally added in [#10983](https://github.com/remix-run/react-router/issues/10983) and was later reverted in [#11078](https://github.com/remix-run/react-router/issues/110788) because it was determined that a large number of existing applications were relying on the buggy behavior (see [#11052](https://github.com/remix-run/react-router/issues/11052))

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
      </Router>
    </div>
  );
}
```

Now, all links and route paths are relative to the router above them. This makes code splitting and compartmentalizing your app really easy. You could render the `Dashboard` as its own independent app, or embed it into your large app without making any changes to it.

**The Problem**

The problem is that this concept of ignoring part of a pth breaks a lot of other assumptions in React Router - namely that `"."` always means the current location pathname for that route. When we ignore the splat portion, we start getting invalid paths when using `"."`:

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
      <Route path="*" element={<Dashboard />} />
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
