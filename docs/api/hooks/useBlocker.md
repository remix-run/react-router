---
title: useBlocker
---

# useBlocker

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.useBlocker.html)

Allow the application to block navigations within the SPA and present the
user a confirmation dialog to confirm the navigation.  Mostly used to avoid
using half-filled form data.  This does not handle hard-reloads or
cross-origin navigations.

The Blocker object returned by the hook has the following properties:

- **`state`**
  - `unblocked` - the blocker is idle and has not prevented any navigation
  - `blocked` - the blocker has prevented a navigation
  - `proceeding` - the blocker is proceeding through from a blocked navigation
- **`location`**
  - When in a `blocked` state, this represents the `Location` to which we
    blocked a navigation. When in a `proceeding` state, this is the location
    being navigated to after a `blocker.proceed()` call.
- **`proceed()`**
  - When in a `blocked` state, you may call `blocker.proceed()` to proceed to the
    blocked location.
- **`reset()`**
  - When in a `blocked` state, you may call `blocker.reset()` to return the blocker
    back to an `unblocked` state and leave the user at the current location.

```tsx
import { useCallback, useState } from "react";
import { BlockerFunction, useBlocker } from "react-router";

export function ImportantForm() {
  const [value, setValue] = useState("");

  const shouldBlock = useCallback<BlockerFunction>(
    () => value !== "",
    [value]
  );
  const blocker = useBlocker(shouldBlock);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setValue("");
        if (blocker.state === "blocked") {
          blocker.proceed();
        }
      }}
    >
      <input
        name="data"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button type="submit">Save</button>

      {blocker.state === "blocked" ? (
        <>
          <p style={{ color: "red" }}>
            Blocked the last navigation to
          </p>
          <button
            type="button"
            onClick={() => blocker.proceed()}
          >
            Let me through
          </button>
          <button
            type="button"
            onClick={() => blocker.reset()}
          >
            Keep me here
          </button>
        </>
      ) : blocker.state === "proceeding" ? (
        <p style={{ color: "orange" }}>
          Proceeding through blocked navigation
        </p>
      ) : (
        <p style={{ color: "green" }}>
          Blocker is currently unblocked
        </p>
      )}
    </form>
  );
}
```

## Signature

```tsx
useBlocker(shouldBlock: boolean | BlockerFunction): Blocker 
```

## Params

### shouldBlock

Either a boolean or a function returning a boolean which indicates whether the navigation should be blocked. The function format receives a single object parameter containing the `currentLocation`, `nextLocation`, and `historyAction` of the potential navigation.

