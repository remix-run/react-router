---
"react-router": minor
---

Remove the `unstable_` prefix from the [`useBlocker`](https://reactrouter.com/en/main/hooks/use-blocker) hook as it's been in use for enough time that we are confident in the API. We do not plan to remove the prefix from `unstable_usePrompt` due to differences in how browsers handle `window.confirm` that prevent React Router from guaranteeing consistent/correct behavior.
