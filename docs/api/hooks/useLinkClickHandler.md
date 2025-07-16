---
title: useLinkClickHandler
---

# useLinkClickHandler

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useLinkClickHandler.html)

Handles the click behavior for router [`<Link>`](../components/Link) components. This is useful if
you need to create custom `<Link>` components with the same click behavior we
use in our exported `<Link>`.

## Signature

```tsx
function useLinkClickHandler<E extends Element = HTMLAnchorElement>(
  to: To,
  {
    target,
    replace: replaceProp,
    state,
    preventScrollReset,
    relative,
    viewTransition,
  }: {
    target?: React.HTMLAttributeAnchorTarget;
    replace?: boolean;
    state?: any;
    preventScrollReset?: boolean;
    relative?: RelativeRoutingType;
    viewTransition?: boolean;
  } = ,
): (event: React.MouseEvent<E, MouseEvent>) => void {}
```

## Params

### to

The URL to navigate to, can be a string or a partial [`Path`](https://api.reactrouter.com/v7/interfaces/react_router.Path.html).

### options.preventScrollReset

Whether to prevent the scroll position from being reset to the top of the viewport on completion of the navigation when
using the [`<ScrollRestoration>`](../components/ScrollRestoration) component.
Defaults to `false`.

### options.relative

The [relative routing type](https://api.reactrouter.com/v7/types/react_router.RelativeRoutingType.html) to use for the link. Defaults to `"route"`.

### options.replace

Whether to replace the current history entry instead of pushing a new one. Defaults to `false`.

### options.state

The state to add to the history entry for this navigation. Defaults to `undefined`.

### options.target

The target attribute for the link. Defaults to `undefined`.

### options.viewTransition

Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) for this navigation. To apply specific styles during the transition see [`useViewTransitionState`](../hooks/useViewTransitionState).
Defaults to `false`.

## Returns

A click handler function that can be used in a custom Link component.

