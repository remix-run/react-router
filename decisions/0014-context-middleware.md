# Middleware + Context

Date: 2025-01-22

Status: proposed

## Context

_Lol "context", get it 😉_

The [Middleware RFC][rfc] is the _most-upvoted_ RFC/Proposal in the React Router repo. We actually tried to build and ship it quite some time ago but realized that without single fetch it didn't make much sense in an SSR world for 2 reasons:

- With the individual HTTP requests per loader, middleware wouldn't actually reduce the # of queries to your DB/API's - it would just be a code convenience with no functional impact
- Individual HTTP requests meant a lack of a shared request scope across routes

We've done a lot of work since then to get us to a place where we could ship a middleware API we were happy with:

- Shipped [Single Fetch][single-fetch]
- Shipped [`dataStrategy`][data-strategy] for DIY middleware in React Router SPAs
- Iterated on middleware/context APIs in the [Remix the Web][remix-the-web] project
- Developed a non-invasive type-safe + composable [context][async-provider] API

## Decision

### Lean on existing `context` parameter for initial implementation

During our experiments we realized that we could offload type-safe context to an external package.This would result in a simpler implementation within React Router and avoid the need to try to patch on type-safety to our existing `context` API which was designed as a quick escape hatch to cross the bridge from your server (i.e., `express` `req`/`res`) to the Remix handlers.

Therefore, our recommendation for proper type-safe context for usage within middlewares and route handlers will be the [`@ryanflorence/async-provider`][async-provider] package.

If you don't want to adopt an extra package, or don't care about 100% type-safety and are happy with the module augmentation approach used by `AppLoadContext`, then you can use the existing `context` parameter passed to loaders and actions.

```ts
declare module "react-router" {
  interface AppLoadContext {
    user: User | null;
  }
}

// root.tsx
function userMiddleware({ request, context }: Route.MiddlewareArgs) {
  context.user = getUser(request);
}

export const middleware = [userMiddleware];

// In some other route
export async function loader({ context }: Route.LoaderArgs) {
  let posts = await getPostsForUser(context.user);
  return { posts };
}
```

#### Client Side Context

In order to support the same API on the client, we will need to add support for a client-side `context` value which is already a [long requested feature][client-context]. We can do so just like the server and let users use module augmentation to define their context shape. This will default to an empty object like the server, and can be passed to `createBrowserRouter` in library mode or `<HydratedRouter>` in framework mode to provide up-front singleton values.

```ts
declare module "react-router" {
  interface RouterContext {
    logger(...args: unknown[]): void
  }
}

// Singleton fields that don't change and are always available
let globalContext: RouterContext = { logger: getLogger() };

// library mode
let router = createBrowserRouter(routes, { context: globalContext });

// framework mode
return <HydratedRouter context={globalContext}>
```

`context` on the server has the advantage of auto-cleanup since it's scoped to a request and thus automatically cleaned up after the request completes. In order to mimic this behavior on the client, we'll create a new object per navigation/fetch and spread in the properties from the global singleton context. Therefore, the context object you receive in your handlers will be:

```ts
let scopedContext = { ...globalContext };
```

This way, singleton values will always be there, but any new fields added to that object in middleware will only exist for that specific navigation or fetcher call and it will disappear once the request is complete.

### API

We wanted our middleware API to meet a handful of criteria:

- Allow users to perform logic sequentially top-down before handlers are called
- Allow users to modify he outgoing response bottom-up after handlers are called
- Allow multiple middlewares per route

The middleware API we landed on to ship looks as follows:

```ts
async function myMiddleware({ request, context, next }: Route.MiddlewareArgs) {
  // Do stuff before the handlers are called
  context.user = await getUser(request);
  // Call handlers and generate the Response
  let res = await next();
  // Amend the response if needed
  res.headers.set("X-Whatever", "stuff");
  // Propagate the response up the middleware chain
  return res;
}

// Export an array of middlewares per-route which will run left-to-right on
// the server
export const middleware = [myMiddleware];

// You can also export an array of client middlewares that run before/after
// `clientLoader`/`clientAction`
async function myClientMiddleware({
  context,
  next,
}: Route.ClientMiddlewareArgs) {
  //...
}

export const clientMiddleware = [myClientSideMiddleware];
```

If you only want to perform logic _before_ the request, you can skip calling the `next` function and it'll be called and the response propagated upwards for you automatically:

```ts
async function myMiddleware({ request, context }: Route.MiddlewareArgs) {
  context.user = await getUser(request);
  // Look ma, no next!
}
```

The only nuance between server and client middleware is that on the server, we want to propagate a `Response` back up the middleware chain, so `next` must call the handlers _and_ generate the final response. In document requests, this will be the rendered HTML document,. and in data requests this will be the `turbo-stream` `Response`.

Client-side navigations don't really have this type of singular `Response` - they're just updating a stateful router and triggering a React re-render. Therefore, there is no response to bubble back up and the next function will run handlers but won't return anything so there's nothing to propagate back up the middleware chain.

### Client-side Implementation

For client side middleware, up until now we've been recommending that if folks want middleware they can add it themselves using `dataStrategy`. Therefore, we can leverage that API and add our middleware implementation inside our default `dataStrategy`. This has the primary advantage of being very simple to implement, but it also means that if folks decide to take control of their own `dataStrategy`, then they take control of the _entire_ data flow. It would have been confusing if a user provided a custom `dataStrategy` in which they wanted to do heir own middleware approach - and the router was still running it's own middleware logic before handing off to `dataStrategy`.

If users _want_ to take control over `loader`/`action` execution but still want to use our middleware flows, we should provide an API for them to do so. The current thought here is to pass them a utility into `dataStrategy` they can leverage:

```ts
async function dataStrategy({ request, matches, defaultMiddleware }) {
  let results = await defaultMiddleware(() => {
    // custom loader/action execution logic here
  });
  return results;
}
```

One consequence of implementing middleware as part of `dataStrategy` is that on client-side submission requests it will run once for the action and again for the loaders. We went back and forth on this a bit and decided this was the right approach because it mimics the current behavior of SPA navigations in a full-stack React Router app since actions and revalidations are separate HTTP requests and thus run the middleware chains independently. We don't expect this to be an issue except in expensive middlewares - and in those cases the context will be shared between the action/loader chains and the second execution can be skipped if necessary:

```ts
async function expensiveMiddleware({
  request,
  context,
}: Route.ClientMiddlewareArgs) {
  // Guard this such that we use the existing value if it exists from the action pass
  context.something = context.something ?? (await getExpensiveValue());
}
```

**Note:** This will make more sense after reading the next section, but it's worth noting that client middlewares _have_ to be run as part of `dataStrategy` to avoid running middlewares for loaders which have opted out of revalidation. The `shouldRevalidate` function decodes which loaders to run and does so using the `actionResult` as an input. so it's impossible to decide which loaders will be _prior_ to running the action. So we need to run middleware once for the action and again for the chosen loaders.

### Server-Side Implementation

Server-side middleware is a bit trickier because it needs to propagate a Response back upwards. This means that it _can't_ be done via `dataStrategy` because on document POST requests we need to know the results of _both_ the action and the loaders so we can render the HTML response. And we need to render the HTML response a single tim in `next`, which means middleware can only be run once _per request_ - not once for actions and once for loaders.

This is an important concept to grasp because it points out a nuance between document and data requests. GET navigations will behave the same because there is a single request/response for goth document and data GET navigations. POST navigations are different though:

- A document POST navigation (JS unavailable) is a single request/response to call action+loaders and generate a single HTML response.
- A data POST navigation (JS available) is 2 separate request/response's - one to call the action and a second revalidation call for the loaders.

This means that there may be a slight different in behavior of your middleware when it comes to loaders if you begin doing request-specific logic:

```ts
function weirdMiddleware({ request }) {
  if (request.method === "POST") {
    // ✅ Runs before the action/loaders on document submissions
    // ✅ Runs before the action on data submissions
    // ❌ Does not runs before the loaders on data submission revalidations
  }
}
```

Our suggestion is mostly to avoid doing request-specific logic in middlewares, and if you need to do so, be aware of the behavior differences between document and data requests.

### Scenarios

The below outlines a few sample scenarios to give you an idea of the flow through middleware chains.

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

### Other Thoughts

- Middleware is data-focused, not an event system
  - you should nt be relying on middleware to track how many users hit a certain page etc
  - middleware may run once for actions and once for loaders
  - middleware will run independently for navigational loaders and fetcher loaders
  - middleware may run many times for revalidations
  - middleware may not run for revalidation opt outs
- Middleware allows you to run logic specific to a branch of the tree before/after data fns
  - logging
  - auth/redirecting
  - 404 handling

[rfc]: https://github.com/remix-run/react-router/discussions/9564
[client-context]: https://github.com/remix-run/react-router/discussions/9856
[single-fetch]: https://remix.run/docs/en/main/guides/single-fetch
[data-strategy]: https://reactrouter.com/v6/routers/create-browser-router#optsdatastrategy
[remix-the-web]: https://github.com/mjackson/remix-the-web
[async-provider]: https://github.com/ryanflorence/async-provider
