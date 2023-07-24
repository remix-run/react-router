---
title: Authentication (using RouterProvider)
toc: false
---

# Auth Example (using RouterProvider)

This example demonstrates how to restrict access to routes to authenticated users when using `<RouterProvider>`.

The primary difference compared to how authentication was handled in `BrowserRouter` is that since `RouterProvider` decouples fetching from rendering, we can no longer rely on React context and/or hooks to get our user authentication status. We need access to this information outside of the React tree so we can use it in our route `loader` and `action` functions.

For some background information on this design choice, please check out the [Remixing React Router](https://remix.run/blog/remixing-react-router) blog post and Ryan's [When to Fetch](https://www.youtube.com/watch?v=95B8mnhzoCM) talk from Reactathon.

Be sure to pay attention to the following features in this example:

- The use of a standalone object _outside of the React tree_ that manages our authentication state
- The use of `loader` functions to check for user authentication
- The use of `redirect` from the `/protected` `loader` when the user is not logged in
- The use of a `<Form>` and an `action` to perform the login
- The use of a `from` search param and a `redirectTo` hidden input to preserve the previous location so you can send the user there after they authenticate
- The use of `<Form replace>` to replace the `/login` route in the history stack so the user doesn't return to the login page when clicking the back button after logging in
- The use of a `<fetcher.Form>` and an `action` to perform the logout

## Preview

Open this example on [StackBlitz](https://stackblitz.com):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router/tree/main/examples/auth-router-provider?file=src/App.tsx)
