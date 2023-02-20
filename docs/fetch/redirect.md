---
title: redirect
new: true
---

# `redirect`

Because you can return or throw responses in loaders and actions, you can use `redirect` to redirect to another route.

```jsx
import { redirect } from "react-router-dom";

const loader = async () => {
  const user = await getUser();
  if (!user) {
    return redirect("/login");
  }
  return null;
};
```

It's really just a shortcut for this:

```jsx
new Response("", {
  status: 302,
  headers: {
    Location: someUrl,
  },
});
```

It's recommended to use `redirect` in loaders and actions rather than `useNavigate` in your components when the redirect is in response to data.

See also:

- [Returning Responses from Loaders][responses]

## Type Declaration

```ts
type RedirectFunction = (
  url: string,
  init?: number | ResponseInit
) => Response;
```

## `url`

The URL to redirect to.

```js
redirect("/login");
```

## `init`

The [Response][response] options to be used in the response.

[responses]: ../route/loader#returning-responses
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response/Response
