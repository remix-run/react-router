React Router API 
================

- [`Router`](/docs/api/Router.md)

- Components
  - [`DefaultRoute`](/docs/api/elements/DefaultRoute.md)
  - [`Link`](/docs/api/elements/Link.md)
  - [`NotFoundRoute`](/docs/api/elements/NotFoundRoute.md)
  - [`Redirect`](/docs/api/elements/Redirect.md)
  - [`Route`](/docs/api/elements/Route.md)
  - [`RouteHandler`](/docs/api/elements/RouteHandler.md)
  - [`Routes`](/docs/api/elements/Routes.md)

- Mixins
  - [`ActiveState`](/docs/api/mixins/ActiveState.md)
  - [`CurrentPath`](/docs/api/mixins/CurrentPath.md)
  - [`Navigation`](/docs/api/mixins/Navigation.md)

- Misc 
  - [`transition`](/docs/api/misc/transition.md)

Public Modules
--------------

While there are many modules in this repository, only those found on the
default export are considered public.

```js
var Router = require('react-router');
var Link = Router.Link // yes
var Link = require('react-router/modules/elements/Link') // no
```
