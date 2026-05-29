---
title: Special Files
description: root.tsx, routes.ts, react-router.config.ts, entry files, and module conventions
tags: [root.tsx, routes.ts, config, entry, .server, .client, special-files]
---

# Special Files

React Router framework mode uses several special files with specific purposes.

## Quick Reference

| File                     | Required | Purpose                                              |
| ------------------------ | -------- | ---------------------------------------------------- |
| `app/root.tsx`           | Yes      | Root route rendering the HTML document               |
| `app/routes.ts`          | Yes      | Route configuration (see [routing.md](./routing.md)) |
| `react-router.config.ts` | No       | Framework configuration (SSR, prerender, etc.)       |
| `app/entry.client.tsx`   | No       | Client-side hydration entry point                    |
| `app/entry.server.tsx`   | No       | Server-side rendering entry point                    |
| `*.server.ts`            | No       | Server-only modules (excluded from client)           |
| `*.client.ts`            | No       | Client-only modules (excluded from server)           |

---

## root.tsx (Required)

**`app/root.tsx` is the only required route** - it's the parent to all routes and renders the root `<html>` document.

### What Belongs in root.tsx

| Element                                | Why                                                           |
| -------------------------------------- | ------------------------------------------------------------- |
| `<html>`, `<head>`, `<body>`           | Document structure                                            |
| `<Meta />`, `<Links />`                | Route meta/links aggregation                                  |
| `<Scripts />`, `<ScrollRestoration />` | React Router runtime                                          |
| `<Outlet />`                           | Child route rendering                                         |
| Global navigation                      | Appears on every page                                         |
| Global footer                          | Appears on every page                                         |
| Context providers                      | Available to all routes                                       |
| Stylesheets/fonts                      | Loaded once, cached                                           |
| Global error boundary                  | Catches app-wide errors                                       |
| Loading indicators                     | Show during navigation (see [pending-ui.md](./pending-ui.md)) |

### Basic root.tsx Structure

```tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

### Using the Layout Export

The `Layout` export avoids duplicating the document shell across your component, `HydrateFallback`, and `ErrorBoundary`:

```tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return <div>Something went wrong</div>;
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}
```

### Customizing root.tsx (Complete Example)

```tsx
import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useRouteLoaderData,
} from "react-router";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Global fonts go in root.tsx, not layout components */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <div className="app-layout">
      {/* Global loading indicator */}
      {isNavigating && <ProgressBar />}

      {/* Global navigation */}
      <header className="app-header">
        <nav className="app-nav">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Products
          </NavLink>
        </nav>
      </header>

      {/* Page content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Global footer */}
      <footer className="app-footer">
        © {new Date().getFullYear()} My App
      </footer>
    </div>
  );
}
```

**Note:** Be defensive in your `Layout` component since it renders the `ErrorBoundary`. Use `useRouteLoaderData("root")` instead of `useLoaderData` to handle cases where the loader threw. See [error-handling.md](./error-handling.md) for error boundary patterns.

---

## routes.ts (Required)

Defines the URL structure and maps URLs to route modules.

**For detailed routing patterns, see [routing.md](./routing.md).**

Quick example:

```ts
import {
  type RouteConfig,
  route,
  index,
  layout,
} from "@react-router/dev/routes";

export default [
  index("./home.tsx"),
  route("about", "./about.tsx"),
  layout("./dashboard/layout.tsx", [
    route("dashboard", "./dashboard/index.tsx"),
    route("dashboard/settings", "./dashboard/settings.tsx"),
  ]),
] satisfies RouteConfig;
```

---

## react-router.config.ts (Optional)

Configures framework-level settings:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  // App directory (default: "app")
  appDirectory: "app",

  // Build output directory (default: "build")
  buildDirectory: "build",

  // Enable/disable SSR (default: true)
  ssr: true,

  // Pre-render routes at build time
  prerender: ["/", "/about", "/pricing"],

  // Base path for all routes
  basename: "/my-app",

  // Future flags
  future: {
    v8_middleware: true,
  },
} satisfies Config;
```

### Common Configuration Options

| Option           | Default   | Purpose                             |
| ---------------- | --------- | ----------------------------------- |
| `ssr`            | `true`    | Enable server-side rendering        |
| `prerender`      | `[]`      | Routes to pre-render as static HTML |
| `basename`       | `"/"`     | Base URL path for all routes        |
| `appDirectory`   | `"app"`   | Source directory                    |
| `buildDirectory` | `"build"` | Build output directory              |
| `future`         | `{}`      | Enable future flags                 |

### SPA Mode

Disable SSR for a single-page application:

```ts
export default {
  ssr: false,
} satisfies Config;
```

### Pre-rendering

Pre-render routes to static HTML at build time:

```ts
export default {
  async prerender({ getStaticPaths }) {
    const dynamicPaths = await getStaticPaths();
    return ["/", "/about", ...dynamicPaths];
  },
} satisfies Config;
```

---

## entry.client.tsx (Optional)

The browser entry point for hydrating server-rendered markup. React Router provides a default, but you can customize it:

```bash
npx react-router reveal
```

```tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
```

**Use cases for customizing:**

- Initialize client-side libraries (analytics, error tracking)
- Add client-only providers
- Custom hydration logic

---

## entry.server.tsx (Optional)

The server entry point for rendering HTML responses. React Router provides a default for Node, but you may need to customize for other runtimes (Cloudflare, Deno).

```bash
npx react-router reveal
```

```tsx
import { PassThrough } from "node:stream";
import type { EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          responseHeaders.set("Content-Type", "text/html");
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
      },
    );
  });
}

// Optional: Control streaming timeout
export const streamTimeout = 10000;

// Optional: Handle errors
export function handleError(error: unknown, { request }: { request: Request }) {
  if (!request.signal.aborted) {
    console.error(error);
  }
}
```

---

## .server Modules

Files with `.server` in the name (e.g., `auth.server.ts`) are **server-only** and excluded from client bundles.

```
app/
├── utils/
│   ├── db.server.ts      # Server-only
│   ├── auth.server.ts    # Server-only
│   └── format.ts         # Shared
```

**Use for:**

- Database connections
- Authentication utilities
- Environment variables/secrets
- Server-only APIs

```tsx
// db.server.ts
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
```

**Safety:** The build will fail if `.server` code accidentally ends up in the client bundle.

**Important:** Route modules should NOT use `.server` - they have special handling.

---

## .client Modules

Files with `.client` in the name (e.g., `analytics.client.ts`) are **client-only** and excluded from server bundles.

```
app/
├── utils/
│   ├── analytics.client.ts  # Client-only
│   ├── browser.client.ts    # Client-only
│   └── format.ts            # Shared
```

**Use for:**

- Browser-specific APIs (localStorage, navigator)
- Client-only libraries (charting, animations)
- Feature detection

```tsx
// analytics.client.ts
export function trackEvent(name: string) {
  window.gtag?.("event", name);
}
```

**Note:** Values exported from `.client` modules are `undefined` on the server. Only use them in `useEffect` or event handlers.

---

## Where to Place Stylesheets and Fonts

**Global styles and fonts belong in `root.tsx`**, not in layout components:

- Global fonts: In `root.tsx` `<head>` (see example above)
- Route-specific stylesheets: Use the `links` export in route modules (see [route-modules.md](./route-modules.md#links))

---

## Anti-Patterns

**Don't create a separate layout just for nav/footer** - put global UI in `root.tsx`.

**Don't use flat routes when nesting makes sense** - see [routing.md](./routing.md#layout-routes-use-them) for proper nested route patterns.

---

## See Also

- [routing.md](./routing.md) - Route configuration patterns
- [route-modules.md](./route-modules.md) - Route module exports
- [Official Documentation](https://reactrouter.com/explanation/special-files)
