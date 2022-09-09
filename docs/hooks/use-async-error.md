---
title: useAsyncError
new: true
---

# `useAsyncError`

Returns the rejection value from the nearest [`<Await>`][await] component.

```tsx [4,12]
import { useAsyncError, Await } from "react-router-dom";

function ErrorElement() {
  const error = useAsyncError();
  return (
    <p>Uh Oh, something went wrong! {error.message}</p>
  );
}

<Await
  resolve={promiseThatRejects}
  errorElement={<ErrorElement />}
/>;
```

See the [Deferred Data Guide][deferred] and [`<Await>` docs][await docs] for more information.

[await docs]: ../components/await
[deferred]: ../guides/deferred
