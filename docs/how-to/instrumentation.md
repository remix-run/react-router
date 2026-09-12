---
title: Instrumentation
---

# Instrumentation

[MODES: framework, data]

<br/>
<br/>

Instrumentation allows you to add logging, error reporting, and performance tracing to your React Router application without modifying your actual route handlers. This enables comprehensive observability solutions for production applications on both the server and client.

## Overview

With the React Router Instrumentation APIs, you provide "wrapper" functions that execute around your request handlers, router operations, route middlewares, and/or route handlers. This allows you to:

- Monitor application performance
- Add logging
- Integrate with observability platforms (Sentry, DataDog, New Relic, etc.)
- Implement OpenTelemetry tracing
- Track user behavior and navigation patterns

A key design principle is that instrumentation is **read-only** - you can observe what's happening but cannot modify runtime application behavior by modifying the arguments passed to, or data returned from your route handlers.

<docs-info>
As with any instrumentation approach, adding additional code execution at runtime may alter the performance characteristics compared to an uninstrumented application. Keep this in mind and perform appropriate testing and/or leverage conditional instrumentation to avoid a negative UX impact in production.
</docs-info>

## Quick Start (Framework Mode)

[modes: framework]

### 1. Server-side Instrumentation

Add instrumentations to your `entry.server.tsx`:

```tsx filename=app/entry.server.tsx
export const instrumentations = [
  {
    // Instrument the server handler
    handler(handler) {
      handler.instrument({
        async request(handleRequest, { request }) {
          let url = `${request.method} ${request.url}`;
          console.log(`Request start: ${url}`);
          let result = await handleRequest();
          let pattern = result.meta?.pattern ?? "unknown";
          console.log(
            `Request end: ${url} (${result.statusCode} ${pattern})`,
          );
        },
      });
    },

    // Instrument individual routes
    route(route) {
      // Skip instrumentation for specific routes if needed
      if (route.id === "root") return;

      route.instrument({
        async loader(callLoader, { request }) {
          let url = `${request.method} ${request.url}`;
          console.log(`Loader start: ${url} - ${route.id}`);
          await callLoader();
          console.log(`Loader end: ${url} - ${route.id}`);
        },
        // Other available instrumentations:
        // async action() { /* ... */ },
        // async middleware() { /* ... */ },
        // async lazy() { /* ... */ },
      });
    },
  },
];

export default function handleRequest(/* ... */) {
  // Your existing handleRequest implementation
}
```

### 2. Client-side Instrumentation

Add instrumentations to your `entry.client.tsx`:

```tsx filename=app/entry.client.tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

const instrumentations = [
  {
    // Instrument router operations
    router(router) {
      router.instrument({
        // Instrument navigations
        async navigate(callNavigate, { currentUrl, to }) {
          let nav = `${currentUrl} -> ${to}`;
          console.log(`Navigation start: ${nav}`);
          let result = await callNavigate();
          console.log(
            `Navigation end: ${nav} (${result.meta?.pattern})`,
          );
        },
        // Instrument fetcher calls
        async fetch(
          callFetch,
          { href, currentUrl, fetcherKey },
        ) {
          let fetch = `${fetcherKey} -> ${href}`;
          console.log(`Fetcher start: ${fetch}`);
          let result = await callFetch();
          console.log(
            `Fetcher end: ${fetch} (${result.meta?.pattern})`,
          );
        },
      });
    },

    // Instrument individual routes (same as server-side)
    route(route) {
      // Skip instrumentation for specific routes if needed
      if (route.id === "root") return;

      route.instrument({
        async loader(callLoader, { request }) {
          let url = `${request.method} ${request.url}`;
          console.log(`Loader start: ${url} - ${route.id}`);
          await callLoader();
          console.log(`Loader end: ${url} - ${route.id}`);
        },
        // Other available instrumentations:
        // async action() { /* ... */ },
        // async middleware() { /* ... */ },
        // async lazy() { /* ... */ },
      });
    },
  },
];

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter instrumentations={instrumentations} />
    </StrictMode>,
  );
});
```

## Quick Start (Data Mode)

[modes: data]

In Data Mode, you add instrumentations when creating your router:

```tsx
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

const instrumentations = [
  {
    // Instrument router operations
    router(router) {
      router.instrument({
        // Instrument navigations
        async navigate(callNavigate, { currentUrl, to }) {
          let nav = `${currentUrl} -> ${to}`;
          console.log(`Navigation start: ${nav}`);
          let result = await callNavigate();
          console.log(
            `Navigation end: ${nav} (${result.meta?.pattern})`,
          );
        },
        // Instrument fetcher calls
        async fetch(
          callFetch,
          { href, currentUrl, fetcherKey },
        ) {
          let fetch = `${fetcherKey} -> ${href}`;
          console.log(`Fetcher start: ${fetch}`);
          let result = await callFetch();
          console.log(
            `Fetcher end: ${fetch} (${result.meta?.pattern})`,
          );
        },
      });
    },

    // Instrument individual routes (same as server-side)
    route(route) {
      // Skip instrumentation for specific routes if needed
      if (route.id === "root") return;

      route.instrument({
        async loader(callLoader, { request }) {
          let url = `${request.method} ${request.url}`;
          console.log(`Loader start: ${url} - ${route.id}`);
          await callLoader();
          console.log(`Loader end: ${url} - ${route.id}`);
        },
        // Other available instrumentations:
        // async action() { /* ... */ },
        // async middleware() { /* ... */ },
        // async lazy() { /* ... */ },
      });
    },
  },
];

const router = createBrowserRouter(routes, {
  instrumentations,
});

function App() {
  return <RouterProvider router={router} />;
}
```

## Core Concepts

### Instrumentation Levels

There are different levels at which you can instrument your application. Each instrumentation function receives a second "info" parameter containing relevant contextual information for the specific aspect being instrumented.

#### 1. Handler Level (Server)

[modes: framework]

Instruments the top-level request handler that processes all requests to your server:

```tsx filename=entry.server.tsx
export const instrumentations = [
  {
    handler(handler) {
      handler.instrument({
        async request(handleRequest, { request, context }) {
          // Runs around ALL requests to your app
          let result = await handleRequest();
          let statusCode = result.statusCode;
          let routePattern = result.meta?.pattern;
        },
      });
    },
  },
];
```

#### 2. Router Level (Client)

[modes: framework,data]

Instruments client-side router operations like navigations and fetcher calls:

```tsx
export const instrumentations = [
  {
    router(router) {
      router.instrument({
        async navigate(callNavigate, { to, currentUrl }) {
          // Runs around navigation operations
          let result = await callNavigate();
          let routePattern = result.meta?.pattern;
        },
        async fetch(
          callFetch,
          { href, currentUrl, fetcherKey },
        ) {
          // Runs around fetcher operations
          let result = await callFetch();
          let routePattern = result.meta?.pattern;
        },
      });
    },
  },
];

// Framework Mode (entry.client.tsx)
<HydratedRouter instrumentations={instrumentations} />;

// Data Mode
const router = createBrowserRouter(routes, {
  instrumentations,
});
```

#### 3. Route Level (Server + Client)

[modes: framework,data]

Instruments individual route handlers:

```tsx
const instrumentations = [
  {
    route(route) {
      route.instrument({
        async loader(
          callLoader,
          { params, request, context, pattern },
        ) {
          // Runs around loader execution
          await callLoader();
        },
        async action(
          callAction,
          { params, request, context, pattern },
        ) {
          // Runs around action execution
          await callAction();
        },
        async middleware(
          callMiddleware,
          { params, request, context, pattern },
        ) {
          // Runs around middleware execution
          await callMiddleware();
        },
        async lazy(callLazy) {
          // Runs around lazy route loading
          await callLazy();
        },
      });
    },
  },
];
```

### Read-only Design

Instrumentations are designed to be **observational only**. You cannot:

- Modify arguments passed to handlers
- Change return values from handlers
- Alter application behavior

This ensures that instrumentation is safe to add to production applications and cannot introduce bugs in your route logic.

### Error Handling

To ensure that instrumentation code doesn't impact the runtime application, errors are caught internally and prevented from propagating outward. This design choice shows up in 2 aspects.

First, if a "handler" function (loader, action, request handler, navigation, etc.) throws an error, that error will not bubble out of the `callHandler` function invoked from your instrumentation. Instead, the `callHandler` function returns a discriminated union result of type `{ status: "success", error: undefined } | { status: "error", error: Error }`. This ensures your entire instrumentation function runs without needing any try/catch/finally logic to handle application errors.

```tsx
export const instrumentations = [
  {
    route(route) {
      route.instrument({
        async loader(callLoader) {
          let { status, error } = await callLoader();

          if (status === "error") {
            // error case - `error` is defined
          } else {
            // success case - `error` is undefined
          }
        },
      });
    },
  },
];
```

Second, if your instrumentation function throws an error, React Router will gracefully swallow that so that it does not bubble outward and impact other instrumentations or application behavior. In both of these examples, the handlers and all other instrumentation functions will still run:

```tsx
export const instrumentations = [
  {
    route(route) {
      route.instrument({
        // Throwing before calling the handler - RR will
        // catch the error and still call the loader
        async loader(callLoader) {
          somethingThatThrows();
          await callLoader();
        },
        // Throwing after calling the handler - RR will
        // catch the error internally
        async action(callAction) {
          await callAction();
          somethingThatThrows();
        },
      });
    },
  },
];
```

### Result Metadata

Some instrumented calls return additional information that is only available after React Router starts processing the request, navigation, or fetcher call.

- Route-level instrumentations (`loader`/`action`/`middleware`) don't include `meta` because metadata is available on the `info` parameter
- Client navigation/fetcher and Server request handler instrumentations return a meta field
  - `meta` contains the same values passed to loaders and actions
    - `url`: The normalized `URL` for the matched route request
    - `pattern`: The matched route pattern, such as `/projects/:id`
    - `params`: The matched route params
  - `meta` may be `undefined` when React Router does not have route metadata for the instrumented call, such as server manifest requests or numeric POP navigations like `navigate(-1)`
  - For client navigations that redirect, `meta` describes the original navigation target instead of the final redirected location.
- Server request handler instrumentations also return the `statusCode` of the response

```tsx
// entry.server.tsx
export const instrumentations = [
  {
    handler(handler) {
      handler.instrument({
        async request(handleRequest) {
          let result = await handleRequest();

          let statusCode = result.statusCode;
          let routeUrl = result.meta?.url;
          let routePattern = result.meta?.pattern;
          let routeParams = result.meta?.params;
        },
      });
    },
  },
];

// entry.client.tsx
const instrumentations = [
  {
    router(router) {
      router.instrument({
        async navigate(callNavigate) {
          let result = await callNavigate();

          let routeUrl = result.meta?.url;
          let routePattern = result.meta?.pattern;
          let routeParams = result.meta?.params;
        },
        async fetch(callFetch) {
          let result = await callFetch();

          let routeUrl = result.meta?.url;
          let routePattern = result.meta?.pattern;
          let routeParams = result.meta?.params;
        },
      });
    },
  },
];
```

### Composition

You can compose multiple instrumentations by providing an array:

```tsx
export const instrumentations = [
  loggingInstrumentation,
  performanceInstrumentation,
  errorReportingInstrumentation,
];
```

Each instrumentation wraps the previous one, creating a nested execution chain.

### Conditional Instrumentation

You can enable instrumentation conditionally based on environment or other factors:

```tsx
export const instrumentations =
  process.env.NODE_ENV === "production"
    ? [productionInstrumentation]
    : [developmentInstrumentation];
```

```tsx
// Or conditionally within an instrumentation
export const instrumentations = [
  {
    route(route) {
      // Only instrument specific routes
      if (!route.id?.startsWith("routes/admin")) return;

      // Or, only instrument if a query parameter is present
      let sp = new URL(request.url).searchParams;
      if (!sp.has("DEBUG")) return;

      route.instrument({
        async loader() {
          /* ... */
        },
      });
    },
  },
];
```

## Common Patterns

### Request logging (server)

```tsx
const logging: ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      async request(fn, { request }) {
        let label = `request ${request.url}`;
        let start = Date.now();
        console.log(`-> ${label}`);
        let result = await fn();
        let pattern = result.meta?.pattern ?? "";
        console.log(
          `<- ${label} (${Date.now() - start}ms ${result.statusCode} ${pattern})`,
        );
      },
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => log(` middleware (${id})`, fn),
      loader: (fn) => log(`  loader (${id})`, fn),
      action: (fn) => log(`  action (${id})`, fn),
    });
  },
};

async function log(
  label: string,
  cb: () => Promise<InstrumentationHandlerResult>,
) {
  let start = Date.now();
  console.log(`-> ${label}`);
  await cb();
  console.log(`<- ${label} (${Date.now() - start}ms)`);
}

export const instrumentations = [logging];
```

### OpenTelemetry Integration

```tsx
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

const otel: ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      request: (fn, { request }) =>
        otelSpan(`request`, { url: request.url }, fn),
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn, { pattern }) =>
        otelSpan(
          "middleware",
          { routeId: id, pattern: pattern },
          fn,
        ),
      loader: (fn, { pattern }) =>
        otelSpan(
          "loader",
          { routeId: id, pattern: pattern },
          fn,
        ),
      action: (fn, { pattern }) =>
        otelSpan(
          "action",
          { routeId: id, pattern: pattern },
          fn,
        ),
    });
  },
};

async function otelSpan(
  label: string,
  attributes: Record<string, string>,
  cb: () => Promise<InstrumentationHandlerResult>,
) {
  return tracer.startActiveSpan(
    label,
    { attributes },
    async (span) => {
      let { error } = await cb();
      if (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
        });
      }
      span.end();
    },
  );
}

export const instrumentations = [otel];
```

### Client-side Performance Tracking

```tsx
const windowPerf: ClientInstrumentation = {
  router({ instrument }) {
    instrument({
      async navigate(fn, { to, currentUrl }) {
        let label = `navigation:${currentUrl}->${to}`;
        performance.mark(`start:${label}`);
        let result = await fn();
        performance.mark(`end:${label}`);
        performance.measure(
          label,
          `start:${label}`,
          `end:${label}`,
        );
        console.log(
          `navigation pattern: ${result.meta?.pattern}`,
        );
      },
      async fetch(fn, { href }) {
        let label = `fetcher:${href}`;
        performance.mark(`start:${label}`);
        let result = await fn();
        performance.mark(`end:${label}`);
        performance.measure(
          label,
          `start:${label}`,
          `end:${label}`,
        );
        console.log(
          `fetcher pattern: ${result.meta?.pattern}`,
        );
      },
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => measure(`middleware:${id}`, fn),
      loader: (fn) => measure(`loader:${id}`, fn),
      action: (fn) => measure(`action:${id}`, fn),
    });
  },
};

async function measure(
  label: string,
  cb: () => Promise<InstrumentationHandlerResult>,
) {
  performance.mark(`start:${label}`);
  await cb();
  performance.mark(`end:${label}`);
  performance.measure(
    label,
    `start:${label}`,
    `end:${label}`,
  );
}

<HydratedRouter instrumentations={[windowPerf]} />;
```
