---
title: useNavigate
---

# useNavigate

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useNavigate.html)

Returns a function that lets you navigate programmatically in the browser in response to user interactions or effects.

```tsx
import { useNavigate } from "react-router";

function SomeComponent() {
  let navigate = useNavigate();
  return (
    <button
      onClick={() => {
        navigate(-1);
      }}
    />
  );
}
```

It's often better to use [redirect](../utils/redirect) in [ActionFunction](../Other/ActionFunction) and [LoaderFunction](../Other/LoaderFunction) than this hook.

## Signature

```tsx
navigate(
  to: To,
  options?: {
    flushSync?: boolean;
    preventScrollReset?: boolean;
    relative?: RelativeRoutingType;
    replace?: boolean;
    state?: any;
    viewTransition?: boolean;
  }
): void | Promise<void>;
```

## Examples

### Navigate to another path:

```tsx
navigate("/some/route");
navigate("/some/route?search=param");
```

### Navigate with a `To` object:

All properties are optional.

```tsx
navigate({
  pathname: "/some/route",
  search: "?search=param",
  hash: "#hash",
  state: { some: "state" },
});
```

If you use `state`, that will be available on the `location` object on the next page. Access it with `useLocation().state` (see [useLocation](./useLocation)).

### Navigate back or forward in the history stack:

```tsx
// back
// often used to close modals
navigate(-1);

// forward
// often used in a multi-step wizard workflows
navigate(1);
```

Be cautions with `navigate(number)`. If your application can load up to a route that has a button that tries to navigate forward/back, there may not be a history entry to go back or forward to, or it can go somewhere you don't expect (like a different domain).

Only use this if you're sure they will have an entry in the history stack to navigate to.

### Replace the current entry in the history stack:

This will remove the current entry in the history stack, replacing it with a new one, similar to a server side redirect.

```tsx
navigate("/some/route", { replace: true });
```

### Prevent Scroll Reset

[modes: framework, data]

To prevent `<ScrollRestoration>` from resetting the scroll position, use the `preventScrollReset` option.

```tsx
navigate("?some-tab=1", { preventScrollReset: true });
```

For example, if you have a tab interface connected to search params in the middle of a page and you don't want it to scroll to the top when a tab is clicked.
