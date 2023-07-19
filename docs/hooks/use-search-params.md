---
title: useSearchParams
---

# `useSearchParams`

<docs-info>This is the web version of `useSearchParams`. For the React Native version, [go here][usesearchparams-native].</docs-info>

<details>
  <summary>Type declaration</summary>

```tsx
declare function useSearchParams(
  defaultInit?: URLSearchParamsInit
): [URLSearchParams, SetURLSearchParams];

type ParamKeyValuePair = [string, string];

type URLSearchParamsInit =
  | string
  | ParamKeyValuePair[]
  | Record<string, string | string[]>
  | URLSearchParams;

type SetURLSearchParams = (
  nextInit?:
    | URLSearchParamsInit
    | ((prev: URLSearchParams) => URLSearchParamsInit),
  navigateOpts?: : NavigateOptions
) => void;

interface NavigateOptions {
  replace?: boolean;
  state?: any;
  preventScrollReset?: boolean;
}
```

</details>

The `useSearchParams` hook is used to read and modify the query string in the URL for the current location. Like React's own [`useState` hook][usestate], `useSearchParams` returns an array of two values: the current location's [search params][searchparams] and a function that may be used to update them. Just as React's [`useState` hook][usestate], `setSearchParams` also supports [functional updates][functional-updates]. Therefore, you may provide a function that takes a `searchParams` and returns an updated version.

```tsx
import * as React from "react";
import { useSearchParams } from "react-router-dom";

function App() {
  let [searchParams, setSearchParams] = useSearchParams();

  function handleSubmit(event) {
    event.preventDefault();
    // The serialize function here would be responsible for
    // creating an object of { key: value } pairs from the
    // fields in the form that make up the query.
    let params = serializeFormQuery(event.target);
    setSearchParams(params);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>{/* ... */}</form>
    </div>
  );
}
```

<docs-info>The `setSearchParams` function works like [`navigate`][usenavigate], but only for the [search portion](https://developer.mozilla.org/en-US/docs/Web/API/Location/search) of the URL. Also note that the second arg to `setSearchParams` is the same type as the second arg to `navigate`.</docs-info>

[functional-updates]: https://reactjs.org/docs/hooks-reference.html#functional-updates
[searchparams]: https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams
[usesearchparams-native]: ./use-search-params-rn
[usestate]: https://react.dev/reference/react/useState
[usenavigate]: ./use-navigate
