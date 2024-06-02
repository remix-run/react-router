---
title: Current Future Flags
order: 1
new: true
---

# Future Flags

The following future flags are stable and ready to adopt. To read more about future flags see [Development Strategy](../guides/api-development-strategy)

## Update to latest v6.x

First update to the latest minor version of v6.x to have the latest future flags.

👉 **Update to latest v6**

```shellscript nonumber
npm install react-router-dom@6
```

## v7_relativeSplatPath

**Background**

Changes the relative path matching and linking for multi-segment splats paths like `dashboard/*` (vs. just `*`). [View the CHANGELOG](https://github.com/remix-run/react-router/blob/main/packages/react-router-dom/CHANGELOG.md#minor-changes-2) for more information.

👉 **Enable the flag**

Enabling the flag depends on the type of router:

```tsx
<BrowserRouter
  future={{
    v7_relativeSplatPath: true,
  }}
/>
```

```tsx
createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
  },
});
```

**Update your Code**

If you have any routes with a path + a splat like `<Route path="dashboard/*">` and has relative links like `<Link to="relative">` or `<Link to="../relative">` beneath it, you will need to update your code.

👉 **Split the `<Route>` into two**

Split any multi-segment splat `<Route>` into a parent route with the path and a child route with the splat:

```diff
<Routes>
  <Route path="/" element={<Home />} />
-  <Route path="dashboard/*" element={<Dashboard />} />
+  <Route path="dashboard">
+    <Route path="*" element={<Dashboard />} />
+  </Route>
</Routes>

// or
createBrowserRouter([
  { path: "/", element: <Home /> },
  {
-    path: "dashboard/*",
-    element: <Dashboard />,
+    path: "dashboard",
+    children: [{ path: "*", element: <Dashboard /> }],
  },
]);
```

👉 **Update relative links**

Update any `<Link>` elements within that route tree to include the extra `..` relative segment to continue linking to the same place:

```diff
function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <nav>
-        <Link to="/">Dashboard Home</Link>
-        <Link to="team">Team</Link>
-        <Link to="projects">Projects</Link>
+        <Link to="../">Dashboard Home</Link>
+        <Link to="../team">Team</Link>
+        <Link to="../projects">Projects</Link>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="team" element={<DashboardTeam />} />
        <Route
          path="projects"
          element={<DashboardProjects />}
        />
      </Routes>
    </div>
  );
}
```

## v7_startTransition

**Background**

This uses `React.useTransition` instead of `React.useState` for Router state updates. View the [CHANGELOG](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v7_starttransition) for more information.

👉 **Enable the flag**

```tsx
<BrowserRouter
  future={{
    v7_startTransition: true,
  }}
/>

// or
<RouterProvider
  future={{
    v7_startTransition: true,
  }}
/>
```

👉 **Update your Code**

You don't need to update anything unless you are using `React.lazy` _inside_ of a component.

Using `React.lazy` inside of a component is incompatible with `React.useTransition` (or other code that makes promises inside of components). Move `React.lazy` to the module scope and stop making promises inside of components. This is not a limitation of React Router but rather incorrect usage of React.

## v7_fetcherPersist

<docs-warning>If you are not using a `createBrowserRouter` you can skip this</docs-warning>

**Background**

The fetcher lifecycle is now based on when it returns to an idle state rather than when its owner component unmounts: [View the CHANGELOG](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#persistence-future-flag-futurev7_fetcherpersist) for more information.

**Enable the Flag**

```tsx
createBrowserRouter(routes, {
  future: {
    v7_fetcherPersist: true,
  },
});
```

**Update your Code**

It's unlikely to affect your app. You may want to check any usage of `useFetchers` as they may persist longer than they did before. Depending on what you're doing, you may render something longer than before.

## v7_normalizeFormMethod

<docs-warning>If you are not using a `createBrowserRouter` you can skip this</docs-warning>

This normalizes `formMethod` fields as uppercase HTTP methods to align with the `fetch()` behavior. [View the CHANGELOG](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#futurev7_normalizeformmethod) for more information.

👉 **Enable the Flag**

```tsx
createBrowserRouter(routes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
```

**Update your Code**

If any of your code is checking for lowercase HTTP methods, you will need to update it to check for uppercase HTTP methods (or call `toLowerCase()` on it).

👉 **Compare `formMethod` to UPPERCASE**

```diff
-useNavigation().formMethod === "post"
-useFetcher().formMethod === "get";
+useNavigation().formMethod === "POST"
+useFetcher().formMethod === "GET";
```

## v7_partialHydration

<docs-warning>If you are not using a `createBrowserRouter` you can skip this</docs-warning>

This allows SSR frameworks to provide only partial hydration data. It's unlikely you need to worry about this, just turn the flag on. [View the CHANGELOG](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#partial-hydration) for more information.

👉 **Enable the Flag**

```tsx
createBrowserRouter(routes, {
  future: {
    v7_partialHydration: true,
  },
});
```
