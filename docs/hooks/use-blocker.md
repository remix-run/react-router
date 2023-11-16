---
title: useBlocker
---

# `useBlocker`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useBlocker(
  shouldBlock: boolean | BlockerFunction
): Blocker;

type BlockerFunction = (args: {
  currentLocation: Location;
  nextLocation: Location;
  historyAction: HistoryAction;
}) => boolean;

type Blocker =
  | {
      state: "unblocked";
      reset: undefined;
      proceed: undefined;
      location: undefined;
    }
  | {
      state: "blocked";
      reset(): void;
      proceed(): void;
      location: Location;
    }
  | {
      state: "proceeding";
      reset: undefined;
      proceed: undefined;
      location: Location;
    };

interface Location<State = any> extends Path {
  state: State;
  key: string;
}

interface Path {
  pathname: string;
  search: string;
  hash: string;
}

enum HistoryAction {
  Pop = "POP",
  Push = "PUSH",
  Replace = "REPLACE",
}
```

</details>

The `useBlocker` hook allows you to prevent the user from navigating away from the current location, and present them with a custom UI to allow them to confirm the navigation.

<docs-info>
This only works for client-side navigations within your React Router application and will not block document requests. To prevent document navigations you will need to add your own <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event" target="_blank">`beforeunload`</a> event handler.
</docs-info>

<docs-warning>
Blocking a user from navigating is a bit of an anti-pattern, so please carefully consider any usage of this hook and use it sparingly. In the de-facto use case of preventing a user navigating away from a half-filled form, you might consider persisting unsaved state to `sessionStorage` and automatically re-filling it if they return instead of blocking them from navigating away.
</docs-warning>

```tsx
function ImportantForm() {
  let [value, setValue] = React.useState("");

  // Block navigating elsewhere when data has been entered into the input
  let blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      value !== "" &&
      currentLocation.pathname !== nextLocation.pathname
  );

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

      {blocker.state === "blocked" ? (
        <div>
          <p>Are you sure you want to leave?</p>
          <button onClick={() => blocker.proceed()}>
            Proceed
          </button>
          <button onClick={() => blocker.reset()}>
            Cancel
          </button>
        </div>
      ) : null}
    </Form>
  );
}
```

For a more complete example, please refer to the [example][example] in the repository.

## Properties

### `state`

The current state of the blocker

- `unblocked` - the blocker is idle and has not prevented any navigation
- `blocked` - the blocker has prevented a navigation
- `proceeding` - the blocker is proceeding through from a blocked navigation

### `location`

When in a `blocked` state, this represents the location to which we blocked a navigation. When in a `proceeding` state, this is the location being navigated to after a `blocker.proceed()` call.

## Methods

### `proceed()`

When in a `blocked` state, you may call `blocker.proceed()` to proceed to the blocked location.

### `reset()`

When in a `blocked` state, you may call `blocker.reset()` to return the blocker back to an `unblocked` state and leave the user at the current location.

[example]: https://github.com/remix-run/react-router/tree/main/examples/navigation-blocking
