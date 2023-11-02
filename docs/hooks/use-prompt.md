---
title: unstable_usePrompt
---

# `unstable_usePrompt`

<details>
  <summary>Type declaration</summary>

```tsx
declare function unstable_usePrompt({
  when,
  message,
}: {
  when: boolean | BlockerFunction;
  message: string;
}) {

type BlockerFunction = (args: {
  currentLocation: Location;
  nextLocation: Location;
  historyAction: HistoryAction;
}) => boolean;

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

The `unstable_usePrompt` hook allows you to prompt the user for confirmation via [`window.confirm`][window-confirm] prior to navigating away from the current location.

<docs-info>
This only works for client-side navigations within your React Router application and will not block document requests. To prevent document navigations you will need to add your own <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event" target="_blank">`beforeunload`</a> event handler.
</docs-info>

<docs-warning>
Blocking a user from navigating is a bit of an anti-pattern, so please carefully consider any usage of this hook and use it sparingly. In the de-facto use case of preventing a user navigating away from a half-filled form, you might consider persisting unsaved state to `sessionStorage` and automatically re-filling it if they return instead of blocking them from navigating away.
</docs-warning>

<docs-warning>
We do not plan to remove the `unstable_` prefix from this hook because the behavior is non-deterministic across browsers when the prompt is open, so React Router cannot guarantee correct behavior in all scenarios.  To avoid this non-determinism, we recommend using `useBlocker` instead which also gives you control over the confirmation UX.
</docs-warning>

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

[window-confirm]: https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm
