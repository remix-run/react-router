---
title: routes.ts
order: 2
---

# routes.ts

[MODES: framework]

## Summary

<docs-info>
This file is required
</docs-info>

[Reference Documentation ↗](https://api.reactrouter.com/v7/interfaces/_react_router_dev.routes.RouteConfigEntry.html)

Configuration file that maps URL patterns to route modules in your application.

See the [routing guide][routing] for more information.

## Examples

### Basic

Configure your routes as an array of objects.

```tsx filename=app/routes.ts
import {
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  route("some/path", "./some/file.tsx"),
  // pattern ^           ^ module file
] satisfies RouteConfig;
```

You can use the following helpers to create route config entries:

- [`route`][route] — Helper function for creating a route config entry
- [`index`][index] — Helper function for creating a route config entry for an index route
- [`layout`][layout] — Helper function for creating a route config entry for a layout route
- [`prefix`][prefix] — Helper function for adding a path prefix to a set of routes without needing to introduce a parent route
- [`relative`][relative] — Creates a set of route config helpers that resolve file paths relative to the given directory. Designed to support splitting route config into multiple files within different directories

### File-based Routing

If you prefer to define your routes via file naming conventions rather than configuration, the `@react-router/fs-routes` package provides a [file system routing convention][file-route-conventions]:

```ts filename=app/routes.ts
import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes() satisfies RouteConfig;
```

### Route Helpers

[routing]: ../../start/framework/routing
[route]: https://api.reactrouter.com/v7/functions/_react_router_dev.routes.route.html
[index]: https://api.reactrouter.com/v7/functions/_react_router_dev.routes.index.html
[layout]: https://api.reactrouter.com/v7/functions/_react_router_dev.routes.layout.html
[prefix]: https://api.reactrouter.com/v7/functions/_react_router_dev.routes.prefix.html
[relative]: https://api.reactrouter.com/v7/functions/_react_router_dev.routes.relative.html
[file-route-conventions]: ../../how-to/file-route-conventions
