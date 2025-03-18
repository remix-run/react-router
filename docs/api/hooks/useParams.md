---
title: useParams
---

# useParams

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useParams.html)

Returns an object of key/value pairs of the dynamic params from the current URL that were matched by the routes. Child routes inherit all params from their parent routes.

```tsx
import { useParams } from "react-router"

function SomeComponent() {
  let params = useParams()
  params.postId
}
```

Assuming a route pattern like `/posts/:postId` is matched by `/posts/123` then `params.postId` will be `"123"`.



## Signature

```tsx
useParams(): Readonly
```

