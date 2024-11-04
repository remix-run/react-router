---
title: Route Module
---

# Route Module

The following can be exported from a route module to handle the behavior of that route:

## Component (`default`)

The default export of a route module defines the component that will render when the route matches.

```tsx filename=app/routes/my-route.tsx
export default function MyRouteComponent() {
  return (
    <div>
      <h1>Look ma!</h1>
      <p>
        I'm still using React Router after like 8 years.
      </p>
    </div>
  );
}
```

## `loader`

Each route can define a `loader` function that provides data to the route when rendering.

```tsx
export async function loader() {
  return { message: "Hello, world!" };
}
```

This function is only ever run on the server. On the initial server render, it will provide data to the HTML document. On navigations in the browser, React Router will call the function via [`fetch`][fetch] from the browser.

This means you can talk directly to your database, use server-only API secrets, etc. Any code that isn't used to render the UI will be removed from the browser bundle.

<docs-error>
Note that whatever you return from your `loader` will be exposed to the client, even if the component doesn't render it. Treat your `loader`s with the same care as public API endpoints.
</docs-error>

See also:

- [`loader` params][loader-params]

## `clientLoader`

In addition to (or in place of) your `loader`, you may export a `clientLoader` function that will execute on the client.

Each route can define a `clientLoader` function that provides data to the route when rendering:

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

By default, `clientLoader` **will not** execute for the route during hydration of your React Router app on the initial SSR document request. This is for the primary (and simpler) use-case where the `clientLoader` does not change the shape of the server `loader` data and is just an optimization on subsequent client side navigations (to read from a cache or hit an API directly).

If you need to run your `clientLoader` during hydration on the initial document request, you can opt-in by setting `clientLoader.hydrate=true`. This will tell React Router that it needs to run the `clientLoader` on hydration. Without a `HydrateFallback`, your route component will be SSR'd with the server `loader` data - and then `clientLoader` will run and the returned data will be updated in-place in the hydrated route Component.

<docs-info>If a route exports a `clientLoader` and does not export a server `loader`, then `clientLoader.hydrate` is automatically treated as `true` since there is no server data to SSR with. Therefore, we always need to run the `clientLoader` on hydration before rendering the route component.</docs-info>

See also:

- [`clientLoader` params][client-loader-params]

## `action`

A route `action` is a server only function to handle data mutations and other actions. If a non-`GET` request is made to your route (`DELETE`, `PATCH`, `POST`, or `PUT`) then the action is called before the `loader`s.

`action`s have the same API as `loader`s, the only difference is when they are called. This enables you to co-locate everything about a data set in a single route module: the data read, the component that renders the data, and the data writes:

```tsx
import { redirect, Form } from "react-router";

import { TodoList } from "~/components/TodoList";
import { fakeCreateTodo, fakeGetTodos } from "~/utils/db";

export async function action({ request }) {
  const body = await request.formData();
  const todo = await fakeCreateTodo({
    title: body.get("title"),
  });
  return redirect(`/todos/${todo.id}`);
}

export async function loader() {
  const todos = await fakeGetTodos();
  return { todos };
}

export default function Todos({ loaderData }) {
  return (
    <div>
      <TodoList todos={loaderData.todos} />
      <Form method="post">
        <input type="text" name="title" />
        <button type="submit">Create Todo</button>
      </Form>
    </div>
  );
}
```

When a `POST` is made to a URL, multiple routes in your route hierarchy will match the URL. Unlike a `GET` to loaders, where all of them are called to build the UI, _only one action is called_.

<docs-info>The route called will be the deepest matching route, unless the deepest matching route is an "index route". In this case, it will post to the parent route of the index (because they share the same URL, the parent wins).</docs-info>

If you want to post to an index route use `?index` in the action: `<Form action="/accounts?index" method="post" />`

| action url        | route action                     |
| ----------------- | -------------------------------- |
| `/accounts?index` | `app/routes/accounts._index.tsx` |
| `/accounts`       | `app/routes/accounts.tsx`        |

Also note that forms without an action prop (`<Form method="post">`) will automatically post to the same route within which they are rendered, so using the `?index` param to disambiguate between parent and index routes is only useful if you're posting to an index route from somewhere besides the index route itself. If you're posting from the index route to itself, or from the parent route to itself, you don't need to define a `<Form action>` at all, just omit it: `<Form method="post">`.

See also:

- [`action` params][action-params]

## `clientAction`

In addition to (or in place of) your `action`, you may define a `clientAction` function that will execute on the client.

Each route can define a `clientAction` function that handles mutations:

```tsx
export async function clientAction({ serverAction }) {
  invalidateClientSideCache();
  const data = await serverAction();
  return data;
}
```

This function is only ever run on the client, and can be used in a few ways:

- Instead of a server `action` for full-client routes
- To use alongside a `clientLoader` cache by invalidating the cache on mutations
- To facilitate a migration from React Router

See also:

- [`clientAction` params][client-action-params]

## `ErrorBoundary`

A React Router `ErrorBoundary` component works just like normal React [error boundaries][error-boundaries], but with a few extra capabilities. When there is an error in your route component, the `ErrorBoundary` will be rendered in its place, nested inside any parent routes. `ErrorBoundary` components also render when there is an error in the `loader` or `action` functions for a route, so all errors for that route may be handled in one spot.

The most common use-cases tend to be:

- You may intentionally throw a 4xx `Response` to trigger an error UI
  - Throwing a 400 on bad user input
  - Throwing a 401 for unauthorized access
  - Throwing a 404 when you can't find requested data
- React may unintentionally throw an `Error` if it encounters a runtime error during rendering

To obtain the thrown object, you can use the [`useRouteError`][use-route-error] hook. When a `Response` is thrown, it will be automatically unwrapped into an `ErrorResponse` instance with `state`/`statusText`/`data` fields so that you don't need to bother with `await response.json()` in your component. To differentiate thrown `Response`'s from thrown `Error`'s you can use the [`isRouteErrorResponse`][is-route-error-response] utility.

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

## `HydrateFallback`

A `HydrateFallback` component is your way of informing React Router that you do not want to render your route component until _after_ the `clientLoader` has run on hydration. When exported, React Router will render the fallback during SSR instead of your default route component, and will render your route component client-side once the `clientLoader` completes.

The most common use-cases for this are client-only routes (such an in-browser canvas game) and augmenting your server data with client-side data (such as saved user preferences).

```tsx filename=routes/client-only-route.tsx
export async function clientLoader() {
  const data = await loadSavedGameOrPrepareNewGame();
  return data;
}
// Note clientLoader.hydrate is implied without a server loader

export function HydrateFallback() {
  return <p>Loading Game...</p>;
}

export default function Component({ loaderData }) {
  return <Game data={loaderData} />;
}
```

```tsx filename=routes/augmenting-server-data.tsx
export async function loader() {
  const data = getServerData();
  return data;
}

export async function clientLoader({ serverLoader }) {
  const [serverData, preferences] = await Promise.all([
    serverLoader(),
    getUserPreferences(),
  ]);
  return {
    ...serverData,
    preferences,
  };
}
clientLoader.hydrate = true;

export function HydrateFallback() {
  return <p>Loading user preferences...</p>;
}

export default function Component({ loaderData }) {
  if (loaderData.preferences.display === "list") {
    return <ListView items={loaderData.items} />;
  } else {
    return <GridView items={loaderData.items} />;
  }
}
```

There are a few nuances worth noting around the behavior of `HydrateFallback`:

- It is only relevant on initial document request and hydration, and will not be rendered on any subsequent client-side navigations
- It is only relevant when you are also setting [`clientLoader.hydrate=true`][hydrate-true] on a given route
- It is also relevant if you do have a `clientLoader` without a server `loader`, as this implies `clientLoader.hydrate=true` since there is otherwise no loader data at all to return from `useLoaderData`
  - Even if you do not specify a `HydrateFallback` in this case, React Router will not render your route component and will bubble up to any ancestor `HydrateFallback` component
  - This is to ensure that `useLoaderData` remains "happy-path"
  - Without a server `loader`, `useLoaderData` would return `undefined` in any rendered route components
- You cannot render an `<Outlet/>` in a `HydrateFallback` because children routes can't be guaranteed to operate correctly since their ancestor loader data may not yet be available if they are running `clientLoader` functions on hydration (i.e., use cases such as `useRouteLoaderData()` or `useMatches()`)

## `headers`

Each route can define its own HTTP headers. One of the common headers is the [`Cache-Control` header][cache-control-header] that indicates to browser and CDN caches where and for how long a page is able to be cached.

```tsx
export function headers({
  actionHeaders,
  errorHeaders,
  loaderHeaders,
  parentHeaders,
}) {
  return {
    "X-Stretchy-Pants": "its for fun",
    "Cache-Control": "max-age=300, s-maxage=3600",
});
```

Usually your data is a better indicator of your cache duration than your route module (data tends to be more dynamic than markup), so the `action`'s & `loader`'s headers are passed in to `headers()` too:

```tsx
export function headers({ loaderHeaders }) {
  return {
    "Cache-Control": loaderHeaders.get("Cache-Control"),
  };
}
```

<docs-info>Note: `actionHeaders` & `loaderHeaders` are an instance of the [Web Fetch API `Headers`][headers] class.</docs-info>

If an `action` or a `loader` threw a [`Response`][response] and we're rendering a boundary, any headers from the thrown `Response` will be available in `errorHeaders`. This allows you to access headers from a child loader that threw in a parent error boundary.

## `handle`

Exporting a handle allows you to create application conventions with the [`useMatches`][use-matches] hook. You can put whatever values you want on it:

```tsx
export const handle = {
  its: "all yours",
};
```

This is almost always used in conjunction with `useMatches`. To see what kinds of things you can do with it, refer to [`useMatches`][use-matches] for more information.

## `links`

The links function defines which [`<link>` element][link-element]s to add to the page when the user visits a route.

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
    { page: "/users/123" },
    {
      rel: "preload",
      href: "/images/banner.jpg",
      as: "image",
    },
  ];
}
```

There are two types of link descriptors you can return:

## `meta`

The `meta` export allows you to add metadata HTML tags for every route in your app. These tags are important for things like search engine optimization (SEO) and browser directives for determining certain behaviors. They can also be used by social media sites to display rich previews of your app.

The `meta` function should return an array of `MetaDescriptor` objects. These objects map one-to-one with HTML tags. So this meta function:

```tsx
export const meta: MetaFunction = () => {
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
};
```

produces this HTML:

```html
<title>Very cool app</title>
<meta property="og:title" content="Very cool app" />;
<meta name="description" content="This app is the best" />
```

By default, meta descriptors will render a [`<meta>` tag][meta-element] in most cases. The two exceptions are:

- `{ title }` renders a `<title>` tag
- `{ "script:ld+json" }` renders a `<script type="application/ld+json">` tag, and its value should be a serializable object that is stringified and injected into the tag.

```tsx
export function meta() {
  return [
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "React Router",
        url: "https://reactrouter.com",
      },
    },
  ];
}
```

A meta descriptor can also render a [`<link>` tag][link-element] by setting the `tagName` property to `"link"`. This is useful for `<link>` tags associated with SEO like `canonical` URLs. For asset links like stylesheets and favicons, you should use the [`links` export][links] instead.

```tsx
export function meta() {
  return [
    {
      tagName: "link",
      rel: "canonical",
      href: "https://remix.run",
    },
  ];
}
```

**See also**

- [`meta` params][meta-params]

## `shouldRevalidate`

This function lets apps optimize which routes data should be reloaded after actions and for client-side navigations.

```tsx


export function shouldRevalidate({
  actionResult,
  currentParams,
  currentUrl,
  defaultShouldRevalidate,
  formAction,
  formData,
  formEncType,
  formMethod,
  nextParams,
  nextUrl,
}) => {
  return true;
}
```

<docs-warning>This feature is an <i>additional</i> optimization. In general, React Routers's design already optimizes which loaders need to be called and when. When you use this feature you risk your UI getting out of sync with your server. Use with caution!</docs-warning>

During client-side transitions, React Router will optimize reloading of routes that are already rendering, like not reloading layout routes that aren't changing. In other cases, like form submissions or search param changes, React Router doesn't know which routes need to be reloaded, so it reloads them all to be safe. This ensures your UI always stays in sync with the state on your server.

This function lets apps further optimize by returning `false` when React Router is about to reload a route. If you define this function on a route module, React Router will defer to your function on every navigation and every revalidation after an action is called. Again, this makes it possible for your UI to get out of sync with your server if you do it wrong, so be careful.

`fetcher.load` calls also revalidate, but because they load a specific URL, they don't have to worry about route param or URL search param revalidations. `fetcher.load`'s only revalidate by default after action submissions and explicit revalidation requests via [`useRevalidator`][use-revalidator].

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
