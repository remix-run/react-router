---
title: useSearchParams (RN)
---

# `useSearchParams` (React Native)

<docs-info>This is the React Native version of `useSearchParams`. For the web version, [go here][usesearchparams].</docs-info>

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
import { View, SearchForm, TextInput } from "react-native";
import { useSearchParams } from "react-router-native";

function App() {
  let [searchParams, setSearchParams] = useSearchParams();
  let [query, setQuery] = React.useState(
    searchParams.get("query")
  );

  function handleSubmit() {
    setSearchParams({ query });
  }

  return (
    <View>
      <SearchForm onSubmit={handleSubmit}>
        <TextInput value={query} onChangeText={setQuery} />
      </SearchForm>
    </View>
  );
}
```

[functional-updates]: https://reactjs.org/docs/hooks-reference.html#functional-updates
[searchparams]: https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams
[usesearchparams]: ./use-search-params
[usestate]: https://reactjs.org/docs/hooks-reference.html#usestate
