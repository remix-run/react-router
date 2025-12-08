---
title: Route Module
order: 3
---

# Route Module

[MODES: framework]

## Introduction

The files referenced in `routes.ts` are called Route Modules.

```tsx filename=app/routes.ts
route("teams/:teamId", "./team.tsx"),
//           route module ^^^^^^^^
```

Route modules are the foundation of React Router's framework features, they define:

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

### Props passed to the Component

When the component is rendered, it is provided the props defined in `Route.ComponentProps` that React Router will automatically generate for you. These props include:

1. `loaderData`: The data returned from the `loader` function in this route module
2. `actionData`: The data returned from the `action` function in this route module
3. `params`: An object containing the route parameters (if any).
4. `matches`: An array of all the matches in the current route tree.

You can use these props in place of hooks like `useLoaderData` or `useParams`. This may be preferable because they will be automatically typed correctly for the route.

### Using props

```tsx filename=app/routes/my-route-with-default-params.tsx
import type { Route } from "./+types/route-name";

export default function MyRouteComponent({
  loaderData,
  actionData,
  params,
  matches,
}: Route.ComponentProps) {
  return (
    <div>
      <h1>Welcome to My Route with Props!</h1>
      <p>Loader Data: {JSON.stringify(loaderData)}</p>
      <p>Action Data: {JSON.stringify(actionData)}</p>
      <p>Route Parameters: {JSON.stringify(params)}</p>
      <p>Matched Routes: {JSON.stringify(matches)}</p>
    </div>
  );
}
```

## `middleware`

Route [middleware][middleware] runs sequentially on the server before and after document and
data requests. This gives you a singular place to do things like logging,
authentication, and post-processing of responses. The `next` function continues down the chain, and on the leaf route the `next` function executes the loaders/actions for the navigation.

Here's an example middleware to log requests on the server:

```tsx filename=root.tsx
async function loggingMiddleware(
  { request, context },
  next,
) {
  console.log(
    `${new Date().toISOString()} ${request.method} ${request.url}`,
  );
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;
  console.log(
    `${new Date().toISOString()} Response ${response.status} (${duration}ms)`,
  );
  return response;
}

export const middleware = [loggingMiddleware];
```

Here's an example middleware to check for logged in users and set the user in
`context` you can then access from loaders:

```tsx filename=routes/_auth.tsx
async function authMiddleware({ request, context }) {
  const session = await getSession(request);
  const userId = session.get("userId");

  if (!userId) {
    throw redirect("/login");
  }

  const user = await getUserById(userId);
  context.set(userContext, user);
}

export const middleware = [authMiddleware];
```

<docs-warning>Please make sure you understand [when middleware runs][when-middleware-runs] to make sure your application will behave the way you intend when adding middleware to your routes.</docs-warning>

See also:

- [`middleware` params][middleware-params]
- [Middleware][middleware]

## `clientMiddleware`

This is the client-side equivalent of `middleware` and runs in the browser during client navigations. The only difference from server middleware is that client middleware doesn't return Responses because they're not wrapping an HTTP request on the server.

Here's an example middleware to log requests on the client:

```tsx filename=root.tsx
async function loggingMiddleware(
  { request, context },
  next,
) {
  console.log(
    `${new Date().toISOString()} ${request.method} ${request.url}`,
  );
  const start = performance.now();
  await next(); // 👈 No Response returned
  const duration = performance.now() - start;
  console.log(
    `${new Date().toISOString()} (${duration}ms)`,
  );
  // ✅ No need to return anything
}

export const clientMiddleware = [loggingMiddleware];
```

See also:

- [Middleware][middleware]
- [Client Data][client-data]

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
export async function clientLoader() {
  // ...
}
clientLoader.hydrate = true as const;
```

<docs-info>

By using `as const`, TypeScript will infer that the type for `clientLoader.hydrate` is `true` instead of `boolean`.
That way, React Router can derive types for `loaderData` based on the value of `clientLoader.hydrate`.

</docs-info>

See also:

- [`clientLoader` params][client-loader-params]
- [Client Data][client-data]

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

See also:

- [`action` params][action-params]

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

See also:

- [`clientAction` params][client-action-params]
- [Client Data][client-data]

## `ErrorBoundary`

When other route module APIs throw, the route module `ErrorBoundary` will render instead of the route component.

```tsx
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

See also:

- [`useRouteError`][use-route-error]
- [`isRouteErrorResponse`][is-route-error-response]

## `HydrateFallback`

On initial page load, the route component renders only after the client loader is finished. If exported, a `HydrateFallback` can render immediately in place of the route component.

```tsx filename=routes/client-only-route.tsx
export async function clientLoader() {
  const data = await fakeLoadLocalGameData();
  return data;
}

export function HydrateFallback() {
  return <p>Loading Game...</p>;
}

export default function Component({ loaderData }) {
  return <Game data={loaderData} />;
}
```

## `headers`

The route `headers` function defines the HTTP headers to be sent with the response when server rendering.

```tsx
export function headers() {
  return {
    "X-Stretchy-Pants": "its for fun",
    "Cache-Control": "max-age=300, s-maxage=3600",
  };
}
```

See also:

- [`Headers`][headers]

## `handle`

Route handle allows apps to add anything to a route match in `useMatches` to create abstractions (like breadcrumbs, etc.).

```tsx
export const handle = {
  its: "all yours",
};
```

See also:

- [`useMatches`][use-matches]

## `links`

Route links define [`<link>` element][link-element]s to be rendered in the document `<head>`.

```tsx
export function links() {
  return [
    {
      rel: "icon",
      href: "/favicon.png",
      type: "image/png",
    },
    {
      rel: "stylesheet",
      href: "https://example.com/some/styles.css",
    },
    {
      rel: "preload",
      href: "/images/banner.jpg",
      as: "image",
    },
  ];
}
```

All routes links will be aggregated and rendered through the `<Links />` component, usually rendered in your app root:

```tsx
import { Links } from "react-router";

export default function Root() {
  return (
    <html>
      <head>
        <Links />
      </head>

      <body />
    </html>
  );
}
```

## `meta`

Route meta defines [meta tags][meta-element] to be rendered in the `<Meta />` component, usually placed in the `<head>`.

<docs-warning>

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

</docs-warning>

```tsx filename=app/product.tsx
export function meta() {
  return [
    { title: "Very cool app" },
    {
      property: "og:title",
      content: "Very cool app",
    },
    {
      name: "description",
      content: "This app is the best",
    },
  ];
}
```

```tsx filename=app/root.tsx
import { Meta } from "react-router";

export default function Root() {
  return (
    <html>
      <head>
        <Meta />
      </head>

      <body />
    </html>
  );
}
```

The meta of the last matching route is used, allowing you to override parent routes' meta. It's important to note that the entire meta descriptor array is replaced, not merged. This gives you the flexibility to build your own meta composition logic across pages at different levels.

**See also**

- [`meta` params][meta-params]
- [`meta` function return types][meta-function]

## `shouldRevalidate`

In framework mode with SSR, route loaders are automatically revalidated after all navigations and form submissions (this is different from [Data Mode][data-mode-should-revalidate]). This enables middleware and loaders to share a request context and optimize in different ways than they would in Data Mode.

Defining this function allows you to opt out of revalidation for a route loader for navigations and form submissions.

```tsx
import type { ShouldRevalidateFunctionArgs } from "react-router";

export function shouldRevalidate(
  arg: ShouldRevalidateFunctionArgs,
) {
  return true;
}
```

When using [SPA Mode][spa-mode], there are no server loaders to call on navigations, so `shouldRevalidate` behaves the same as it does in [Data Mode][data-mode-should-revalidate].

[`ShouldRevalidateFunctionArgs` Reference Documentation ↗](https://api.reactrouter.com/v7/interfaces/react_router.ShouldRevalidateFunctionArgs.html)

---

Next: [Rendering Strategies](./rendering)

[middleware-params]: https://api.reactrouter.com/v7/types/react_router.MiddlewareFunction.html
[middleware]: ../../how-to/middleware
[when-middleware-runs]: ../../how-to/middleware#when-middleware-runs
[loader-params]: https://api.reactrouter.com/v7/interfaces/react_router.LoaderFunctionArgs
[client-loader-params]: https://api.reactrouter.com/v7/types/react_router.ClientLoaderFunctionArgs
[action-params]: https://api.reactrouter.com/v7/interfaces/react_router.ActionFunctionArgs
[client-action-params]: https://api.reactrouter.com/v7/types/react_router.ClientActionFunctionArgs
[use-route-error]: ../../api/hooks/useRouteError
[is-route-error-response]: ../../api/utils/isRouteErrorResponse
[headers]: https://developer.mozilla.org/en-US/docs/Web/API/Response/headers
[use-matches]: ../../api/hooks/useMatches
[link-element]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
[meta-element]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
[meta-params]: https://api.reactrouter.com/v7/interfaces/react_router.MetaArgs
[meta-function]: https://api.reactrouter.com/v7/types/react_router.MetaDescriptor.html
[data-mode-should-revalidate]: ../data/route-object#shouldrevalidate
[spa-mode]: ../../how-to/spa
[client-data]: ../../how-to/client-data
