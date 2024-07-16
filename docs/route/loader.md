---
title: loader
new: true
---

# `loader`

Each route can define a "loader" function to provide data to the route element before it renders.

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```js [5-7,12-14]
createBrowserRouter([
  {
    element: <Teams />,
    path: "teams",
    loader: async () => {
      return fakeDb.from("teams").select("*");
    },
    children: [
      {
        element: <Team />,
        path: ":teamId",
        loader: async ({ params }) => {
          return fetch(`/api/teams/${params.teamId}.json`);
        },
      },
    ],
  },
]);
```

As the user navigates around the app, the loaders for the next matching branch of routes will be called in parallel and their data made available to components through [`useLoaderData`][useloaderdata].

## `params`

Route params are parsed from [dynamic segments][dynamicsegments] and passed to your loader. This is useful for figuring out which resource to load:

```tsx
createBrowserRouter([
  {
    path: "/teams/:teamId",
    loader: ({ params }) => {
      return fakeGetTeam(params.teamId);
    },
  },
]);
```

Note that the `:teamId` in the path is parsed and provided as `params.teamId` by the same name.

## `request`

This is a [Fetch Request][request] instance being made to your application.

```jsx
function loader({ request }) {}
```

> A request?!

It might seem odd at first that loaders receive a "request". Consider that `<Link>` does something like the following code and ask yourself, "what default behavior is being prevented here?".

```tsx [4]
<a
  href={props.to}
  onClick={(event) => {
    event.preventDefault();
    navigate(props.to);
  }}
/>
```

Without React Router, the browser would have made a <i>Request</i> to your server, but React Router prevented it! Instead of the browser sending the request to your server, React Router sends the request to your loaders.

The most common use case is creating a [URL][url] and reading the [URLSearchParams][urlsearchparams] from it:

```jsx
function loader({ request }) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q");
  return searchProducts(searchTerm);
}
```

Note that the APIs here are not React Router specific, but rather standard web objects: [Request][request], [URL][url], [URLSearchParams][urlsearchparams].

## `loader.hydrate`

If you are [Server-Side Rendering][ssr] and leveraging the `future.v7_partialHydration` flag for [Partial Hydration][partialhydration], then you may wish to opt-into running a route `loader` on initial hydration _even though it has hydration data_ (for example, to let a user prime a cache with the hydration data). To force a `loader` to run on hydration in a partial hydration scenario, you can set a `hydrate` property on the `loader` function:

## Returning Responses

While you can return anything you want from a loader and get access to it from [`useLoaderData`][useloaderdata], you can also return a web [Response][response].

This might not seem immediately useful, but consider `fetch`. Since the return value of `fetch` is a Response, and loaders understand responses, many loaders can return a simple fetch!

```tsx
// an HTTP/REST API
function loader({ request }) {
  return fetch("/api/teams.json", {
    signal: request.signal,
  });
}

// or even a graphql endpoint
function loader({ request, params }) {
  return fetch("/_gql", {
    signal: request.signal,
    method: "post",
    body: JSON.stringify({
      query: gql`...`,
      params: params,
    }),
  });
}
```

You can construct the response yourself as well:

```tsx [3-8]
function loader({ request, params }) {
  const data = { some: "thing" };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json; utf-8",
    },
  });
}
```

React Router will automatically call `response.json()` so your components don't need to parse it while rendering:

```tsx
function SomeRoute() {
  const data = useLoaderData();
  // { some: "thing" }
}
```

Using the [`json`][json] utility simplifies this so you don't have to construct them yourself. This next example is effectively the same as the previous example:

```jsx
import { json } from "react-router-dom";

function loader({ request, params }) {
  const data = { some: "thing" };
  return json(data, { status: 200 });
}
```

If you're planning an upgrade to Remix, returning responses from every loader will make the migration smoother.

## Throwing in Loaders

You can `throw` in your loader to break out of the current call stack (stop running the current code) and React Router will start over down the "error path".

```tsx [4]
function loader({ request, params }) {
  const res = await fetch(`/api/properties/${params.id}`);
  if (res.status === 404) {
    throw new Response("Not Found", { status: 404 });
  }
  return res.json();
}
```

For more details, read the [`errorElement`][errorelement] documentation.

[dynamicsegments]: ./route#dynamic-segments
[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[url]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[urlsearchparams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[migratingtoremix]: ../guides/migrating-to-remix
[useloaderdata]: ../hooks/use-loader-data
[json]: ../fetch/json
[errorelement]: ./error-element
[pickingarouter]: ../routers/picking-a-router
[ssr]: ../guides/ssr
[partialhydration]: ../routers/create-browser-router#partial-hydration-data
