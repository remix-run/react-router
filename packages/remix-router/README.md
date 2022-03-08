# Remix Router

The `remix-router` package is the heart of [React Router](https://github.com/remix-run/react-router) and provides all the core functionality for routing, data loading, data mutations,
and transitions.

If you're using React Router, you should never `import` anything directly from
the `remix-router` or `react-router` packages, but you should have everything
you need in either `react-router-dom` or `react-router-native`. Both of those
packages re-export everything from `remix-router` and `react-router`.
