---
"react-router-dom": minor
"react-router": minor
---

Add `unstable_flushSync` option to `useNavigate`/`useSumbit`/`fetcher.load`/`fetcher.submit` to opt-out of `React.startTransition` and into `ReactDOM.flushSync` for state updates
