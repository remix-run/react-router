---
title: useNavigate
---

# useNavigate

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Hey! Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please find the definition of this API and edit the JSDoc
comments accordingly and this file will be re-generated once those
changes are merged.
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useNavigate.html)

Returns a function that lets you navigate programmatically in the browser in
response to user interactions or effects.

It's often better to use [`redirect`](../utils/redirect) in [`action`](../../start/framework/route-module#action)/[`loader`](../../start/framework/route-module#loader) functions than this hook.

The returned function signature is `navigate(to, options?)/navigate(delta)` where:

* `to` can be a string path, a `To` object, or a number (delta)
* `options` contains options for modifying the navigation
  * `flushSync`: Wrap the DOM updates in `ReactDom.flushSync`
  * `preventScrollReset`: Do not scroll back to the top of the page after navigation
  * `relative`: "route" or "path" to control relative routing logic
  * `replace`: Replace the current entry in the history stack
  * `state`: Optional history state to include with the new `Location`
  * `viewTransition`: Enable `document.startViewTransition` for this navigation

```tsx
import { useNavigate } from "react-router";

function SomeComponent() {
  let navigate = useNavigate();
  return (
    <button onClick={() => navigate(-1)}>
      Go Back
    </button>
  );
}
```

## Signature

```tsx
useNavigate(): NavigateFunction
```

## Examples

### Navigate to another path

```tsx
navigate("/some/route");
navigate("/some/route?search=param");
```

### Navigate with a `To` object

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

### Navigate back or forward in the history stack

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

### Replace the current entry in the history stack

This will remove the current entry in the history stack, replacing it with a new one, similar to a server side redirect.

```tsx
navigate("/some/route", { replace: true });
```

### Prevent Scroll Reset

[MODES: framework, data]

<br/>
<br/>

To prevent `<ScrollRestoration>` from resetting the scroll position, use the `preventScrollReset` option.

```tsx
navigate("?some-tab=1", { preventScrollReset: true });
```

For example, if you have a tab interface connected to search params in the middle of a page and you don't want it to scroll to the top when a tab is clicked.

