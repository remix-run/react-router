React Router API 
================

- [`Router`](/docs/api/Router.md)

- [`Router.run`](/docs/api/run.md)

- [`Router.create`](/docs/api/create.md)

- Components
  - [`DefaultRoute`](/docs/api/components/DefaultRoute.md)
  - [`Link`](/docs/api/components/Link.md)
  - [`NotFoundRoute`](/docs/api/components/NotFoundRoute.md)
  - [`Redirect`](/docs/api/components/Redirect.md)
  - [`Route`](/docs/api/components/Route.md)
  - [`RouteHandler`](/docs/api/components/RouteHandler.md)

- Mixins
  - [`State`](/docs/api/mixins/State.md)
  - [`Navigation`](/docs/api/mixins/Navigation.md)

- Misc 
  - [`Location`](/docs/api/misc/Location.md)
  - [`transition`](/docs/api/misc/transition.md)

Public Modules
--------------

While there are many modules in this repository, only those found on the
default export are considered public.

```js
var Router = require('react-router');
var Link = Router.Link // yes
var Link = require('react-router/modules/components/Link') // no
```
