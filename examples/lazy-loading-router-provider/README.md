---
title: Lazy Loading with RouterProvider
toc: false
---

# Lazy Loading Example using `RouterProvider`

This example demonstrates how to lazily load individual route elements on demand `route.lazy()` and dynamic `import()`. Using this technique, pages that are not required on the home page can be split out into separate bundles, thereby decreasing load time on the initial page and improving performance.

## Preview

Open this example on [StackBlitz](https://stackblitz.com):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router/tree/main/examples/lazy-loading-router-provider?file=src/App.tsx)
