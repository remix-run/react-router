---
title: useRevalidator
new: true
---

# `useRevalidator`

This hook allows you to revalidate the data for any reason. React Router automatically revalidates the data after actions are called, but you may want to revalidate for other reasons like when focus returns to the window.

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```tsx
import { useRevalidator } from "react-router-dom";

function WindowFocusRevalidator() {
  let revalidator = useRevalidator();

  useFakeWindowFocus(() => {
    revalidator.revalidate();
  });

  return (
    <div hidden={revalidator.state === "idle"}>
      Revalidating...
    </div>
  );
}
```

Again, React Router already revalidates the data on the page automatically in the vast majority of cases so this should rarely be needed. If you find yourself using this for normal CRUD operations on your data in response to user interactions, you're probably not taking advantage of the other APIs like [`<Form>`][form], [`useSubmit`][usesubmit], or [`useFetcher`][usefetcher] that do this automatically.

## `revalidator.state`

Tells you the state the revalidation is in, either `"idle"` or `"loading"`.

This is useful for creating loading indicators and spinners to let the user know the app is thinking.

## `revalidator.revalidate()`

This initiates a revalidation.

```tsx
function useLivePageData() {
  let revalidator = useRevalidator();
  let interval = useInterval(5000);

  useEffect(() => {
    if (revalidator.state === "idle") {
      revalidator.revalidate();
    }
  }, [interval]);
}
```

## Notes

While you can render multiple occurrences of `useRevalidator` at the same time, underneath it is a singleton. This means when one `revalidator.revalidate()` is called, all instances go into the `"loading"` state together (or rather, they all update to report the singleton state).

Race conditions are automatically handled when calling `revalidate()` when a revalidation is already in progress.

If a navigation happens while a revalidation is in flight, the revalidation will be cancelled and fresh data will be requested from all loaders for the next page.

[form]: ../components/form
[usefetcher]: ./use-fetcher
[usesubmit]: ./use-submit
[pickingarouter]: ../routers/picking-a-router
