---
title: replace
new: true
---

# `replace`

This is a small wrapper around [`redirect`][redirect] that will trigger a client-side redirect to the new location using `history.replaceState` instead of `history.pushState`.

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
replace("/otherapp/login");
```

## `init`

The `status` or the [Response][response] options to be used in the response.

[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response/Response
[redirect]: ./redirect
