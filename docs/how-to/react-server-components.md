---
title: React Server Components
# need to ship it first!
hidden: true
---

# React Server Components

<docs-info>This feature is still in development and not yet available.</docs-info>

In the future, async components can be rendered in loaders like any other data:

```tsx filename=app/product-page.tsx
// route("products/:pid", "./product-page.tsx");
import type { Route } from "./+types/product";
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
