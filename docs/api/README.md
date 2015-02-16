React Router API 
================

- [`Router.run`](/docs/api/run.md)
- [`Router.create`](/docs/api/create.md)
- [`Location`](/docs/api/Location.md)
- [`Transition`](/docs/api/Transition.md)

- Renderable Components
  - [`RouteHandler`](/docs/api/components/RouteHandler.md)
  - [`Link`](/docs/api/components/Link.md)

- Configuration Components
  - [`Route`](/docs/api/components/Route.md)
  - [`DefaultRoute`](/docs/api/components/DefaultRoute.md)
  - [`NotFoundRoute`](/docs/api/components/NotFoundRoute.md)
  - [`Redirect`](/docs/api/components/Redirect.md)

- Mixins
  - [`State`](/docs/api/mixins/State.md)
  - [`Navigation`](/docs/api/mixins/Navigation.md)

Public Modules
--------------

While there are many modules in this repository, only those found on the
default export are considered public.

```js
var Router = require('react-router');
var Link = Router.Link // yes
var Link = require('react-router/components/Link') // no
```
