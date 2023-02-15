---
title: middleware
new: true
---

# `middleware`

React Router tries to avoid network waterfalls by running loaders in parallel. This can cause some code duplication for logic required across multiple loaders (or actions) such as validating a user session. Middleware is designed to give you a single location to put this type of logic that is shared amongst many loaders/actions. Middleware can be defined on any route and is run _sequentially_ top-down _before_ a loader/action call and then bottom-up _after_ the call.

Because they are run sequentially, you can easily introduce inadvertent network waterfalls and slow down your page loads and route transitions. Please use carefully!

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

<docs-warning>This feature is currently enabled via a `future.unstable_middleware` flag passed to `createBrowserRouter`</docs-warning>

```tsx [2,6-26,32]
// Context allows strong types on middleware-provided values
let userContext = createMiddlewareContext<User>();

<Route
  path="account"
  middleware={async ({ request, context }) => {
    let user = getUser(request);

    // Provide user object to all child routes
    context.set(userContext, user);

    // Continue the Remix request chain running all child middlewares sequentially,
    // followed by all matched loaders in parallel.  The response from the underlying
    // loader is then bubbles back up the middleware chain via the return value.
    let response = await context.next();

    // Set common outgoing headers on all responses
    response.headers.set("X-Custom", "Stuff");

    // Return the altered response
    return response;
  }}
>
  <Route
    path="profile"
    loader={async ({ context }) => {
      // Guaranteed to have a user if this loader runs!
      let user = context.get(userContext);
      let data = await getProfile(user);
      return json(data);
    }}
  />
</Route>;
```

## Arguments

Middleware receives the same arguments as a `loader`/`action` (`request` and `params`) as well as an additional `context` parameter. `context` behaves a bit like [React Context][react-context] in that you create a context which is the strongly-typed to the value you provide.

```tsx
let userContext = createMiddlewareContext<User>();
// context.get(userContext)       => Return type is User
// context.set(userContext, user) => Requires `user` be of type User
```

When middleware is enabled, this `context` object is also made available to actions and loaders to retrieve values set by middlewares.

## Logic Flow

Middleware is designed to solve 4 separate use-cases with a single API to keep the API surface compact:

- I want to run some logic before a loader
- I want to run some logic after a loader
- I want to run some logic before an action
- I want to run some logic after an action

To support this we adopted an API inspired by the middleware implementation in [Fresh][fresh-middleware] where the function gives you control over the invocation of child logic, thus allowing you to run logic both before and after the child logic. You can differentiate between loaders and actions based on the `request.method`.

```tsx
async function middleware({ request, context }) {
  // Run me top-down before action/loaders run
  // Provide values to descendant middleware + action/loaders
  context.set(userContext, getUser(request));

  // Run descendant middlewares sequentially, followed by the action/loaders
  let response = await context.next();

  // Run me bottom-up after action/loaders run
  response.headers.set("X-Custom", "Stuff");

  // Return the response to ancestor middlewares
  return response;
}
```

Because middleware has access to the incoming `Request` _and also_ has the ability to mutate the outgoing `Response`, it's important to note that middlewares are executed _per-unique Request/Response combination_.

In client-side React Router applications, this means that nested routes will execute middlewares _for each loader_ because each loader returns a unique `Response` that could be altered independently by the middleware.

When navigating to `/a/b`, the following represents the parallel data loading chains:

```
a middleware -> a loader -> a middleware
a middleware -> b middleware -> b loader -> b middleware -> a middleware
```

So you should be aware that while middleware will reduce some code duplication across your actions/loaders, you may need to leverage a mechanism to dedup external API calls made from within a middleware.

[pickingarouter]: ../routers/picking-a-router
[react-context]: https://reactjs.org/docs/context.html
[fresh-middleware]: https://fresh.deno.dev/docs/concepts/middleware
