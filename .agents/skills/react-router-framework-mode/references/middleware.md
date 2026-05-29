---
title: Middleware & Context API
description: Server and client middleware, context API for sharing data
tags: [middleware, context, authentication, logging, request-processing]
requires: [react-router@7.9.0+, v8_middleware: true]
---

# Middleware & Context API

## ⚠️ Version Requirements - Check First!

**Before implementing middleware, verify your React Router version:**

```bash
npm list react-router
```

| Feature    | Minimum Version | Config Flag Required  |
| ---------- | --------------- | --------------------- |
| Middleware | 7.9.0+          | `v8_middleware: true` |

**If your version is below 7.9.0:**

- Middleware is not available
- Use loaders/actions for request processing instead
- Or upgrade: `npm install react-router@latest`

### Enabling Middleware

```ts
// react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_middleware: true, // Required for middleware
  },
} satisfies Config;
```

See https://reactrouter.com/how-to/middleware#changes-to-getloadcontextapploadcontext for migration instructions.

## Overview

Middleware runs code before and after response generation. Executes in a nested chain: parent → child on the way down, child → parent on the way up.

```
Root middleware start
  Parent middleware start
    Child middleware start
      → Run loaders, generate Response
    Child middleware end
  Parent middleware end
Root middleware end
```

## Basic Middleware

```tsx
import type { Route } from "./+types/dashboard";
import { redirect } from "react-router";

async function authMiddleware({ request, context }: Route.MiddlewareArgs) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect("/login");
  }
  context.set(userContext, user);
}

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];
```

### The `next` Function

Call `next()` to continue the chain and get the response:

```tsx
async function loggingMiddleware(
  { request }: Route.MiddlewareArgs,
  next: Route.MiddlewareNext,
) {
  console.log(`→ ${request.method} ${request.url}`);

  const response = await next();

  console.log(`← ${response.status}`);
  return response;
}
```

- Call `next()` only once
- If you don't need post-processing, skip calling `next()` (called automatically)
- `next()` never throws—errors return as error responses

## Context API

Create typed context to share data between middleware and loaders/actions:

```tsx
// app/context.ts
import { createContext } from "react-router";

export const userContext = createContext<User | null>(null);
export const dbContext = createContext<Database>();
```

### Setting Context in Middleware

```tsx
import { userContext } from "~/context";

async function authMiddleware({ request, context }: Route.MiddlewareArgs) {
  const user = await getUser(request);
  context.set(userContext, user);
}

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];
```

### Reading Context in Loaders/Actions

```tsx
import { userContext } from "~/context";

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return { profile: await getProfile(user) };
}

export async function action({ context }: Route.ActionArgs) {
  const user = context.get(userContext);
  // user is available here too
}
```

## Server vs Client Middleware

**Server middleware** (`middleware`) runs on document requests and `.data` fetches:

```tsx
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    // Runs on server
    const response = await next();
    return response;
  },
];
```

**Client middleware** (`clientMiddleware`) runs on client-side navigations:

```tsx
export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  async ({ context }, next) => {
    // Runs in browser
    const start = performance.now();
    await next();
    console.log(`Navigation: ${performance.now() - start}ms`);
  },
];
```

## When Server Middleware Runs

| Request Type                     | Middleware Runs?      |
| -------------------------------- | --------------------- |
| Document request (`GET /route`)  | Always                |
| Client navigation with loader    | Yes (`.data` request) |
| Client navigation without loader | No                    |

To force middleware on routes without loaders, add an empty loader:

```tsx
export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function loader() {
  return null;
}
```

## Common Patterns

### Authentication

```tsx
async function authMiddleware({ request, context }: Route.MiddlewareArgs) {
  const session = await getSession(request);
  if (!session.get("userId")) {
    throw redirect("/login");
  }
  context.set(userContext, await getUserById(session.get("userId")));
}
```

### Request Logging

```tsx
async function loggingMiddleware(
  { request }: Route.MiddlewareArgs,
  next: Route.MiddlewareNext,
) {
  const id = crypto.randomUUID();
  const start = performance.now();

  console.log(`[${id}] ${request.method} ${request.url}`);
  const response = await next();
  console.log(`[${id}] ${response.status} (${performance.now() - start}ms)`);

  return response;
}
```

### Response Headers

```tsx
async function securityHeaders(
  _: Route.MiddlewareArgs,
  next: Route.MiddlewareNext,
) {
  const response = await next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
```

### 404 Fallback

```tsx
async function cmsFallback(
  { request }: Route.MiddlewareArgs,
  next: Route.MiddlewareNext,
) {
  const response = await next();

  if (response.status === 404) {
    const redirect = await checkCmsRedirects(request.url);
    if (redirect) throw redirect(redirect, 302);
  }

  return response;
}
```

### Conditional Execution

```tsx
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    if (request.method === "POST") {
      await requireAuth(request, context);
    }
    return next();
  },
];
```

## Error Handling

Errors bubble to the nearest `ErrorBoundary`. The `next()` function always returns a response (never throws):

```tsx
export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    const response = await next();
    // response.status = 500 if child threw
    // Can still set headers, commit sessions, etc.
    return response;
  },
];
```

- Error **before** `next()`: Bubbles to highest route with a loader
- Error **after** `next()`: Bubbles from the throwing route

## See Also

- [React Router Middleware Documentation](https://reactrouter.com/how-to/middleware)
