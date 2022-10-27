---
title: useLocation
---

# `useLocation`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useLocation(): Location;

interface Location extends Path {
  state: unknown;
  key: Key;
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

[location]: ../utils/location
