Allow `.server` module imports in Vitest tests that run in Node with Vitest's default middleware-mode server

The check still applies in Browser Mode and when the test runner's Vite server listens, such as single-project runs with `--ui` or `--api`.
