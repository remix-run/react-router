---
title: useNavigate
---

# useNavigate

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useNavigate.html)

Returns a function that lets you navigate programmatically in the browser in
response to user interactions or effects.

It's often better to use [`redirect`](../utils/redirect) in [`action`](../../start/framework/route-module#action)/[`loader`](../../start/framework/route-module#loader)
functions than this hook.

The returned function signature is `navigate(to, options?)`/`navigate(delta)` where:

* `to` can be a string path, a [`To`](https://api.reactrouter.com/v7/types/react_router.To.html) object, or a number (delta)
* `options` contains options for modifying the navigation
  * These options work in all modes (Framework, Data, and Declarative):
    * `relative`: `"route"` or `"path"` to control relative routing logic
    * `replace`: Replace the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack
    * `state`: Optional [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state) to include with the new [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html)
  * These options only work in Framework and Data modes:
    * `flushSync`: Wrap the DOM updates in [`ReactDom.flushSync`](https://react.dev/reference/react-dom/flushSync)
    * `preventScrollReset`: Do not scroll back to the top of the page after navigation
    * `viewTransition`: Enable [`document.startViewTransition`](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) for this navigation

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
function useNavigate(): NavigateFunction
```

## Returns

A navigate function for programmatic navigation

## Examples

### Navigate to another path

```tsx
navigate("/some/route");
navigate("/some/route?search=param");
```

### Navigate with a [`To`](https://api.reactrouter.com/v7/types/react_router.To.html) object

All properties are optional.

```tsx
navigate({
  pathname: "/some/route",
  search: "?search=param",
  hash: "#hash",
  state: { some: "state" },
});
```

If you use `state`, that will be available on the [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html) object on
the next page. Access it with `useLocation().state` (see [`useLocation`](../hooks/useLocation)).

### Navigate back or forward in the history stack

```tsx
// back
// often used to close modals
navigate(-1);

// forward
// often used in a multistep wizard workflows
navigate(1);
```

Be cautious with `navigate(number)`. If your application can load up to a
route that has a button that tries to navigate forward/back, there may not be
a [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
entry to go back or forward to, or it can go somewhere you don't expect
(like a different domain).

Only use this if you're sure they will have an entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack to navigate to.

### Replace the current entry in the history stack

This will remove the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack, replacing it with a new one, similar to a server side redirect.

```tsx
navigate("/some/route", { replace: true });
```

### Prevent Scroll Reset

[MODES: framework, data]

<br/>
<br/>

To prevent [`<ScrollRestoration>`](../components/ScrollRestoration) from resetting
the scroll position, use the `preventScrollReset` option.

```tsx
navigate("?some-tab=1", { preventScrollReset: true });
```

For example, if you have a tab interface connected to search params in the
middle of a page, and you don't want it to scroll to the top when a tab is
clicked.

### Return Type Augmentation

Internally, `useNavigate` uses a separate implementation when you are in
Declarative mode versus Data/Framework mode - the primary difference being
that the latter is able to return a stable reference that does not change
identity across navigations. The implementation in Data/Framework mode also
returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
that resolves when the navigation is completed. This means the return type of
`useNavigate` is `void | Promise<void>`. This is accurate, but can lead to
some red squigglies based on the union in the return value:

- If you're using `typescript-eslint`, you may see errors from
  [`@typescript-eslint/no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises)
- In Framework/Data mode, `React.use(navigate())` will show a false-positive
  `Argument of type 'void | Promise<void>' is not assignable to parameter of
  type 'Usable<void>'` error

The easiest way to work around these issues is to augment the type based on the
router you're using:

```ts
// If using <BrowserRouter>
declare module "react-router" {
  interface NavigateFunction {
    (to: To, options?: NavigateOptions): void;
    (delta: number): void;
  }
}

// If using <RouterProvider> or Framework mode
declare module "react-router" {
  interface NavigateFunction {
    (to: To, options?: NavigateOptions): Promise<void>;
    (delta: number): Promise<void>;
  }
}
```

