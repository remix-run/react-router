---
title: usePrompt
unstable: true
---

# unstable_usePrompt

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data]

<br />
<br />

<docs-warning>This API is experimental and subject to breaking changes in 
minor/patch releases. Please use with caution and pay **very** close attention 
to release notes for relevant changes.</docs-warning>

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_usePrompt.html)

Wrapper around [`useBlocker`](../hooks/useBlocker) to show a [`window.confirm`](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm)
prompt to users instead of building a custom UI with [`useBlocker`](../hooks/useBlocker).

The `unstable_` flag will not be removed because this technique has a lot of
rough edges and behaves very differently (and incorrectly sometimes) across
browsers if users click addition back/forward navigations while the
confirmation is open. Use at your own risk.

```tsx
function ImportantForm() {
  let [value, setValue] = React.useState("");

  // Block navigating elsewhere when data has been entered into the input
  unstable_usePrompt({
    message: "Are you sure?",
    when: ({ currentLocation, nextLocation }) =>
      value !== "" &&
      currentLocation.pathname !== nextLocation.pathname,
  });

  return (
    <Form method="post">
      <label>
        Enter some important data:
        <input
          name="data"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <button type="submit">Save</button>
    </Form>
  );
}
```

## Signature

```tsx
function usePrompt({
  when,
  message,
}: {
  when: boolean | BlockerFunction;
  message: string;
}): void
```

## Params

### options.message

The message to show in the confirmation dialog.

### options.when

A boolean or a function that returns a boolean indicating whether to block the navigation. If a function is provided, it will receive an
object with `currentLocation` and `nextLocation` properties.

## Returns

No return value.

