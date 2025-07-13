---
title: useBeforeUnload
---

# useBeforeUnload

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useBeforeUnload.html)

Set up a callback to be fired on [Window's `beforeunload` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).

## Signature

```tsx
useBeforeUnload(callback: (event: BeforeUnloadEvent) => any, options?: {
    capture?: boolean;
}): void
```

## Params

### callback

The callback to be called when the `beforeunload` event is fired. This callback receives the `BeforeUnloadEvent` as its argument.

### options.capture

If `true`, the event will be captured during the capture phase. Defaults to `false`.

