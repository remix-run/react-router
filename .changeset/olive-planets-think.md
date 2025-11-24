---
"react-router": patch
---

Add new `unstable_useTransitions` flag to routers to give users control over the usage of [`React.startTransition`](https://react.dev/reference/react/startTransition) and [`React.useOptimistic`](https://react.dev/reference/react/useOptimistic).

- Framework Mode + Data Mode:
  - `<HydratedRouter unstable_transition>`/`<RouterProvider unstable_transition>`
  - When left unset (current default behavior)
    - Router state updates are wrapped in `React.startTransition`
    - ⚠️ This can lead to buggy behaviors if you are wrapping your own navigations/fetchers in `React.startTransition`
    - You should set the flag to `true` if you run into this scenario to get the enhanced `useOptimistic` behavior (requires React 19)
  - When set to `true`
    - Router state updates remain wrapped in `React.startTransition` (as they are without the flag)
    - `Link`/`Form` navigations will be wrapped in `React.startTransition`
    - A subset of router state info will be surfaced to the UI _during_ navigations via `React.useOptimistic` (i.e., `useNavigation()`, `useFetchers()`, etc.)
      - ⚠️ This is a React 19 API so you must also be React 19 to opt into this flag for Framework/Data Mode
  - When set to `false`
    - The router will not leverage `React.startTransition` or `React.useOptimistic` on any navigations or state changes
- Declarative Mode
  - `<BrowserRouter unstable_useTransitions>`
  - When left unset
    - Router state updates are wrapped in `React.startTransition`
  - When set to `true`
    - Router state updates remain wrapped in `React.startTransition` (as they are without the flag)
    - `Link`/`Form` navigations will be wrapped in `React.startTransition`
  - When set to `false`
    - the router will not leverage `React.startTransition` on any navigations or state changes
