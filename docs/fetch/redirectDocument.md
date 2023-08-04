---
title: redirectDocument
new: true
---

# `redirectDocument`

This is a small wrapper around [`redirect`][redirect] that will trigger a document-level redirect to the new location instead of a client-side navigation.

This is most useful when you have a React Router app living next to a separate app on the same domain and need to redirect from the React Router app to the other app via `window.location` instead of a React Router navigation:

```jsx
import { redirectDocument } from "react-router-dom";

const loader = async () => {
  const user = await getUser();
  if (!user) {
    return redirectDocument("/otherapp/login");
  }
  return null;
};
```

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
redirectDocument("/otherapp/login");
```

## `init`

The [Response][response] options to be used in the response.

[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response/Response
[redirect]: ./redirect
