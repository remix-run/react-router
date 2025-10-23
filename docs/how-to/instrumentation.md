---
title: Instrumentation
unstable: true
---

# Instrumentation

[MODES: framework, data]

<br/>
<br/>

<docs-warning>The instrumentation APIs are experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

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
export const unstable_instrumentations = [
  {
    // Instrument the server handler
    handler(handler) {
      handler.instrument({
        async request(handleRequest, { request }) {
          let url = `${request.method} ${request.url}`;
          console.log(`Request start: ${url}`);
          await handleRequest();
          console.log(`Request end: ${url}`);
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

const unstable_instrumentations = [
  {
    // Instrument router operations
    router(router) {
      router.instrument({
        // Instrument navigations
        async navigate(callNavigate, { currentUrl, to }) {
          let nav = `${currentUrl} → ${to}`;
          console.log(`Navigation start: ${nav}`);
          await callNavigate();
          console.log(`Navigation end: ${nav}`);
        },
        // Instrument fetcher calls
        async fetch(
          callFetch,
          { href, currentUrl, fetcherKey },
        ) {
          let fetch = `${fetcherKey} → ${href}`;
          console.log(`Fetcher start: ${fetch}`);
          await callFetch();
          console.log(`Fetcher end: ${fetch}`);
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
      <HydratedRouter
        unstable_instrumentations={
          unstable_instrumentations
        }
      />
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

const unstable_instrumentations = [
  {
    // Instrument router operations
    router(router) {
      router.instrument({
        // Instrument navigations
        async navigate(callNavigate, { currentUrl, to }) {
          let nav = `${currentUrl} → ${to}`;
          console.log(`Navigation start: ${nav}`);
          await callNavigate();
          console.log(`Navigation end: ${nav}`);
        },
        // Instrument fetcher calls
        async fetch(
          callFetch,
          { href, currentUrl, fetcherKey },
        ) {
          let fetch = `${fetcherKey} → ${href}`;
          console.log(`Fetcher start: ${fetch}`);
          await callFetch();
          console.log(`Fetcher end: ${fetch}`);
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
  unstable_instrumentations,
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
export const unstable_instrumentations = [
  {
    handler(handler) {
      handler.instrument({
        async request(handleRequest, { request, context }) {
          // Runs around ALL requests to your app
          await handleRequest();
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
export const unstable_instrumentations = [
  {
    router(router) {
      router.instrument({
        async navigate(callNavigate, { to, currentUrl }) {
          // Runs around navigation operations
          await callNavigate();
        },
        async fetch(
          callFetch,
          { href, currentUrl, fetcherKey },
        ) {
          // Runs around fetcher operations
          await callFetch();
        },
      });
    },
  },
];

// Framework Mode (entry.client.tsx)
<HydratedRouter
  unstable_instrumentations={unstable_instrumentations}
/>;

// Data Mode
const router = createBrowserRouter(routes, {
  unstable_instrumentations,
});
```

#### 3. Route Level (Server + Client)

[modes: framework,data]

Instruments individual route handlers:

```tsx
const unstable_instrumentations = [
  {
    route(route) {
      route.instrument({
        async loader(
          callLoader,
          { params, request, context, unstable_pattern },
        ) {
          // Runs around loader execution
          await callLoader();
        },
        async action(
          callAction,
          { params, request, context, unstable_pattern },
        ) {
          // Runs around action execution
          await callAction();
        },
        async middleware(
          callMiddleware,
          { params, request, context, unstable_pattern },
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

First, if a "handler" function (loader, action, request handler, navigation, etc.) throws an error, that error will not bubble out of the `callHandler` function invoked from your instrumentation. Instead, the `callHandler` function returns a discriminated union result of type `{ type: "success", error: undefined } | { type: "error", error: unknown }`. This ensures your entire instrumentation function runs without needing any try/catch/finally logic to handle application errors.

```tsx
export const unstable_instrumentations = [
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
export const unstable_instrumentations = [
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

### Composition

You can compose multiple instrumentations by providing an array:

```tsx
export const unstable_instrumentations = [
  loggingInstrumentation,
  performanceInstrumentation,
  errorReportingInstrumentation,
];
```

Each instrumentation wraps the previous one, creating a nested execution chain.

### Conditional Instrumentation

You can enable instrumentation conditionally based on environment or other factors:

```tsx
export const unstable_instrumentations =
  process.env.NODE_ENV === "production"
    ? [productionInstrumentation]
    : [developmentInstrumentation];
```

```tsx
// Or conditionally within an instrumentation
export const unstable_instrumentations = [
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
const logging: unstable_ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      request: (fn, { request }) =>
        log(`request ${request.url}`, fn),
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
  cb: () => Promise<unstable_InstrumentationHandlerResult>,
) {
  let start = Date.now();
  console.log(`➡️ ${label}`);
  await cb();
  console.log(`⬅️ ${label} (${Date.now() - start}ms)`);
}

export const unstable_instrumentations = [logging];
```

### OpenTelemetry Integration

```tsx
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

const otel: unstable_ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      request: (fn, { request }) =>
        otelSpan(`request`, { url: request.url }, fn),
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn, { unstable_pattern }) =>
        otelSpan(
          "middleware",
          { routeId: id, pattern: unstable_pattern },
          fn,
        ),
      loader: (fn, { unstable_pattern }) =>
        otelSpan(
          "loader",
          { routeId: id, pattern: unstable_pattern },
          fn,
        ),
      action: (fn, { unstable_pattern }) =>
        otelSpan(
          "action",
          { routeId: id, pattern: unstable_pattern },
          fn,
        ),
    });
  },
};

async function otelSpan(
  label: string,
  attributes: Record<string, string>,
  cb: () => Promise<unstable_InstrumentationHandlerResult>,
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

export const unstable_instrumentations = [otel];
```

### Client-side Performance Tracking

```tsx
const windowPerf: unstable_ClientInstrumentation = {
  router({ instrument }) {
    instrument({
      navigate: (fn, { to, currentUrl }) =>
        measure(`navigation:${currentUrl}->${to}`, fn),
      fetch: (fn, { href }) =>
        measure(`fetcher:${href}`, fn),
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
  cb: () => Promise<unstable_InstrumentationHandlerResult>,
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

<HydratedRouter unstable_instrumentations={[windowPerf]} />;
```
