Preserve falsy `location.state` values in `createBrowserHistory()` and `createHashHistory()`

- Use nullish coalescing when reading `history.state.usr` so falsy values (`false`, `0`, `""`, `NaN`) are not coerced to `null` across `<BrowserRouter>`, `<HashRouter>`, `createBrowserRouter()`, `createHashRouter()`, and `<HydratedRouter>`
