---
title: useSearchParams
---

# useSearchParams

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useSearchParams.html)

Returns a tuple of the current URL's URLSearchParams and a function to update them. Setting the search params causes a navigation.

```tsx
import { useSearchParams } from "react-router";

export function SomeComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ...
}
```

## Signature

```tsx
useSearchParams(defaultInit): undefined
```

## Params

### defaultInit

[modes: framework, data, declarative]

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

## SetSearchParams Function

The second element of the tuple is a function that can be used to update the search params. It accepts the same types as `defaultInit` and will cause a navigation to the new URL.

```tsx
let [searchParams, setSearchParams] = useSearchParams();

// a search param string
setSearchParams("?tab=1");

// a short-hand object
setSearchParams({ tab: "1" });

// object keys can be arrays for multiple values on the key
setSearchParams({ brand: ["nike", "reebok"] });

// an array of tuples
setSearchParams([["tab", "1"]]);

// a URLSearchParams object
setSearchParams(new URLSearchParams("?tab=1"));
```

It also supports a function callback like `setState`:

```tsx
setSearchParams((searchParams) => {
  searchParams.set("tab", "2");
  return searchParams;
});
```

## Notes

Note that `searchParams` is a stable reference, so you can reliably use it as a dependency in `useEffect` hooks.

```tsx
useEffect(() => {
  console.log(searchParams.get("tab"));
}, [searchParams]);
```

However, this also means it's mutable. If you change the object without calling `setSearchParams`, its values will change between renders if some other state causes the component to re-render and URL will not reflect the values.
