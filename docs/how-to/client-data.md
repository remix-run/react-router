---
title: Client Data
---

# Client Data

You can fetch and mutate data directly in the browser using `clientLoader` and `clientAction` functions.

These functions are the primary mechanism for data handling when using [SPA mode][spa]. This guide demonstrates common use cases for leveraging client data in Server-Side Rendering (SSR).

## Skip the Server Hop

When using React Router with a Backend-For-Frontend (BFF) architecture, you might want to bypass the React Router server and communicate directly with your backend API. This approach requires proper authentication handling and assumes no CORS restrictions. Here's how to implement this:

1. Load the data from server `loader` on the document load
2. Load the data from the `clientLoader` on all subsequent loads

In this scenario, React Router will _not_ call the `clientLoader` on hydration - and will only call it on subsequent navigations.

```tsx lines=[4,11]
export async function loader({
  request,
}: Route.LoaderArgs) {
  const data = await fetchApiFromServer({ request }); // (1)
  return data;
}

export async function clientLoader({
  request,
}: Route.ClientLoaderArgs) {
  const data = await fetchApiFromClient({ request }); // (2)
  return data;
}
```

## Fullstack State

Sometimes you need to combine data from both the server and browser (like IndexedDB or browser SDKs) before rendering a component. Here's how to implement this pattern:

1. Load the partial data from server `loader` on the document load
2. Export a [`HydrateFallback`][hydratefallback] component to render during SSR because we don't yet have a full set of data
3. Set `clientLoader.hydrate = true`, this instructs React Router to call the clientLoader as part of initial document hydration
4. Combine the server data with the client data in `clientLoader`

```tsx lines=[4-6,19-20,23,26]
export async function loader({
  request,
}: Route.LoaderArgs) {
  const partialData = await getPartialDataFromDb({
    request,
  }); // (1)
  return partialData;
}

export async function clientLoader({
  request,
  serverLoader,
}: Route.ClientLoaderArgs) {
  const [serverData, clientData] = await Promise.all([
    serverLoader(),
    getClientData(request),
  ]);
  return {
    ...serverData, // (4)
    ...clientData, // (4)
  };
}
clientLoader.hydrate = true as const; // (3)

export function HydrateFallback() {
  return <p>Skeleton rendered during SSR</p>; // (2)
}

export default function Component({
  // This will always be the combined set of server + client data
  loaderData,
}: Route.ComponentProps) {
  return <>...</>;
}
```

## Choosing Server or Client Data Loading

You can mix data loading strategies across your application, choosing between server-only or client-only data loading for each route. Here's how to implement both approaches:

1. Export a `loader` when you want to use server data
2. Export `clientLoader` and a `HydrateFallback` when you want to use client data

A route that only depends on a server loader looks like this:

```tsx filename=app/routes/server-data-route.tsx
export async function loader({
  request,
}: Route.LoaderArgs) {
  const data = await getServerData(request);
  return data;
}

export default function Component({
  loaderData, // (1) - server data
}: Route.ComponentProps) {
  return <>...</>;
}
```

A route that only depends on a client loader looks like this.

```tsx filename=app/routes/client-data-route.tsx
export async function clientLoader({
  request,
}: Route.ClientLoaderArgs) {
  const clientData = await getClientData(request);
  return clientData;
}
// Note: you do not have to set this explicitly - it is implied if there is no `loader`
clientLoader.hydrate = true;

// (2)
export function HydrateFallback() {
  return <p>Skeleton rendered during SSR</p>;
}

export default function Component({
  loaderData, // (2) - client data
}: Route.ComponentProps) {
  return <>...</>;
}
```

## Client-Side Caching

You can implement client-side caching (using memory, localStorage, etc.) to optimize server requests. Here's a pattern that demonstrates cache management:

1. Load the data from server `loader` on the document load
2. Set `clientLoader.hydrate = true` to prime the cache
3. Load subsequent navigations from the cache via `clientLoader`
4. Invalidate the cache in your `clientAction`

Note that since we are not exporting a `HydrateFallback` component, we will SSR the route component and then run the `clientLoader` on hydration, so it's important that your `loader` and `clientLoader` return the same data on initial load to avoid hydration errors.

```tsx lines=[4,26,32,39,46]
export async function loader({
  request,
}: Route.LoaderArgs) {
  const data = await getDataFromDb({ request }); // (1)
  return data;
}

export async function action({
  request,
}: Route.ActionArgs) {
  await saveDataToDb({ request });
  return { ok: true };
}

let isInitialRequest = true;

export async function clientLoader({
  request,
  serverLoader,
}: Route.ClientLoaderArgs) {
  const cacheKey = generateKey(request);

  if (isInitialRequest) {
    isInitialRequest = false;
    const serverData = await serverLoader();
    cache.set(cacheKey, serverData); // (2)
    return serverData;
  }

  const cachedData = await cache.get(cacheKey);
  if (cachedData) {
    return cachedData; // (3)
  }

  const serverData = await serverLoader();
  cache.set(cacheKey, serverData);
  return serverData;
}
clientLoader.hydrate = true; // (2)

export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  const cacheKey = generateKey(request);
  cache.delete(cacheKey); // (4)
  const serverData = await serverAction();
  return serverData;
}
```

[spa]: ../how-to/spa
[hydratefallback]: ../start/framework/route-module#hydratefallback
