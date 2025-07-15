---
title: useViewTransitionState
---

# useViewTransitionState

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx#L2547
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useViewTransitionState.html)

This hook returns `true` when there is an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
to the specified location. This can be used to apply finer-grained styles to
elements to further customize the view transition. This requires that view
transitions have been enabled for the given navigation via [`LinkProps.viewTransition`](https://api.reactrouter.com/v7/interfaces/react_router.LinkProps.html#viewTransition)
(or the `Form`, `submit`, or `navigate` call)

## Signature

```tsx
useViewTransitionState(to: To, { relative }: {
    relative?: RelativeRoutingType;
} = {})
```

## Params

### options.relative

The relative routing type to use when resolving the `to` location, defaults to `"route"`. See [`RelativeRoutingType`](https://api.reactrouter.com/v7/types/react_router.RelativeRoutingType.html) for more details.

### to

The [`To`](https://api.reactrouter.com/v7/types/react_router.To.html) location to check for an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).

## Returns

`true` if there is an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) to the specified [`Location`](https://api.reactrouter.com/v7/interfaces/react_router.Location.html), otherwise `false`.

