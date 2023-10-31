---
title: useLocation
---

# `useLocation`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useLocation(): Location;

interface Location extends Path {
  state: any;
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
more context

Main.tsx

```tsx
    import { Link } from 'react-router-dom'

    const Main = () => {

      return (
        <Link to="/page" state={statefulInfo: 'info'}>Page</Link>
      )
    }

```

Page.tsx

```tsx
   import { useLocation } from 'react-router-dom'

    const Page = () => {
      const location = useLocation()
      {/*
          {pathname: "/Page", search: "", hash: "", state: {statefulInfo: 'info'}, key: "default"}
           this is the object saved in location you can use it 
      */}
      const path = location.pathname
      return (
        <Link to="..">Page</Link>
      )
    }
```

[location]: ../utils/location
