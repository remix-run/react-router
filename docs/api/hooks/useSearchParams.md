---
title: useSearchParams
---

# useSearchParams

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Hey! Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please find the definition of this API and edit the JSDoc
comments accordingly and this file will be re-generated once those
changes are merged.
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useSearchParams.html)

Returns a tuple of the current URL's [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) and a function to update them. Setting the search params causes a navigation.

```tsx
import { useSearchParams } from "react-router";

export function SomeComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ...
}
```

## Signature

```tsx
useSearchParams(defaultInit?: URLSearchParamsInit): [
    URLSearchParams,
    SetURLSearchParams
]
```

## Params

### defaultInit

You can initialize the search params with a default value, though it **will not** change the URL on the first render.

```tsx
// a search param string
useSearchParams("?tab=1");

// a short-hand object
useSearchParams({ tab: "1" });

// object keys can be arrays for multiple values on the key
useSearchParams({ brand: ["nike", "reebok"] });

// an array of tuples
useSearchParams([["tab", "1"]]);

// a URLSearchParams object
useSearchParams(new URLSearchParams("?tab=1"));
```

