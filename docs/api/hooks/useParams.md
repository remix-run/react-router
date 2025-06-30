---
title: useParams
---

# useParams

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useParams.html)

Returns an object of key/value pairs of the dynamic params from the current URL that were matched by the routes. Child routes inherit all params from their parent routes.

```tsx
import { useParams } from "react-router";

function SomeComponent() {
  let params = useParams();
  params.postId;
}
```

Assuming a route pattern like `/posts/:postId` is matched by `/posts/123` then `params.postId` will be `"123"`.

## Examples

### Basic Usage

```tsx
import { useParams } from "react-router";

// given a route like:
<Route path="/posts/:postId" element={<Post />} />;

// or a data route like:
createBrowserRouter([
  {
    path: "/posts/:postId",
    component: Post,
  },
]);

// or in routes.ts
route("/posts/:postId", "routes/post.tsx");
```

Access the params in a component:

```tsx
import { useParams } from "react-router";

export default function Post() {
  let params = useParams();
  return <h1>Post: {params.postId}</h1>;
}
```

### Multiple Params

Patterns can have multiple params:

```tsx
"/posts/:postId/comments/:commentId";
```

All will be available in the params object:

```tsx
import { useParams } from "react-router";

export default function Post() {
  let params = useParams();
  return (
    <h1>
      Post: {params.postId}, Comment: {params.commentId}
    </h1>
  );
}
```

### Catchall Params

Catchall params are defined with `*`:

```tsx
"/files/*";
```

The matched value will be available in the params object as follows:

```tsx
import { useParams } from "react-router";

export default function File() {
  let params = useParams();
  let catchall = params["*"];
  // ...
}
```

You can destructure the catchall param:

```tsx
export default function File() {
  let { "*": catchall } = useParams();
  console.log(catchall);
}
```
