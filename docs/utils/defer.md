---
title: defer
new: true
---

# `defer`

This utility allows you to defer values returned from loaders by passing promises instead of resolved values.

```jsx
async function loader() {
  let product = await getProduct();
  let reviews = getProductReviews();
  return defer({ product, reviews });
}
```

See the [Deferred Guide][deferred guide] for more information.

[deferred guide]: ../guides/deferred
