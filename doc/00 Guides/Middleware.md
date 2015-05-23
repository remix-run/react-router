React Router works by a stack of components that each have one
child. The first in line is a [`History`][History] component responsible
for listening to the URL and passing a [`location`][location] to its
child, a [`RouterMatcher`][RouteMatcher]. The `Router` is responsible for matching
routes to the location, gathering up the route components, and then
passing all of its state to the next middleware component in line.

Its common for middleware to read props from your [routes][Route]. For
example, `RestoreScroll` reads `ignoreScroll` from your routes. When
createing middleware, do not hesitate to add API to routes.

Typically you just import [`Router`][Router] into your app and this is all
hidden from you, but you can do it all yourself, and add your own
middleware to the stack.

Creating Middleware
-------------------

- Each component in the stack must pass the `props` it receives to the
  next component. Think of `props` as `env` in a typical middleware
  stack.

- Use `PropTypes` to make things more productive for everybody.

- Props and context may be shadowed, even completely replaced.  Object
  identities should not matter.

- Middleware can "pause the world" while doing asynchronous work by
  rendering its previous props and shadowing things on context. Make
  sure anything you put on props or context is okay with this so that
  middleware down the line doesn't get "current" information instead of
  the "paused" information.

- Use context as a last resort.

- Don't complain about context.

  [History]:#TODO
  [location]:#TODO
  [Router]:#TODO
  [Route]:#TODO
  [RouteMatcher]:#TODO

