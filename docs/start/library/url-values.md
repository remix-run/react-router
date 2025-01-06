---
title: URL Values
---

# URL Values

## Route Params

Route params are the parsed values from a dynamic segment.

```tsx
<Route path="/concerts/:city" element={<City />} />
```

In this case, `:city` is the dynamic segment. The parsed value for that city will be available from `useParams`

```tsx
import { useParams } from "react-router";

function City() {
  let { city } = useParams();
  let data = useFakeDataLibrary(`/api/v2/cities/${city}`);
  // ...
}
```

## URL Search Params

Search params are the values after a `?` in the URL. They are accessible from `useSearchParams`, which returns an instance of [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

```tsx
function SearchResults() {
  let [searchParams] = useSearchParams();
  return (
    <div>
      <p>
        You searched for <i>{searchParams.get("q")}</i>
      </p>
      <FakeSearchResults />
    </div>
  );
}
```

## Location Object

React Router creates a custom `location` object with some useful information on it accessible with `useLocation`.

```tsx
function useAnalytics() {
  let location = useLocation();
  useEffect(() => {
    sendFakeAnalytics(location.pathname);
  }, [location]);
}

function useScrollRestoration() {
  let location = useLocation();
  useEffect(() => {
    fakeRestoreScroll(location.key);
  }, [location]);
}
```
