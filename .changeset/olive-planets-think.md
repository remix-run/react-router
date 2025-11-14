---
"react-router": patch
---

Add new `unstable_useTransitions` flag to routers to give users control over the usage of [`React.startTransition`](https://react.dev/reference/react/startTransition) and [`React.useOptimistic`](https://react.dev/reference/react/useOptimistic).

- Framework Mode + Data Mode:
  - `<HydratedRouter unstable_transition>`/`<RouterProvider unstable_transition>`
  - When left unset (current default behavior), all state updates are wrapped in `React.startTransition`
    - ⚠️ This can lead to buggy behaviors if you are wrapping your own navigations/fetchers in `React.startTransition`
    - You should set the flag to `true` if you run into this scenario
  - When set to `true`, all router navigations and state changes will be wrapped
    in `React.startTransition` and router state changes will _also_ be sent through
    `React.useOptimistic` to surface mid-navigation router state changes to the UI (i.e., `useNavigation()`)
  - When set to `false`, the router will not leverage `React.startTransition` or
    `React.useOptimistic` on any navigations or state changes
- Declarative Mode
  - `<BrowserRouter unstable_useTransitions>`
  - When left unset, all router state updates are wrapped in `React.startTransition`
  - When set to `true`, all router navigations and state updates will be wrapped
    in `React.startTransition`
  - When set to `false`, the router will not leverage `React.startTransition` on
    any navigations or state changes
