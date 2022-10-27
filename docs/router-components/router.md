---
title: Router
---

# `<Router>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Router(
  props: RouterProps
): React.ReactElement | null;

interface RouterProps {
  basename?: string;
  children?: React.ReactNode;
  location: Partial<Location> | string;
  navigationType?: NavigationType;
  navigator: Navigator;
  static?: boolean;
}
```

</details>

`<Router>` is the low-level interface that is shared by all router components (like `<BrowserRouter>` and `<StaticRouter>`). In terms of React, `<Router>` is a [context provider][context] that supplies routing information to the rest of the app.

You probably never need to render a `<Router>` manually. Instead, you should use one of the higher-level routers depending on your environment. You only ever need one router in a given app.

The `<Router basename>` prop may be used to make all routes and links in your app relative to a "base" portion of the URL pathname that they all share. This is useful when rendering only a portion of a larger app with React Router or when your app has multiple entry points. Basenames are not case-sensitive.

[context]: https://reactjs.org/docs/context.html#contextprovider
