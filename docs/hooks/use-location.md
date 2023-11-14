---
title: useLocation
---

# `useLocation`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useLocation(): Location;

interface Location<State = any> extends Path {
  state: State;
  key: string;
}

interface Path {
  pathname: string;
  search: string;
  hash: string;
}
```

</details>

This hook returns the current [`location`][location] object. This can be useful if you'd like to perform some side effect whenever the current location changes.

```tsx
import * as React from 'react';
import { useLocation } from 'react-router-dom';

function App() {
  let location = useLocation();

  React.useEffect(() => {
    // Google Analytics
    ga('send', 'pageview');
  }, [location]);

  return (
    // ...
  );
}
```

## Properties

### `location.hash`

The hash of the current URL.

### `location.key`

The unique key of this location.

### `location.pathname`

The path of the current URL.

### `location.search`

The query string of the current URL.

### `location.state`

The state value of the location created by [`<Link state>`][link-state] or [`navigate`][navigate].

[link-state]: ../components/link#state
[location]: ../utils/location
[navigate]: ./use-navigate
