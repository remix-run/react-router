#### `<Await unstable_promise>`

In Data and Framework modes, including their unstable RSC variants, client components can opt into React's `use()` API with `<Await unstable_promise>`. This keeps support for render-prop children, `useAsyncValue`, and `useAsyncError` while accepting promise-like values without modifying the source promise.

> **Warning:** The `unstable_promise` prop is unstable and may change in minor or patch releases.

```tsx
import { Suspense } from "react";
import { Await } from "react-router";

<Suspense fallback={<p>Loading reviews...</p>}>
  <Await
    unstable_promise={reviewsPromise}
    errorElement={<p>Could not load reviews</p>}
  >
    {(reviews) => <Reviews items={reviews} />}
  </Await>
</Suspense>;
```

Pass exactly one of `resolve` or `unstable_promise`; the existing `resolve` API remains supported. With `unstable_promise`, `errorElement` handles promise rejections, while errors thrown when rendering children bubble to the nearest React error boundary.

Streamed promises are also tracked during decoding so settled server content stays visible during hydration updates when using either `<Await>` API or `React.use()` directly.
