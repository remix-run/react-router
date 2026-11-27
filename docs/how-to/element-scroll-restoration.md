---
title: Element Scroll Restoration
unstable: true
---

# Element Scroll Restoration

[MODES: framework, data]

<docs-warning>This API is unstable and may change or be removed without a major release.</docs-warning>

Use `unstable_useElementScrollRestoration` when a layout scrolls elements such as
its sidebar and content pane independently. Call the hook in the component that
owns each container:

```tsx
import {
  Outlet,
  unstable_useElementScrollRestoration,
} from "react-router";

function Sidebar() {
  unstable_useElementScrollRestoration("#sidebar");
  return (
    <aside
      id="sidebar"
      style={{ height: "100vh", overflow: "auto" }}
    >
      {/* Sidebar content */}
    </aside>
  );
}

function Content() {
  unstable_useElementScrollRestoration(
    "[data-scroll-content]",
  );
  return (
    <main
      data-scroll-content
      style={{ height: "100vh", overflow: "auto" }}
    >
      <Outlet />
    </main>
  );
}
```

The hook returns nothing. Mount and unmount it with the container; CSS determines
which element scrolls. Selectors use `document.querySelector`, so they should
identify one unique element and keep the same meaning across routes and reloads.
Changing a selector loses access to the old selector's saved positions. Missing
or invalid targets are skipped without falling back to window scrolling.

## Root configuration and SSR

With `<ScrollRestoration>` present, all containers share its `getKey` and
`storageKey`. There are no per-container overrides. For example, a root component
can restore positions by pathname:

```tsx
import { Scripts, ScrollRestoration } from "react-router";

export default function Root() {
  return (
    <html>
      <head />
      <body>
        <Sidebar />
        <Content />
        <ScrollRestoration
          getKey={(location) => location.pathname}
          storageKey="my-scroll-positions"
        />
        <Scripts />
      </body>
    </html>
  );
}
```

Framework SSR requires this root component's restoration script after the
container markup. Saved selectors let the script find containers before React
hydrates; React refs are not available at that point. Hydration recognizes
containers the script already restored and does not scroll them again.

In Data Mode and Framework Mode with `ssr: false`, the hooks also work without
`<ScrollRestoration>`. They use `location.key` and the default storage namespace.
Standalone hooks restore elements and leave window restoration policy alone. RSC
applications call the hook from client components and use the root restoration
component for SSR. Declarative routers do not support the hook.

## Navigation and timing

Containers follow the existing scroll restoration policy: restore a saved
position, otherwise scroll to a relevant hash target or reset to the top.
`preventScrollReset` prevents that fallback reset for every registered container.
Submission and revalidation suppression continues to apply.

Restoration makes one attempt per navigation or newly mounted container, using
the content available then. If the browser clamps the position because content is
too short, later images, deferred content, or virtualizer updates do not cause a
retry. A hook that remains mounted while its missing target appears later does
not retry either. Render the container and the content needed for restoration
together.
