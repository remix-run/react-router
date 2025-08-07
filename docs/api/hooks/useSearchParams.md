---
title: useSearchParams
---

# useSearchParams

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useSearchParams.html)

Returns a tuple of the current URL's [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
and a function to update them. Setting the search params causes a navigation.

```tsx
import { useSearchParams } from "react-router";

export function SomeComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ...
}
```

### `setSearchParams` function

The second element of the tuple is a function that can be used to update the
search params. It accepts the same types as `defaultInit` and will cause a
navigation to the new URL.

```tsx
let [searchParams, setSearchParams] = useSearchParams();

// a search param string
setSearchParams("?tab=1");

// a shorthand object
setSearchParams({ tab: "1" });

// object keys can be arrays for multiple values on the key
setSearchParams({ brand: ["nike", "reebok"] });

// an array of tuples
setSearchParams([["tab", "1"]]);

// a `URLSearchParams` object
setSearchParams(new URLSearchParams("?tab=1"));
```

It also supports a function callback like React's
[`setState`](https://react.dev/reference/react/useState#setstate):

```tsx
setSearchParams((searchParams) => {
  searchParams.set("tab", "2");
  return searchParams;
});
```

<docs-warning>The function callback version of `setSearchParams` does not support
the [queueing](https://react.dev/reference/react/useState#setstate-parameters)
logic that React's `setState` implements.  Multiple calls to `setSearchParams`
in the same tick will not build on the prior value.  If you need this behavior,
you can use `setState` manually.</docs-warning>

### Notes

Note that `searchParams` is a stable reference, so you can reliably use it
as a dependency in React's [`useEffect`](https://react.dev/reference/react/useEffect)
hooks.

```tsx
useEffect(() => {
  console.log(searchParams.get("tab"));
}, [searchParams]);
```

However, this also means it's mutable. If you change the object without
calling `setSearchParams`, its values will change between renders if some
other state causes the component to re-render and URL will not reflect the
values.

## Signature

```tsx
function useSearchParams(
  defaultInit?: URLSearchParamsInit,
): [URLSearchParams, SetURLSearchParams]
```

## Params

### defaultInit

You can initialize the search params with a default value, though it **will
not** change the URL on the first render.

```tsx
// a search param string
useSearchParams("?tab=1");

// a shorthand object
useSearchParams({ tab: "1" });

// object keys can be arrays for multiple values on the key
useSearchParams({ brand: ["nike", "reebok"] });

// an array of tuples
useSearchParams([["tab", "1"]]);

// a `URLSearchParams` object
useSearchParams(new URLSearchParams("?tab=1"));
```

## Returns

A tuple of the current [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
and a function to update them.

