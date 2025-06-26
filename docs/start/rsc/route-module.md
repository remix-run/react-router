---
title: Route Module
order: 3
---

# Route Module

[MODES: framework]

## Introduction

The files referenced by your route object's `lazy()` are called Route Modules.

```tsx filename=app/routes.ts
{
  path: "teams/:teamId",
  lazy: () => import("./team"),
  //    route module ^^^^^^^^
}
```

Route modules are the recommended way to author your server first routes, they define:

- automatic code-splitting
- data loading
- actions
- revalidation
- error boundaries
- and more

This guide is a quick overview of every route module feature. The rest of the getting started guides will cover these features in more detail.

## Component (`default`)

The `default` export in a route module defines the component that will render when the route matches.

```tsx filename=app/routes/my-route.tsx
export default function MyRouteComponent() {
  return (
    <div>
      <h1>Look ma!</h1>
      <p>
        I'm still using React Router after like 10 years.
      </p>
    </div>
  );
}
```

You can also export it as `Component` if that's your think.

### Props passed to the Component

When the component is rendered, it is provided the props defined in `Route.ComponentProps` that React Router will automatically generate for you. These props include:

1. `loaderData`: The data returned from the `loader` function in this route module
2. `actionData`: The data returned from the `action` function in this route module
3. `params`: An object containing the route parameters (if any).
4. `matches`: An array of all the matches in the current route tree.

You can use these props in place of hooks like `useLoaderData` or `useParams`.

## `loader`

Route loaders provide data to route components before they are rendered. They are only called on the server when server rendering or during the build with pre-rendering.

```tsx
export async function loader() {
  return { message: "Hello, world!" };
}

export default function MyRoute({ loaderData }) {
  return <h1>{loaderData.message}</h1>;
}
```

See also:

- [`loader` params][loader-params]

## `clientLoader`

Called only in the browser, route client loaders provide data to route components in addition to, or in place of, route loaders.

```tsx
"use client";

export async function clientLoader({ serverLoader }) {
  // call the server loader
  const serverData = await serverLoader();
  // And/or fetch data on the client
  const data = getDataFromClient();
  // Return the data to expose through useLoaderData()
  return data;
}
```

Client loaders can participate in initial page load hydration of server rendered pages by setting the `hydrate` property on the function:

```tsx
"use client";

export async function clientLoader() {
  // ...
}
clientLoader.hydrate = true as const;
```

Client loaders must be defined in a client (`"use client"`) scope. You can re-export them from your server route module.

```ts
export { clientLoader } from "./route.client";
// ...
```

See also:

- [`clientLoader` params][client-loader-params]

## `action`

Route actions allow server-side data mutations with automatic revalidation of all loader data on the page when called from `<Form>`, `useFetcher`, and `useSubmit`.

```tsx
// route("/list", "./list.tsx")
import { Form } from "react-router";
import { TodoList } from "~/components/TodoList";

// this data will be loaded after the action completes...
export async function loader() {
  const items = await fakeDb.getItems();
  return { items };
}

// ...so that the list here is updated automatically
export default function Items({ loaderData }) {
  return (
    <div>
      <List items={loaderData.items} />
      <Form method="post" navigate={false} action="/list">
        <input type="text" name="title" />
        <button type="submit">Create Todo</button>
      </Form>
    </div>
  );
}

export async function action({ request }) {
  const data = await request.formData();
  const todo = await fakeDb.addItem({
    title: data.get("title"),
  });
  return { ok: true };
}
```

## `clientAction`

Like route actions but only called in the browser.

```tsx
export async function clientAction({ serverAction }) {
  fakeInvalidateClientSideCache();
  // can still call the server action if needed
  const data = await serverAction();
  return data;
}
```

Client actions must be defined in a client (`"use client"`) scope. You can re-export them from your server route module.

```ts
export { clientAction } from "./route.client";
// ...
```

See also:

- [`clientAction` params][client-action-params]

## `ErrorBoundary`

When other route module APIs throw, the route module `ErrorBoundary` will render instead of the route component. It is recommened that your error boundary is a client component so you have access to `useRouteError()`.

```tsx
"use client";

import {
  isRouteErrorResponse,
  useRouteError,
} from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
```

When defining the error boundary as a client component, you can re-export it from your server route module.

```ts
export { ErrorBoundary } from "./route.client";
// ...
```

## `HydrateFallback`

On initial page load, the route component renders only after the client loader is finished. If exported, a `HydrateFallback` can render immediately in place of the route component.

```tsx filename=routes/client-only-route.tsx
import { Game } from "./routes/client-only-route.client";
export { clientLoader } from "./routes/client-only-route.client";

export function HydrateFallback() {
  return <p>Loading Game...</p>;
}

export default function Component({ loaderData }) {
  return <Game data={loaderData} />;
}
```

```tsx filename=routes/client-only-route.client.tsx
"use client";

export async function clientLoader() {
  const data = await fakeLoadLocalGameData();
  return data;
}

export function Game({ data }) {
  // ...
}
```

## `headers`

Route headers define HTTP headers to be sent with the response when server rendering.

```tsx
export function headers() {
  return {
    "X-Stretchy-Pants": "its for fun",
    "Cache-Control": "max-age=300, s-maxage=3600",
  };
}
```

## `handle`

Route handle allows apps to add anything to a route match in `useMatches` to create abstractions (like breadcrumbs, etc.).

```tsx
export const handle = {
  its: "all yours",
};
```

## `links`

Since React 19, [using the built-in `<link>` element](https://react.dev/reference/react-dom/components/link) is recommended over the use of the route module's `links` export.

```tsx
export default function MyRoute() {
  return (
    <div>
      <link rel="icon" href="favicon.ico" />
      {/* The rest of your route content... */}
    </div>
  );
}
```

## `meta`

Since React 19, [using the built-in `<meta>` element](https://react.dev/reference/react-dom/components/meta) is recommended over the use of the route module's `meta` export.

Here is an example of how to use it and the `<title>` element:

```tsx
export default function MyRoute() {
  return (
    <div>
      <title>Very cool app</title>
      <meta property="og:title" content="Very cool app" />
      <meta
        name="description"
        content="This app is the best"
      />
      {/* The rest of your route content... */}
    </div>
  );
}
```

## `shouldRevalidate`

In framework mode, route loaders are automatically revalidated after all navigations and form submissions (this is different from [Data Mode](../data/route-object#shouldrevalidate)). This enables middleware and loaders to share a request context and optimize in different ways than then they would be in Data Mode.

Defining this function allows you to opt out of revalidation for a route loader for navigations and form submissions.

```tsx
"use client";

import type { ShouldRevalidateFunctionArgs } from "react-router";

export function shouldRevalidate(
  arg: ShouldRevalidateFunctionArgs
) {
  return true;
}
```

Should revalidate functions must be defined in a client (`"use client"`) scope. You can re-export them from your server route module.

```ts
export { shouldRevalidate } from "./route.client";
// ...
```

[`ShouldRevalidateFunctionArgs` Reference Documentation ↗](https://api.reactrouter.com/v7/interfaces/react_router.ShouldRevalidateFunctionArgs.html)

---

Next: [Rendering Strategies](./rendering)

[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[loader-params]: https://api.reactrouter.com/v7/interfaces/react_router.LoaderFunctionArgs
[client-loader-params]: https://api.reactrouter.com/v7/types/react_router.ClientLoaderFunctionArgs
[action-params]: https://api.reactrouter.com/v7/interfaces/react_router.ActionFunctionArgs
[client-action-params]: https://api.reactrouter.com/v7/types/react_router.ClientActionFunctionArgs
[error-boundaries]: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
[use-route-error]: https://api.reactrouter.com/v7/functions/react_router.useRouteError
[is-route-error-response]: https://api.reactrouter.com/v7/functions/react_router.isRouteErrorResponse
[cache-control-header]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
[headers]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[use-matches]: https://api.reactrouter.com/v7/functions/react_router.useMatches
[link-element]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
[meta-element]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
[meta-params]: https://api.reactrouter.com/v7/interfaces/react_router.MetaArgs
[use-revalidator]: https://api.reactrouter.com/v7/functions/react_router.useRevalidator.html
