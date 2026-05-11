Prevent concurrent route config loads from sharing app directory state.

This fixes route resolution for Framework Mode apps that use `flatRoutes()` while multiple Vite configs are resolved at the same time.
