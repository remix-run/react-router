---
title: Data Loading
order: 5
---

<docs-warning>
  The types for route modules are still in development, this API may change.
</docs-warning>

# Data Loading

Data is provided to the route via `loader` and `clientLoader`, and accessed in the `data` prop of the Route Component.

## Client Data Loading

`clientLoader` is used to fetch data on the client. This is useful for projects that aren't server rendering, and for pages you'd prefer fetch their data in the browser.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type {
  DefaultProps,
  ClientLoaderArgs,
} from "./+types.product";
import { useLoaderData } from "@remix-run/react";

export async function clientLoader({ params }: LoaderArgs) {
  const res = await fetch(`/api/products/${params.pid}`);
  const product = await res.json();
  return { product };
}

export default function Product({
  clientLoaderData,
}: DefaultProps) {
  const { name, description } = clientLoaderData.product;
  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

## Server Data Loading

When server rendering, the `loader` method is used to fetch data on the server for both initial page loads and client navigations through an automatic `fetch` by React Router in the browser.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type {
  DefaultProps,
  LoaderArgs,
} from "./+types.product";
import { fakeDb } from "../db";

export async function loader({ params }: LoaderArgs) {
  const product = await fakeDb.getProduct(params.pid);
  return { product };
}

export default function Product({
  loaderData,
}: DefaultProps) {
  const { name, description } = loaderData.product;
  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

Note that the `loader` function is removed from client bundles so you can use server only APIs without worrying about them being included in the browser.

## React Server Components

<docs-warning>RSC is not supported yet</docs-warning>

RSC is supported by returning components from loaders and actions.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type {
  DefaultProps,
  LoaderArgs,
} from "./+types.product";
import Product from "./product";
import Reviews from "./reviews";

export async function loader({ params }: LoaderArgs) {
  return {
    product: <Product id={params.pid} />,
    reviews: <Reviews productId={params.pid} />,
  };
}

export default function ProductPage({
  loaderData,
}: DefaultProps) {
  return (
    <div>
      {loaderData.product}
      {loaderData.reviews}
    </div>
  );
}
```

## Static Data Loading

When pre-rendering, the `loader` method is used to fetch data at build time.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type {
  DefaultProps,
  LoaderArgs,
} from "./+types.product";

export async function loader({ params }: LoaderArgs) {
  let product = await getProductFromCSVFile(params.pid);
  return { product };
}

export default function Product({
  loaderData,
}: DefaultProps) {
  const { name, description } = loaderData.product;
  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

The URLs to pre-render are specified in the Vite plugin.

```ts filename=vite.config.ts
import { plugin as app } from "@react-router/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    app({
      async prerender() {
        let products = await readProductsFromCSVFile();
        return products.map(
          (product) => `/products/${product.id}`
        );
      },
    }),
  ],
});
```

Note that when server rendering, any URLs that aren't pre-rendered will be server rendered as usual.

## Using Both Loaders

`loader` and `clientLoader` can be used together. The `loader` will be used on the server for initial SSR (or pre-rendering) and the `clientLoader` will be used on subsequent clientside navigations.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type {
  DefaultProps,
  ClientLoader,
  LoaderArgs,
} from "./+types.product";
import { fakeDb } from "../db";

export async function loader({ params }: LoaderArgs) {
  return fakeDb.getProduct(params.pid);
}

export async function clientLoader({
  params,
}: ClientLoader) {
  const res = await fetch(`/api/products/${params.pid}`);
  return res.json();
}

export default function Product({
  loaderData,
  clientLoaderData,
}: DefaultProps) {
  const { name, description } =
    clientLoaderData.product || loaderData.product;

  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
    </div>
  );
}
```

For more advanced use cases with `clientLoader` like caching, refer to [Advanced Data Fetching][advanced_data_fetching].

[advanced_data_fetching]: ../tutorials/advanced-data-fetching
