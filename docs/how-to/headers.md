---
title: HTTP Headers
---

# HTTP Headers

Headers are primarily defined with the route module `headers` export. You can also set headers in `entry.server.tsx`.

## From Route Modules

```tsx filename=some-route.tsx
import { Route } from "./+types/some-route";

export function headers(_: Route.HeadersArgs) {
  return {
    "Content-Security-Policy": "default-src 'self'",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "max-age=3600, s-maxage=86400",
  };
}
```

You can return either a [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) instance or `HeadersInit`.

## From loaders and actions

When the header is dependent on loader data, loaders and actions can also set headers.

### 1. Wrap your return value in `data`

```tsx lines=[1,8]
import { data } from "react-router";

export async function loader({ params }: LoaderArgs) {
  let [page, ms] = await fakeTimeCall(
    await getPage(params.id)
  );

  return data(page, {
    headers: {
      "Server-Timing": `page;dur=${ms};desc="Page query"`,
    },
  });
}
```

### 2. Return from `headers` export

Headers from loaders and actions are not sent automatically. You must explicitly return them from the `headers` export.

```tsx
export function headers({
  actionHeaders,
  loaderHeaders,
}: HeadersArgs) {
  return actionHeaders ? actionHeaders : loaderHeaders;
}
```

One notable exception is `Set-Cookie` headers, which are automatically preserved from `headers`, `loader`, and `action` in parent routes, even without exporting `headers` from the child route.

## Merging with parent headers

Consider these nested routes

```ts filename=routes.ts
route("pages", "pages-layout-with-nav.tsx", [
  route(":slug", "page.tsx"),
]);
```

If both route modules want to set headers, the headers from the deepest matching route will be sent.

When you need to keep both the parent and the child headers, you need to merge them in the child route.

### Appending

The easiest way is to simply append to the parent headers. This avoids overwriting a header the parent may have set and both are important.

```tsx
export function headers({ parentHeaders }: HeadersArgs) {
  parentHeaders.append(
    "Permissions-Policy: geolocation=()"
  );
  return parentHeaders;
}
```

### Setting

Sometimes it's important to overwrite the parent header. Do this with `set` instead of `append`:

```tsx
export function headers({ parentHeaders }: HeadersArgs) {
  parentHeaders.set(
    "Cache-Control",
    "max-age=3600, s-maxage=86400"
  );
  return parentHeaders;
}
```

You can avoid the need to merge headers by only defining headers in "leaf routes" (index routes and child routes without children) and not in parent routes.

## From `entry.server.tsx`

The `handleRequest` export receives the headers from the route module as an argument. You can append global headers here.

```tsx
export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
  loadContext
) {
  // set, append global headers
  responseHeaders.set(
    "X-App-Version",
    routerContext.manifest.version
  );

  return new Response(await getStream(), {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
```

If you don't have an `entry.server.tsx` run the `reveal` command:

```shellscript nonumber
react-router reveal
```
