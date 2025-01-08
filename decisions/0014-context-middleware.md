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

First attempt was to do it within data strategy
Users providing their own data strategy would implement their own middleware
Doesn't hold up for actions/revalidations because it means middleware runs twice
Not a huge deal in the browser, but more so for server POST document requests
Not just that middleware runs twice, that's suboptimal, but...
The API of returning a Response up the middleware chain is impossible during action middlewares if loaders haven't run yet since we can't render the HTML to a Response
Instead, middleware has to happen at a higher level, outside of data strategy so the final `handler` has access to the results of all actions/loaders
This means users cannot change the middleware implementation via a custom dataStrategy because it will have already run by the time their datastrategy runs
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
- When a server exists, the post/get are separate requets and will invoke middlewares twice

Client side will mimic the server behavior with few exceptions:

- shared context from action to loader?

However, document POST /a/b requests _cannot_ use `dataStrategy` because we need both action and loader results to render the document and send the response back through the middleware chain

#

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

## Consequences

[rfc]: https://github.com/remix-run/react-router/discussions/9564
[client-context]: https://github.com/remix-run/react-router/discussions/9856
