---
title: Data Loading
order: 5
---

# Data Loading

Data is provided to the route component from `loader` and `clientLoader`.

Loader data is automatically serialized from loaders and deserialized in components. In addition to primitive values like strings and numbers, loaders can return promises, maps, sets, dates and more.

## Client Data Loading

`clientLoader` is used to fetch data on the client. This is useful for pages or full projects that you'd prefer to fetch data from the browser only.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type { Route } from "./+types/product";

export async function clientLoader({
  params,
}: Route.ClientLoaderArgs) {
  const res = await fetch(`/api/products/${params.pid}`);
  const product = await res.json();
  return product;
}

export default function Product({
  loaderData,
}: Route.ComponentProps) {
  const { name, description } = loaderData;
  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

## Server Data Loading

When server rendering, `loader` is used for both initial page loads and client navigations. Client navigations call the loader through an automatic `fetch` by React Router from the browser to your server.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type { Route } from "./+types/product";
import { fakeDb } from "../db";

export async function loader({ params }: Route.LoaderArgs) {
  const product = await fakeDb.getProduct(params.pid);
  return product;
}

export default function Product({
  loaderData,
}: Route.ComponentProps) {
  const { name, description } = loaderData;
  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

Note that the `loader` function is removed from client bundles so you can use server only APIs without worrying about them being included in the browser.

## Static Data Loading

When pre-rendering, loaders are used to fetch data during the production build.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type { Route } from "./+types/product";

export async function loader({ params }: Route.LoaderArgs) {
  let product = await getProductFromCSVFile(params.pid);
  return product;
}

export default function Product({
  loaderData,
}: Route.ComponentProps) {
  const { name, description } = loaderData;
  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

The URLs to pre-render are specified in react-router.config.ts:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  async prerender() {
    let products = await readProductsFromCSVFile();
    return products.map(
      (product) => `/products/${product.id}`
    );
  },
} satisfies Config;
```

Note that when server rendering, any URLs that aren't pre-rendered will be server rendered as usual, allowing you to pre-render some data at a single route while still server rendering the rest.

## Using Both Loaders

`loader` and `clientLoader` can be used together. The `loader` will be used on the server for initial SSR (or pre-rendering) and the `clientLoader` will be used on subsequent client-side navigations.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type { Route } from "./+types/product";
import { fakeDb } from "../db";

export async function loader({ params }: Route.LoaderArgs) {
  return fakeDb.getProduct(params.pid);
}

export async function clientLoader({
  params,
}: Route.ClientLoader) {
  const res = await fetch(`/api/products/${params.pid}`);
  return res.json();
}

export default function Product({
  loaderData,
}: Route.ComponentProps) {
  const { name, description } = loaderData;

  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

---

Next: [Actions](./actions)

See also:

- [Streaming with Suspense](../../how-to/suspense)

[advanced_data_fetching]: ../tutorials/advanced-data-fetching
[data]: ../../api/react-router/data
