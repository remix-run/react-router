---
title: Data Loading
order: 5
---

# Data Loading

Data is provided to the route component from `loader` and `clientLoader`.

## Client Data Loading

`clientLoader` is used to fetch data on the client. This is useful for pages or full projects that you'd prefer to fetch data from the browser only.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type { Route } from "./+types.product";

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
import type { Route } from "./+types.product";
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
import type { Route } from "./+types.product";

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

export const config: Config = {
  async prerender() {
    let products = await readProductsFromCSVFile();
    return products.map(
      (product) => `/products/${product.id}`
    );
  },
};
```

Note that when server rendering, any URLs that aren't pre-rendered will be server rendered as usual, allowing you to pre-render some data at a single route while still server rendering the rest.

## Using Both Loaders

`loader` and `clientLoader` can be used together. The `loader` will be used on the server for initial SSR (or pre-rendering) and the `clientLoader` will be used on subsequent client-side navigations.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import type { Route } from "./+types.product";
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

For more advanced use cases with `clientLoader` like caching, refer to [Advanced Data Fetching][advanced_data_fetching].

## Async Components with React Server Components

RSC is still in development and not available yet.

<details>
<summary>See our plans</summary>

In the future, rendered async components in loaders are available on `loaderData` like any other value:

```tsx filename=app/product-page.tsx
// route("products/:pid", "./product-page.tsx");
import type { Route } from "./+types.product";
import Product from "./product";
import Reviews from "./reviews";

export async function loader({ params }: Route.LoaderArgs) {
  return {
    product: <Product id={params.pid} />,
    reviews: <Reviews productId={params.pid} />,
  };
}

export default function ProductPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div>
      {loaderData.product}
      <Suspense fallback={<div>loading...</div>}>
        {loaderData.reviews}
      </Suspense>
    </div>
  );
}
```

```tsx filename=app/product.tsx
export async function Product({ id }: { id: string }) {
  const product = await fakeDb.getProduct(id);
  return (
    <div>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

</details>

---

Next: [Actions](./actions)

[advanced_data_fetching]: ../tutorials/advanced-data-fetching
[data]: ../../api/react-router/data
