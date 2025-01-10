# Title

Date: 2024-12-19

Status: proposed

## Context

_Lol "context", get it 😉_

The [Middleware RFC][rfc] is the _most-upvoted_ RFC/Proposal in the React Router repo. We actually tried to build and ship it quite some time ago but realized that without single fetch it didn't make much sense in an SSR world because of the lack of a shared request scope across routes.

We've done a lot of work since then to get us to a place where we could ship a middleware API we were happy with

TODO: Add Links

- Shipped Single Fetch
- Shipped `dataStrategy` for DIY middleware in React Router SPAs
- Iterated on middleware and context APIs in the "Remix the Web" project
- Developed a non-invasive type-safe + composable context API

## Decision

### Lean on existing `context` parameter for initial implementation

- No need to develop an internal type-safe API, can use something external that composes well with our APIs
- Requires us to add a client-side `context` which is also a [long requested feature][client-context]
- Right now, this is a singleton since that provides maximum flexibility. But we should also provide a way for folks to do request (navigation) scoped stuff that gets auto-cleaned up. So I think we should do a shallow clone for each new navigation:
  - `let scopedContext = { ...singletonContext }`
  - That way folks can add stuff in root middleware and know it'l be cleaned up and created fresh the next time
  - Only keys on the original object will be persisted

### Implementation

```js
function middleware({ request, params, context }, next) {
  doSomething()
  let res = await next(); // call action and loaders
   // after the action this is an turbo-stream Response
   // after the loaders its the HTML Response
  res.headers.set()
  return res
}
```

action document execution -> turbo stream response - never goes to browser
loader document execution - HTML response
action data execution - turbo stream
loader data execution - turbo stream

---

Server side handling is fairly straightforward:

- Middleware runs around "response generation"
- The lowest `next()` function runs the handlers and generates the `Response` which is bubbled back up through the middleware chain
- GET requests are straightforward
  - Document requests - middleware down, run loaders, HTML Response, middleware up
  - Data requests - middleware down, run loaders, turbo-stream Response, middleware up
- Single Fetch POST data requests are simple too
  - middleware down, run action, turbo-stream Response, middleware up
- POST document requests are interesting because they have to run _both_ the action and loaders to before they can generate the HTML `Response`
  - middleware down, run action, run loaders, HTML Response, middleware up
- If we ever did single flight mutations, they'd do the same thing
  - middleware down, run action, run loaders, turbo-stream Response, middleware up
- The net result of this behavior is that for a document submission, your middleware wil run once:
  - `POST /a/b - a mw -> b mw -> action -> loaders -> render -> b mw -> a mw`
- But if it's a data (SPA) POST, middlewares will run twice:
  - `POST /a/b.data - a mw -> b mw -> action -> turbo-stream -> b mw -> a mw`
  - `GET /a/b.data - a mw -> b mw -> loaders -> turbo-stream -> b mw -> a mw`
- This is a function of our single fetch Request behavior and client side `shouldRevalidate`/`clientLoader` requirements and is pretty easy to grok/document.

---

Client side middleware gets more interesting because there is no inherent Request/Response, there's just a navigation.

- GET navigations are again simple
  - middlewares down, loaders, middlewares up, update state
- POST navigations are more complex
  - Should they mimic a document POST requests (middlewares run one time total)?
  - Or, should they mimic SPA POST requests (middlewares run once for action, again for loaders)?
- Pros cons listed below

---

**Using dataStrategy**

- We have an existing `dataStrategy` API that allows users to take control over execution of route data functions (loaders/actions)
- This allows users to change how data functions are called (parallel/sequential) and also change _which_ are called (single fetch, new revalidation patterns, etc.)
- This _also_ allows users to implement their own [sequential middleware](https://reactrouter.com/6.28.1/routers/create-browser-router#middleware)
- In an ideal world, middleware would be an implementation detail of `dataStrategy`
- That way, when a user provides a custom `dataStrategy` they take full control over all data processing - including both middleware and data functions
- It would be a bit weird if a user took control over `dataStrategy` but was still subject to our `middleware` execution followed by their `loader` execution
- The caveat or potential downside of doing middleware in `dataStrategy` is that it's scoped to actions or loaders.

  - For a submission request, `dataStrategy` runs once for the action and then a second time for the loader revalidations (and potentially additional times for fetcher revalidating fetchers)

---

**PROS/CONS**

- client actions run middlewares once
  - pros
    - user middleware code wont run twice
    - Feels more like express middleware
  - cons
    - More complex implementation - cannot use `dataStrategy`
      - need to wrap the entire flow of a navigation into the `next` function
    - User's can't change the implementation via `dataStrategy`
      - They could opt-out of it by not specifying any `route.middleware` functions and then implement their own via `dataStrategy` - but it would then run twice
      - So there is no real way for a like-for-like userland implementation
    - Potential stale data on `context` after an action mutation
      - user must remember to redirect or clear any impacted `context` data in actions :/
    - May run middlewares for loaders that don't run via `shouldRevalidate`
      - Probably not a huge issue?
- client actions run middlewares twice
  - pros
    - Very simple implementation via `dataStrategy`
    - Allows user behavioral override via `dataStrategy`
    - Avoid stale data issues after action mutations
    - May run middlewares for loaders that don't run via `shouldRevalidate`
  - cons
    - potential dup user code running
      - but is any of it expensive?
      - Can be avoided with minimal user code
        - `if (!context.user) context.user = getUser();`
    - Feels less like express middleware and more custom too our "actions then loaders" flow

---

First attempt was to do it within data strategy
Users providing their own data strategy would implement their own middleware
Doesn't hold up for actions/revalidations because it means middleware runs twice
Not a huge deal in the browser, but more so for server POST document requests
Not just that middleware runs twice, that's suboptimal, but...
The API of returning a Response up the middleware chain is impossible during action middlewares if loaders haven't run yet since we can't render the HTML to a Response
Instead, middleware has to happen at a higher level, outside of data strategy so the final `handler` has access to the results of all actions/loaders
This means users cannot change the middleware implementation via a custom dataStrategy because it will have already run by the time their dataStrategy runs
This is an acceptable tradeoff because they can always forego the first-class `middleware` API and implement their own via `handler.middleware` or something similar

Plot twist! Client-side middleware _can't_ happen early and _must_ happen as part of dataStrategy!

- matches for actions and loaders are not the same
- action results can impact the loaders that will run
  - consider an `/a` route with a child `index` route
  - POST /a should only run the middleware only for `/a` before the `action`
  - But the revalidation step (GET) will revalidate `/a` and `index` by default
  - `shouldRevalidate` can opt out either one based on the `actionResult`
  - So it is impossible to know what `loader` middlewares to run until _after_ we run the `action`
  - the behavior thus should mimic what would happen if we mde 2 separate HTTP requests (remember we're a browser emulator)
- Fetcher posts and revalidations must be totally separate
- When a server exists, the post/get are separate requests and will invoke middlewares twice

Client side will mimic the server behavior with few exceptions:

- shared context from action to loader?

However, document POST /a/b requests _cannot_ use `dataStrategy` because we need both action and loader results to render the document and send the response back through the middleware chain

### Scenarios

The simplest scenario is a document `GET /a/b` request:

- Start a `middleware`
- Start b `middleware`
- Run a/b `loaders` in parallel
- Render HTML `Response` to bubble back up via `next()`
- Finish b `middleware`
- Finish a `middleware`

If we introduce `clientMiddleware` but no `clientLoader` and client-side navigate to `/a/b`:

- Start a `clientMiddleware`
- Start b `clientMiddleware`
- `GET /a/b.data`
- Start a `middleware`
- Start b `middleware`
- Run a/b `loaders` in parallel
- Render HTML `Response` to bubble back up via `next()`
- Finish b `middleware`
- Finish a `middleware`
- Respond to client
- Finish b `clientMiddleware`
- Finish a `clientMiddleware`

If we have `clientLoaders` and they don't call server `loaders` (SPA Mode):

- Start a `clientMiddleware`
- Start b `clientMiddleware`
- Run a/b `clientLoaders` in parallel
- _No Response to render here so we can either bubble up `undefined` or potentially a `Location`_
  - `Location` feels maybe a bit weird and introduces another way to redirect instead of `throw redirect`...
- Finish b `clientMiddleware`
- Finish a `clientMiddleware`

If `clientLoaders` do call `serverLoaders` it gets trickier since they make individual server requests:

- Start a `clientMiddleware`
- Start b `clientMiddleware`
- Run a/b `clientLoaders` in parallel
  - `a` `clientLoader` calls GET `/a/b.data?route=a`
    - Start a `middleware`
    - Run a loader
    - Render turbo-stream `Response` to bubble back up via `next()`
    - Finish a `middleware`
  - `b` `clientLoader` calls GET `/a/b.data?route=b`
    - Start a `middleware`
    - Start b `middleware`
    - Run b loader
    - Render turbo-stream `Response` to bubble back up via `next()`
    - Finish b `middleware`
    - Finish a `middleware`
- Finish b `clientMiddleware`
- Finish a `clientMiddleware`

- SPA GET
  - middlewares run as part of `dataStrategy`
  - running them outside would happen from `startNavigation`?
- SPA POST
  - middlewares run as part of `dataStrategy`, but this means they ru once for actions and again for loaders which feels suboptimal
  - running them outside would happen from `startNavigation`?
- GET /a/b.data
  - middlewares could run as part of `dataStrategy`, but would require plumbing a `respond` API all the way down
  - Would be easier to call outside of `query()`, or as part of a new `respond()` method
- POST /a/b.data
  - middlewares could run as part of `dataStrategy`, but would require plumbing a `respond` API all the way down
  - Currently uses `dataStrategy` to skip loader calls
  - Would be easier to call outside of `query()`, or as part of a new `respond()` method
- GET /a/b document
  - Could happen in `dataStrategy` with `respond` API
- POST /a/b document
  - MUST happen outside of `dataStrategy` so we have both action and loader results for the `render()` function a the end of middleware chain
- GET /a/b resource
- POST /a/b resource

---

Other random thoughts

- Middleware is data-focused, not an event system
  - you should nt be relying on middleware to track how users hit a certain page etc
  - middleware may run once for actions and once for loaders
  - middleware will run independently for navigational loaders and fetcher loaders
  - middleware may run many times for revalidations
  - middleware may not run for revalidation opt outs
- Middleware allows you to run logic specific to a branch of the tree before/after data fns
  - logging
  - auth/redirecting
  - 404 handling

## Open Questions

- how to handle aborted requests?
  - `await next()` throws the `AbortSignal.reason` to avoid running the code after `next()`

## Consequences

[rfc]: https://github.com/remix-run/react-router/discussions/9564
[client-context]: https://github.com/remix-run/react-router/discussions/9856
