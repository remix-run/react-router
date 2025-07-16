---
title: Navigate
---

# Navigate

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/components.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Navigate.html)

A component-based version of [`useNavigate`](../hooks/useNavigate) to use in a [`React.Component
Class`](https://reactjs.org/docs/react-component.html) where hooks are not
able to be used.

It's recommended to avoid using this component in favor of [`useNavigate`](../hooks/useNavigate)

```tsx
<Navigate to="/tasks" />
```

## Signature

```tsx
function Navigate({ to, replace, state, relative, }: NavigateProps): null
```

## Props

### to

The path to navigate to. This can be a string or an object

### replace

Whether to replace the current entry in the history stack

### state

State to pass to the new location to store in [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state).

### relative

How to interpret relative routing in the `to` prop. See [`RelativeRoutingType`](https://api.reactrouter.com/v7/types/react_router.RelativeRoutingType.html).

