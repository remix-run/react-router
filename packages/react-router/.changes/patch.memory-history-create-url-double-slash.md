Treat leading double slashes as pathname separators in `createMemoryHistory().createURL()`

- Align memory history with `createBrowserHistory()` and the static router so a location such as `//about` produces `http://localhost//about` instead of parsing `about` as the host, which previously sent loader and action requests to the wrong origin/path in data routers running without a browser (SSR tests, React Native, other non-browser runtimes)
