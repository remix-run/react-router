---
title: unstable_usePrompt
---

# unstable_usePrompt

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.unstable_usePrompt.html)

Wrapper around useBlocker to show a window.confirm prompt to users instead of building a custom UI with [useBlocker](../hooks/useBlocker).

The `unstable_` flag will not be removed because this technique has a lot of rough edges and behaves very differently (and incorrectly sometimes) across browsers if users click addition back/forward navigations while the confirmation is open. Use at your own risk.

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
unstable_usePrompt(options): void
```

## Params

### options

_No documentation_
