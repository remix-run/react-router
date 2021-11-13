---
title: Lazy Loading
toc: false
---

# Lazy Loading Example

This example demonstrates how to lazily load both

- individual route elements
- entire portions of your route hierarchy

on demand using `React.lazy()` and dynamic `import()`. Using this technique,
pages that are not required on the home page can be split out into separate
bundles, thereby decreasing load time on the initial page and improving
performance.

## Preview

Open this example on [StackBlitz](https://stackblitz.com):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router/tree/main/examples/lazy-loading?file=src/App.tsx)
