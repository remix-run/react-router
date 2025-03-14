---
title: Await
---

# Await

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Await.html)

Used to render promise values with automatic error handling.

```tsx
import { Await, useLoaderData } from "react-router";

export function loader() {
  // not awaited
  const reviews = getReviews();
  // awaited (blocks the transition)
  const book = await fetch("/api/book").then((res) =>
    res.json()
  );
  return { book, reviews };
}

function Book() {
  const { book, reviews } = useLoaderData();
  return (
    <div>
      <h1>{book.title}</h1>
      <p>{book.description}</p>
      <React.Suspense fallback={<ReviewsSkeleton />}>
        <Await
          resolve={reviews}
          errorElement={
            <div>Could not load reviews 😬</div>
          }
          children={(resolvedReviews) => (
            <Reviews items={resolvedReviews} />
          )}
        />
      </React.Suspense>
    </div>
  );
}
```

`<Await>` expects to be rendered inside of a `<React.Suspense>`

## Props

### children

[modes: framework, data]

When using a function, the resolved value is provided as the parameter.

```tsx [2]
<Await resolve={reviewsPromise}>
  {(resolvedReviews) => <Reviews items={resolvedReviews} />}
</Await>
```

When using React elements, [useAsyncValue](../hooks/useAsyncValue) will provide the
resolved value:

```tsx [2]
<Await resolve={reviewsPromise}>
  <Reviews />
</Await>;

function Reviews() {
  const resolvedReviews = useAsyncValue();
  return <div>...</div>;
}
```

### errorElement

[modes: framework, data]

The error element renders instead of the children when the promise rejects.

```tsx
<Await
  errorElement={<div>Oops</div>}
  resolve={reviewsPromise}
>
  <Reviews />
</Await>
```

To provide a more contextual error, you can use the [useAsyncError](../hooks/useAsyncError) in a
child component

```tsx
<Await
  errorElement={<ReviewsError />}
  resolve={reviewsPromise}
>
  <Reviews />
</Await>;

function ReviewsError() {
  const error = useAsyncError();
  return <div>Error loading reviews: {error.message}</div>;
}
```

If you do not provide an errorElement, the rejected value will bubble up to
the nearest route-level ErrorBoundary and be accessible
via [useRouteError](../hooks/useRouteError) hook.

### resolve

[modes: framework, data]

Takes a promise returned from a [LoaderFunction](../Other/LoaderFunction) value to be resolved and rendered.

```jsx
import { useLoaderData, Await } from "react-router";

export async function loader() {
  let reviews = getReviews(); // not awaited
  let book = await getBook();
  return {
    book,
    reviews, // this is a promise
  };
}

export default function Book() {
  const {
    book,
    reviews, // this is the same promise
  } = useLoaderData();

  return (
    <div>
      <h1>{book.title}</h1>
      <p>{book.description}</p>
      <React.Suspense fallback={<ReviewsSkeleton />}>
        <Await
          // and is the promise we pass to Await
          resolve={reviews}
        >
          <Reviews />
        </Await>
      </React.Suspense>
    </div>
  );
}
```
