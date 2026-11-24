Prevent `<HydratedRouter>` from re-rendering the previous route during navigation

- Avoid a loop with `<Navigate state={...} replace>` that could exceed Safari's limit on `history.replaceState()` calls
