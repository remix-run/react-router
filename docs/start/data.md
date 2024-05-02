---
title: Data
order: 4
---

# Loading Data

Data is provided to routes from the server through `loader` and in the browser through `clientLoader`. Route components access both from `useLoaderData`.

## Client Data Loading

The `clientLoader` export is used to fetch data on the client. This is useful for projects that aren't server rendering, and for pages you'd prefer to fetch in the browser.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");

import { useLoaderData } from "react-router";

export async function clientLoader({ params }) {
  const res = await fetch(`/api/products/${params.pid}`);
  const product = await res.json();
  return product;
}

export default function Product() {
  const product = useLoaderData();
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

## Server Data Loading

When server rendering, the `loader` export is used to fetch data on the server for both initial page loads and client navigations through an automatic `fetch` by React Router in the browser.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");

import { useLoaderData } from "react-router";
import { fakeDb } from "../db";

export async function loader({ params }) {
  const product = await fakeDb.getProduct(params.pid);
  return product;
}

export default function Product() {
  const product = useLoaderData();
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

Note that the `loader` function is removed from client bundles so you can use server only APIs without worrying about them being included in the browser.

## Static Data Loading

When pre-rendering, the `loader` export is used to fetch data at build time.

```ts filename=vite.config.ts
import { plugin as app } from "@react-router/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    app({
      async prerender() {
        let products = await readProductsFromCSVFile(
          "./products.csv"
        );
        return products.map(
          (product) => `/products/${product.id}`
        );
      },
    }),
  ],
});
```

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import { useLoaderData } from "react-router";

export async function loader({ params }) {
  const product = await getProductFromCSVFile(params.pid);
  return product;
}

export default function Product() {
  const product = useLoaderData();
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

## Using Both Loaders

You can use both `loader` and `clientLoader` in the same route module. The `loader` will be used on the server for initial SSR (or pre-rendering) and the `clientLoader` will be used thereafter.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");

import { useLoaderData } from "react-router";
import { fakeDb } from "../db";

export async function loader({ params }) {
  return fakeDb.getProduct(params.pid);
}

export async function clientLoader({ params }) {
  const res = await fetch(`/api/products/${params.pid}`);
  return res.json();
}

export default function Product() {
  const product = useLoaderData();
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

For more advanced use cases with `clientLoader` like caching, refer to [Advanced Data Fetching][advanced_data_fetching].

## Type Safety

When using TypeScript, type the arguments to `loader` or `clientLoader` and provide a type argument to `useLoaderData`:

```tsx filename=app/product.tsx lines=[3,7,13]
import { useLoaderData, LoaderArgs } from "react-router";
import { fakeDb } from "../db";

export async function loader({ params }: LoaderArgs) {
  const product = await fakeDb.getProduct(params.pid);
  return product;
}

export default function Product() {
  const product = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

[advanced_data_fetching]: ../tutorials/advanced-data-fetching
