---
title: Future Flags
order: 1
---

# Future Flags and Deprecations

This guide walks you through the process of adopting future flags in your React Router app. By following this strategy, you will be able to upgrade to the next major version of React Router with minimal changes. To read more about future flags see [API Development Strategy][api-development-strategy].

We highly recommend you make a commit after each step and ship it instead of doing everything all at once. Most flags can be adopted in any order, with exceptions noted below.

## Update to latest v7.x

First update to the latest minor version of v7.x to have the latest future flags. You may see a number of deprecation warnings as you upgrade, which we'll cover below.

👉 Update to latest v7

```sh
npm install react-router@7 @react-router/{dev,node,etc.}@7
```

## Unstable Future Flags (Optional)

We document some [unstable] flags here as a reference for folks contributing to the project via beta testing, but they are not generally recommended for production use and may having breaking changes patch/minor releases - adopt with caution!

_No current unstable flags to document_

[api-development-strategy]: ../community/api-development-strategy
[unstable]: ../community/api-development-strategy#unstable-flags
[observability]: ../how-to/instrumentation
[vite-environment]: https://vite.dev/guide/api-environment
