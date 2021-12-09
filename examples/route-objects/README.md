---
title: Route Objects
toc: false
---

# Route Objects Example

This example demonstrates how to use the `useRoutes()` hook to define and render routes using regular JavaScript objects instead of `<Routes>` and `<Route>` elements. This is mainly a stylistic preference that may make more sense in some scenarios, depending on the data structures you're working with to define your routes.

One interesting thing to note is that even if you don't use this hook directly, `<Routes>` uses it internally. So either way you're using the exact same code path!

## Preview

Open this example on [StackBlitz](https://stackblitz.com):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router/tree/main/examples/route-objects?file=src/App.tsx)
