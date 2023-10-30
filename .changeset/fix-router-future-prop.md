---
"react-router": patch
"react-router-dom": patch
---

Fix the `future` prop on `BrowserRouter`, `HashRouter` and `MemoryRouter` so that it accepts a `Partial<FutureConfig>` instead of requiring all flags to be included.
