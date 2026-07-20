---
title: Styling
---

# Styling

[MODES: framework]

<br/>
<br/>

Framework mode uses the React Router Vite plugin, so the styling story is mostly just Vite's styling story.

React Router does not have a separate CSS pipeline for Framework mode. In practice, there are three patterns that matter:

1. Import CSS as a side effect
2. Use the route module `links` export
3. Render a stylesheet `<link>` directly

## Side-Effect CSS Imports

Because Framework mode uses Vite, you can import CSS files as side effects:

```tsx filename=app/root.tsx
import "./app.css";
```

```tsx filename=app/routes/dashboard.tsx
import "./dashboard.css";
```

This is often the simplest option. Global styles can be imported in `root.tsx`, and route or component styles can be imported next to the module that uses them.

## `links` Export

React Router also supports adding stylesheets through the route module `links` export.

This is useful when you want a stylesheet URL from Vite and need React Router to render a real `<link rel="stylesheet">` tag for the route:

```tsx filename=app/routes/dashboard.tsx
import dashboardHref from "./dashboard.css?url";

export function links() {
  return [{ rel: "stylesheet", href: dashboardHref }];
}
```

The `links` export feeds the [`<Links />`][links-component] component in your root route. This is the React Router-specific styling API in Framework mode. For more on route module exports, see [Route Module][route-module].

## Direct `<link>` Rendering

If you're using React 19, you can also render a stylesheet `<link>` directly in your route component:

```tsx filename=app/routes/dashboard.tsx
import dashboardHref from "./dashboard.css?url";

export default function Dashboard() {
  return (
    <>
      <link
        rel="stylesheet"
        href={dashboardHref}
        precedence="default"
      />
      <h1>Dashboard</h1>
    </>
  );
}
```

This uses React's built-in [`<link>`][react-link] support, which hoists the stylesheet into the document `<head>`. That gives you another way to colocate stylesheet tags with the route that needs them.

## Everything Else

For CSS Modules, Tailwind, PostCSS, Sass, Vanilla Extract, and other styling tools, use the normal Vite setup for those tools.

See:

- [Vite CSS Features][vite-css]
- [Vite Static Asset Handling][vite-assets]
- [`<Links />`][links-component]

[links-component]: ../api/components/Links
[react-link]: https://react.dev/reference/react-dom/components/link
[route-module]: ../start/framework/route-module
[vite-assets]: https://vite.dev/guide/assets.html
[vite-css]: https://vite.dev/guide/features.html#css
