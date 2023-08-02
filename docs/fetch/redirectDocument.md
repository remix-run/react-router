---
title: redirectDocument
new: true
---

# `redirectDocument`

This is a small wrapper around [`redirect`][redirect] that will trigger a document-level redirect to the new location instead of a client-side navigation.

This is most useful when you have a Remix app living next to a non-Remix app on the same domain and need to redirect from the Remix app to the non-Remix app:

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
