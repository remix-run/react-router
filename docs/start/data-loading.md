---
title: Data Loading
order: 5
---

# Data Loading

Data is provided to the route via `loader` and `clientLoader`, and accessed in the `data` prop of the Route Component.

## Client Data Loading

`clientLoader` is used to fetch data on the client. This is useful for projects that aren't server rendering, and for pages you'd prefer fetch their data in the browser.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import { defineRoute$ } from "react-router";

export default defineRoute$({
  params: ["pid"],

  async clientLoader({ params }) {
    const res = await fetch(`/api/products/${params.pid}`);
    const product = await res.json();
    return { product };
  },

  component: function Product({ data }) {
    return (
      <div>
        <h1>{data.product.name}</h1>
        <p>{data.product.description}</p>
      </div>
    );
  },
});
```

## Server Data Loading

When server rendering, the `loader` export is used to fetch data on the server for both initial page loads and client navigations through an automatic `fetch` by React Router in the browser.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import { defineRoute$ } from "react-router";
import { fakeDb } from "../db";

export default defineRoute$({
  params: ["pid"],

  async loader({ params }) {
    const product = await fakeDb.getProduct(params.pid);
    return { product };
  },

  Component({ data }) {
    return (
      <div>
        <h1>{data.product.name}</h1>
        <p>{data.product.description}</p>
      </div>
    );
  },
});
```

Note that the `loader` function is removed from client bundles so you can use server only APIs without worrying about them being included in the browser.

## React Server Components

RSC is supported by returning components from loaders and actions.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import { defineRoute$ } from "react-router";
import Product from "./product";
import Reviews from "./reviews";

export default defineRoute$({
  params: ["pid"],

  async loader({ params }) {
    return {
      product: <Product id={params.pid} />,
      reviews: <Reviews productId={params.pid} />,
    };
  },

  Component({ data }) {
    return (
      <div>
        {data.product}
        {data.reviews}
      </div>
    );
  },
});
```

## Static Data Loading

When pre-rendering, the `loader` method is used to fetch data at build time.

```tsx filename=app/product.tsx
// route("products/:pid", "./product.tsx");
import { defineRoute$ } from "react-router";

export default defineRoute$({
  params: ["pid"],

  async loader({ params }) {
    let product = await getProductFromCSVFile(params.pid);
    return { product };
  },

  Component({ data }) {
    return (
      <div>
        <h1>{data.product.name}</h1>
        <p>{data.product.description}</p>
      </div>
    );
  },
});
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
import { defineRoute$ } from "react-router";
import { fakeDb } from "../db";

export default defineRoute$({
  // SSR loads directly from the database
  async loader({ params }) {
    return fakeDb.getProduct(params.pid);
  },

  // client navigations fetch directly from the browser,
  // skipping the react router server
  async clientLoader({ params }) {
    const res = await fetch(`/api/products/${params.pid}`);
    return res.json();
  },

  Component({ data }) {
    return (
      <div>
        <h1>{data.name}</h1>
        <p>{data.description}</p>
      </div>
    );
  },
});
```

For more advanced use cases with `clientLoader` like caching, refer to [Advanced Data Fetching][advanced_data_fetching].

[advanced_data_fetching]: ../tutorials/advanced-data-fetching
