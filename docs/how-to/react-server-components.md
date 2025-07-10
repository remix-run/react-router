---
title: React Server Components (unstable)
unstable: true
---

# React Server Components

[MODES: data]

<br/>
<br/>

<docs-warning>React Server Components support is experimental and subject to breaking changes.</docs-warning>

React Server Components (RSC) refers generally to an architecture and set of APIs provided by React since version 19.

From the docs:

> Server Components are a new type of Component that renders ahead of time, before bundling, in an environment separate from your client app or SSR server.
> <cite>- [React "Server Components" docs][react-server-components-doc]</cite>

React Router provides a set of APIs for integrating with RSC-native bundlers, allowing you to leverage [Server Components][react-server-components-doc] and [Server Functions][react-server-functions-doc] in your React Router applications.

## Quick Start

The quickest way to get started is with one of our templates.

These templates come with React Router RSC APIs already configured with the respective bundler, offering you out of the box features such as:

- Server Components from `loader`s/`action`s
- Server Components Routes
- Server Side Rendering (SSR)
- Client Components (via [`"use client"`][use-client-docs] directive)
- Server Functions (via [`"use server"`][use-server-docs] directive)

**Parcel Template**

```shellscript
npx create-react-router-app@latest --template=unstable_rsc-parcel
```

**Vite Template**

```shellscript
npx create-react-router-app@latest --template=unstable_rsc-vite
```

## Using RSC with React Router

### Configuring Routes

Routes are configured as an argument to [`matchRSCServerRequest`][match-rsc-server-request]. At a minimum, you need a path and component:

```tsx
function Root() {
  return <h1>Hello world</h1>;
}

matchRSCServerRequest({
  // ...other options
  routes: [{ path: "/", Component: Root }],
});
```

While you can define components inline, we recommend for both startup performance, as well as code organization, using the `lazy()` option and defining [Route Modules][route-module]:

<docs-info>

While [Route Modules][route-module] are a [Framework Mode][framework-mode] feature, the route module exports are the same options expected by the `lazy` field of your RSC route config.

</docs-info>

```tsx filename=app/routes.ts
import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

export function routes() {
  return [
    {
      id: "root",
      path: "",
      lazy: () => import("./root/route"),
      children: [
        {
          id: "home",
          index: true,
          lazy: () => import("./home/route"),
        },
        {
          id: "about",
          path: "about",
          lazy: () => import("./about/route"),
        },
      ],
    },
  ] satisfies RSCRouteConfig;
}
```

### Server Component Routes

By default each route's `default` export renders a Server Component

```tsx
export default function Home() {
  return (
    <main>
      <article>
        <h1>Welcome to React Router RSC</h1>
        <p>
          You won't find me running any JavaScript in the
          browser!
        </p>
      </article>
    </main>
  );
}
```

A nice feature of Server Components is you can fetch data directly from your component by making it asynchronous.

```tsx
export default async function Home() {
  let user = await getUserData();

  return (
    <main>
      <article>
        <h1>Welcome to React Router RSC</h1>
        <p>
          You won't find me running any JavaScript in the
          browser!
        </p>
        <p>
          Hello, {user ? user.name : "anonymous person"}!
        </p>
      </article>
    </main>
  );
}
```

### RSC From Loaders/Actions

In React Router, you can also return a Server Component from a `loader` or `action`.

This is useful if:

1. You want to incrementally adopt RSC
2. You want to pick and choose where you use Server Components
3. Your data determines your components

```tsx
export async function loader({ params }) {
  let { contentBlocks, ...product } = await getProduct(
    params.productId
  );
  return {
    product,
    content: (
      <div>
        {contentBlocks.map((block) => {
          switch (block.type) {
            case "image":
              return <ImageBlock {...block} />;
            case "gallery":
              return <GalleryBlock {...block} />;
            case "video":
              return <VideoBlock {...block} />;
            case "text":
              return <TextBlock {...block} />;
            case "markdown":
              return <MarkdownBlock {...block} />;
            default:
              throw new Error(
                `Unknown block type: ${block.type}`
              );
          }
        })}
      </div>
    ),
  };
}

export default function Article({ loaderData }) {
  return (
    <ProductLayout product={loaderData.product}>
      {loaderData.content}
    </ProductLayout>
  );
}
```

### Server Functions

[Server Functions][react-server-functions-doc] are a React feature that allow you to call async functions executed on the server. They're defined with the [`"use server"`][use-server-docs] directive.

```tsx
"use server";

export async function updateFavorite(formData: FormData) {
  let movieId = formData.get("id");
  let intent = formData.get("intent");
  if (intent === "add") {
    await addFavorite(Number(movieId));
  } else {
    await removeFavorite(Number(movieId));
  }
}
import { updateFavorite } from "./action.ts";
```

```tsx
export async function AddToFavoritesForm({
  movieId,
}: {
  movieId: number;
}) {
  let isFav = await isFavorite(movieId);
  return (
    <form action={updateFavorite}>
      <input type="hidden" name="id" value={movieId} />
      <input
        type="hidden"
        name="intent"
        value={liked ? "remove" : "add"}
      />
      <AddToFavoritesButton isFav={isFav} />
    </form>
  );
}
```

Note that after server functions are called, React Router will automatically revalidate the route and update the UI with the new server content. You don't have to mess around with any cache invalidation.

### Client Properties

Routes are defined on the server at runtime, but we can still provide `clientLoader`, `clientAction`, and `shouldRevalidate` through the utilization of client references and `"use client"`.

```tsx filename=src/routes/root/client.tsx
"use client";

export function clientAction() {}

export function clientLoader() {}

export function shouldRevalidate() {}
```

We can then re-export these from our lazy loaded route module:

```tsx filename=src/routes/root/route.tsx
export {
  clientAction,
  clientLoader,
  shouldRevalidate,
} from "./route.client";

export default function Root() {
  // ...
}
```

This is also the way we would make an entire route a Client Component.

```tsx filename=src/routes/root/route.tsx lines=[6,9]
export {
  clientAction,
  clientLoader,
  shouldRevalidate,
  default as ClientRoot,
} from "./route.client";

export default function Root() {
  return <ClientRoot />;
}
```

## Setting up RSC

### Entry points

**RSC Server**

We'll name it `entry.rsc.tsx`, but you can name it whatever you want.

Relevant APIs:

- [`matchRSCServerRequest`][match-rsc-server-request]

**Server**

We'll name it `entry.ssr.tsx`, but you can name it whatever you want.

Relevant APIs:

- [`routeRSCServerRequest`][route-rsc-server-request]
- [`RSCStaticRouter`][rsc-static-router]

**Client**

We'll name it `entry.client.tsx`, but you can name it whatever you want.

Relevant APIs:

- [`createCallServer`][create-call-server]
- [`getRSCStream`][get-rsc-stream]
- [`RSCHydratedRouter`][rsc-hydrated-router]

### Parcel

[Parcel's docs][parcel-rsc-doc]

### Vite

[Vite's docs][vite-rsc-doc]

[react-server-components-doc]: https://react.dev/reference/rsc/server-components
[react-server-functions-doc]: https://react.dev/reference/rsc/server-functions
[use-client-docs]: https://react.dev/reference/rsc/use-client
[use-server-docs]: https://react.dev/reference/rsc/use-server
[route-module]: ../start/framework/route-module
[framework-mode]: ../start/framework/route-module
[parcel-rsc-doc]: https://parceljs.org/recipes/rsc/
[vite-rsc-doc]: https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc
[match-rsc-server-request]: ../api/rsc/matchRSCServerRequest
[route-rsc-server-request]: ../api/rsc/routeRSCServerRequest
[rsc-static-router]: ../api/rsc/RSCStaticRouter
[create-call-server]: ../api/rsc/createCallServer
[get-rsc-stream]: ../api/rsc/getRSCStream
[rsc-hydrated-router]: ../api/rsc/RSCHydratedRouter
