Fix concurrent Framework Mode route config loading so `flatRoutes()` resolves files against the correct app directory when multiple Vite configs load in one process.

- Isolate app-directory state with async context during route config execution.
