# Data Strategy

Date: 2024-01-31

Status: accepted

## Context

In order to implement "Single Fetch" in Remix ([Issue][single-fetch-issue], [RFC][single-fetch-rfc]), we need to expose some level of control over the internal data fetching behaviors of the `@remix-run/router`. This way, while React Router will run loaders in parallel by default, Remix can opt-into making a single fetch call to the server for all loaders.

## Decisions

### `dataStrategy`

To achieve the above, we propose to add an optional `dataStrategy` config which can be passed in by the application. The idea is that `dataStrategy` will accept an array of `matches` to load and will return a parallel array of results for those matches.

```js
function dataStrategy(arg: DataStrategyFunctionArgs): DataResult[];

interface DataStrategyFunctionArgs<Context = any>
  extends DataFunctionArgs<Context> {
  matches: AgnosticDataStrategyMatch[];
}

interface DataFunctionArgs<Context> {
  request: Request;
  params: Params;
  context?: Context;
}
```

There's a [comment][responsibilities-comment] here from Jacob which does a good job of outlining the current responsibilities, but basically React Router in it's current state handles 4 aspects when it comes to executing loaders for a given URL - `dataStrategy` is largely intended to handle step 3:

1. Match routes for URL
2. Determine what routes to load (via `shouldRevalidate`)
3. Call `loader` functions in parallel
4. Decode Responses

### Inputs

The primary input is `matches`, since the user needs to know what routes match and eed to have loaders executed. We also wanted to provide a way for the user to call the "default" internal behavior so they could easily change from parallel to sequential without having to re-invent the wheel and manually call loaders, decode responses, etc. The first idea for this API was to pass a `defaultStrategy(match)` parameter so they could call that per-match:

```js
function dataStrategy({ matches }) {
  // Call in parallel
  return Promise.all(matches.map(m => defaultStrategy((m))));

  // Call sequentially
  let results = []
  for (let match of matches) {
    results.push(await defaultStrategy(match))
  }
  return results;
}
```

⚠️ `defaultStrategy` was eliminated in favor of `match.resolve`.

We also originally intended to expose a `type: 'loader' | 'action`' field as a way to presumably let them call `match.route.loader`/`match.route.action` directly - but we have since decided against that with the `match.resolve` API.

⚠️ `type` was eliminated in favor of `match.resolve`.

`dataStrategy` is control _when_ handlers are called, not _how_. RR is in charge of calling them with the right parameters.

### Outputs

Originally, we planned on making the `DataResult` API public, which is a union of the different types of results (`SuccessResult`, `ErrorResult`, `RedirectResult`, `DeferResult`). However, as we kept evolving and did some internal refactoring to separate calling loaders from decoding results - we realized that all we really need is a simpler `HandlerResult`:

```ts
interface HandlerResult {
  type: ResultType.success | ResultType.error;
  result: any;
}
```

If the user returns us one of those per-match, we can internally convert it to a `DataResult`.

- If `result` is a `Response` then we can handle unwrapping the data and processing any redirects (may produce a `SuccessResult`, `ErrorResult`, or `RedirectResult`)
- If `result` is a `DeferredData` instance, convert to `DeferResult`
- If result is anything else we don't touch the data, it's either a `SuccessResult` or `ErrorResult` based on `type`
  - This is important because it's lets the end user opt into a different decoding strategy of their choice. If they return us a Response, we decode it. If not, we don't touch it.

### Decoding Responses

Initially, we intended for `dataStrategy` to handle (3), and considered an optional `decodeResponse` API for (4) - but we decided that the decoding of responses was a small enough undertaking using standard Fetch APIs (i.e., `res.json`) that it didn't warrant a custom property - and they could just call those APIs directly. The `defaultStrategy` parameter would handle performing 3 the normal way that RR would.

⚠️ `decodeResponse` is made obsolete by `HandlerResult`

### Handling `route.lazy`

There's a nuanced step we missed in our sequential steps above. If a route was
using `route.lazy`, we may need to load the route before we can execute the `loader`. There's two options here:

1. We pre-execute all `route.lazy` methods before calling `dataStrategy`
2. We let `dataStrategy` execute them accordingly

(1) has a pretty glaring perf issue in that it blocks _any_ loaders from running until _all_ `route.lazy`'s have resolved. So if route A is super small but has a slow loader, and route B is large but has a fast loader:

```
|-- route a lazy  -->                      |-- route a loader --------------->|
|-- route b lazy  ------------------------>|-- route b loader -->             |
```

This is no bueno. Instead, we want option (2) where the users can run these sequentially per-route - and "loading the route" is just part of the "loading the data" step

```
|-- route a lazy  -->|-- route a loader --------------->         |
|-- route b lazy  ------------------------>|-- route b loader -->|
```

Therefore, we're introducing the concept of a `DataStrategyMatch` which is just like a `RouteMatch` but the `match.route` field is a `Promise<Route>`. We'll kick off the executions of route.lazy and then you can wait for them to complete prior to calling the loader:

```js
function dataStrategy({ matches, defaultStrategy }) {
  return Promise.all(
    matches.map((m) => match.route.then((route) => route.loader(/* ... */)))
  );
}
```

There are also statically defined properties that live outside of lazy, so those are extended right onto `match.route`. This allows you to define loaders statically and run them in parallel with `route.lazy`:

```js
function dataStrategy({ matches, defaultStrategy }) {
  // matches[0].route => Promise
  // matches[0].route.id => string
  // matches[0].route.index => boolean
  // matches[0].route.path => string
}
```

⚠️ This match.route as a function API was removed in favor of `match.resolve`

### Handling `shouldRevalidate` behavior

We considered how to handle `shouldRevalidate` behavior. There's sort of 2 basic approaches:

1. We pre-filter and only hand the user `matchesToLoad`
2. We hand the user all matches and let them filter
   - This would probably also require a new `defaultShouldRevalidate(match) => boolean` parameter passed to `dataStrategy`

I _think_ (1) is preferred to keep the API at a minimum and avoid leaking into _other_ ways to opt-out of revalidation. We already have an API for that so let's lean into it.

Additionally, another big con of (2) is that if we want to let them make revalidation decisions inside `dataStrategy` - we need to expose all of the informaiton required for that (`currentUrl`, `currentParams`, `nextUrl`, `nextParams`, `submission` info, `actionResult`, etc.) - the API becomes a mess.

Therefore we are aiming to stick with one and let `shouldRevalidate` be the only way to opt-out of revalidation.

### Handling actions and fetchers

Thus far, we've been mostly concerned with how to handle navigational loaders where they are multiple matched routes and loaders to run. But what about actions and fetchers where we only run a handler for a single leaf match? The quick answer to this is to just send a single-length array with the match in question:

```js
// loaders
let matchesToLoad = getMatchesToLoad(request, matches);
let results = await dataStrategy({
  request,
  params,
  matches: matchesToLoad,
  type: "loader",
  defaultStrategy,
});

// action
let actionMatch = getTargetMatch(request, matches);
let actionResults = await dataStrategy({
  request,
  params,
  matches: [actionMatch],
  type: "action",
  defaultStrategy,
});
let actionResult = actionResults[0];

// fetcher loader/action
let fetcherMatch = getTargetMatch(request, matches);
let fetcherResults = await dataStrategy({
  request,
  params,
  matches: [fetcherMatch],
  type: "loader", // or "action"
  defaultStrategy,
});
let fetcherResult = fetcherResults[0];
```

This way, the user's implementation can just always operate on the `matches` array and it'll work for all use cases.

```js
// Sample strategy to run sequentially
async function dataStrategy({ request, params, matches, type }) {
  let results = [];
  for (let match of matches) {
    let result = await match.route[type]({ request, params });
    result.push(result);
  }
  return results;
}
```

### What about middlewares?

As we thought more and more about this API, it became clear that the concept of "process data for a route" (step 3 above) was not necessarily limited to the `loader`/`action` and that there are data-related APIs on the horizon such as `middleware` and `context` that would also fall under the `dataStrategy` umbrella! In fact, a well-implemented `dataStrategy` could alleviate the need for first-class APIs - even if only initially. Early adopters could use `dataStrategy` to implement their own middlewares and we could see which patterns rise to the top and adopt them as first class `route.middleware` or whatever.

So how would middleware work? The general idea is that middleware runs sequentially top-down prior to the loaders running. And if you bring `context` into the equation - they also run top down and middlewares/loaders/actions receive the context from their level and above in the tree - but they do not "see" any context from below them in the tree.

A user-land implementation turns out not to be too bad assuming routes define `middleware`/`context` on `handle`:

```js
// Assume routes look like this:
let route = {
  id: "parent",
  path: "/parent",
  loader: () => {},
  handle: {
    // context can provide multiple keyed contexts
    context: {
      parent: () => ({ id: "parent" }),
    },
    // middleware receives context as an argument
    middleware(context) {
      context.parent.whatever = "PARENT MIDDLEWARE";
    },
  },
};

async function dataStrategy({ request, params, matches, type }) {
  // Run context/middleware sequentially
  let contexts = {};
  for (let match of matches) {
    if (m.route.handle?.context) {
      for (let [id, ctx] of Object.entries(m.route.handle.context)) {
        contexts[key] = ctx();
      }
    }
    if (m.route.handle?.middleware) {
      m.route.handle.middleware(context);
    }
  }

  // Run loaders in parallel (or run the solo action)
  return Promise.all(
    matches.map(async (m, i) => {
      // Only expose contexts from this level and above
      let context = matches.slice(0, i + 1).reduce((acc, m) => {
        Object.keys(m.route.handle?.context).forEach((k) => {
          acc[k] = contexts[k];
        });
        return acc;
      }, {});
      try {
        return {
          type: ResultType.data,
          data: await m.route[type]?.({ request, params, context });,
        };
      } catch (error) {
        return {
          type: ResultType.error,
          error,
        };
      }
    })
  );
}
```

❌ Nope - this doesn't actually work!

Remember above where we decided to _pre-filter_ the matches based on `shouldRevalidate`? That breaks any concept of middleware since even if we don't intend to load a route, we need to run middleware on all parents before the loader. So we _must_ expose at least the `matches` at or above that level in the tree - and more likely _all_ matches to `dataStrategy` if it's to be able to implement middleware.

And then, once we expose _multiple_ matches - we need to tell the user if they're supposed to actually run the handlers on those matches or only on a leaf/target match.

I think there's a few options here:

**Option 1 - `routeMatches` and `handlerMatches`**

We could add a second array of the "full" set of matches for the route and then middleware would operate on that set, and handlers would operate on the filtered set (renamed to `handlerMatches`) here. This still preserves the pre-filtering and keeps `shouldRevalidate` logic out of `dataStrategy`.

```js
async function dataStrategy({ request, params, routeMatches, handlerMatches, type }) {
  // Run context/middleware sequentially
  let contexts = {};
  for (let match of routeMatches) { ... }

  // Run loaders in parallel
  return Promise.all(
    handlerMatches.map(async (m, i) => { ... })
  );
}
```

**Option 2 - new field on `DataStrategyMatch`**

Since we're already introducing a concept of a `DataStrategyMatch` to handle `route.lazy`, we could lean into that and expose something on those matches that indicate if they need to have their handler run or not?

```js
// Inside React Router, assume navigate from /a/ -> /b and we don't need to
// re-run the root loader
let dataStrategyMatches = [{
  route: { id: 'root', loader() {}, ... }
  runHandler: false // determined via shouldRevalidate
}, {
  route: { id: 'b', loader() {}, ... }
  runHandler: true // determined via shouldRevalidate
}]
```

Then, the user could use this to differentiate between middlewares and handlers:

```js
async function dataStrategy({ request, params, matches, type }) {
  // Run context/middleware sequentially
  let contexts = {};
  for (let match of matches) { ... }

  // Run loaders in parallel
  let matchesToLoad = matches.filter(m => m.runHandler);
  return Promise.all(
    matchesToLoad.map(async (m, i) => { ... })
  );
}
```

**Option 3 - new function on `DataStrategyMatch`**

Extending on the idea above - it all started to feel super leaky and full of implementation-details. Why are users manually filtering? Or manually passing parameters to loaders/actions? Using a `type` field to know which to call? Waiting on a `match.route` Promise before calling the loader?

That's wayyyy to many rough edges for us to document and users to get wrong (rightfully so!).

Why can't we just do it all? Let's wrap _all_ of that up into a single `match.resolve()` function that:

- Waits for `route.lazy` to resolve (if needed)
- No-ops if the route isn't supposed to revalidate
  - Open question here if we return the _current_ data from these no-ops or return `undefined`?
  - We decided _not_ to expose this data for now since we don't have a good use case
- Knows whether to call the `loader` or the `action`
- Allows users to pass _additional_ params to loaders/actions for middleware/context use cases.

```js
// Simplest case - call all loaders in parallel just like current behavior
function dataStrategy({ matches }) {
  // No more type, defaultStrategy, or match.route promise APIs!
  return Promise.all(matches.map(match => {
    // resolve `route.lazy` if needed and call loader/action
    return m.resolve();
  });
}

// More advanced case - call loader sequentially passing a context through
async function dataStrategy({ matches }) {
  let ctx = {};
  let results = [];
  for (let match of matches) {
    // You can pass a "handlerOverride" function to resolve giving you control
    // over how/if to call the handler.  The argument passed to `handler` will
    // be passed as the second argument to your `loader`/`action`:
    // function loader({ request }, ctx) {...}
    let result = await m.resolve((handler) => {
      return handler(ctx);
    });
    results.push(result);
  });
  return results;
}

// More performant case leveraging a middleware type abstraction which lets loaders
// still run in parallel after sequential middlewares:
function dataStrategy({ matches }) {
  // Can implement middleware as above since you now get all matches
  let context = runMiddlewares(matches);

  // Call all loaders in parallel (no params to pass) but you _can_ pass you
  // own argument to `resolve` and it will come in as `loader({ request }, handlerArg)`
  // So you can send middleware context through to loaders/actions
  return Promise.all(matches.map(match => {
    return m.resolve(context);
  });

  // Note we don't do any filtering above - if a match doesn't need to load,
  // `match.resolve` is no-op.  Just like `serverLoader` is a no-op in `clientLoader`
  // when it doesn't need to run
}

// Advanced case - single-fetch type approach
// More advanced case - call loader sequentially passing a context through
async function dataStrategy({ matches }) {
  let singleFetchData = await makeSingleFetchCall()
  // Assume we get back:
  // { data: { [routeId]: unknown }, errors: { [routeId]: unknown } }
  let results = [];
  for (let match of matches) {
    // Don't even call the handler since we have the data we need from single fetch
    let result = await m.resolve(() => {
      if (singleFetchData.errors?.[m.route.id]) {
        return {
          type: 'error',
          result: singleFetchData.errors?.[m.route.id]
        }
      }
      return {
        type: 'data',
        result: singleFetchData.data?.[m.route.id]
      }
    });
    results.push(result);
  });
  return results;
}
```

## Status codes

Initially, we thought we could just let the `handlerOverride`return or throw and then internally we could convert the returned/thrown valuer into a `HandlerResult`. However, this didn't work for the `unstable_skipActionRevalidation` behavior we wanted to implement with Single Fetch.

If users returned normal Response's it would be fine, since we could decode the response internally and also know the status. However, if user's wanted to do custom response decoding (i.e., use `turbo-stream` like we did in single fetch) then there was no way to return/throw data _and the status code from the response_ without introducing something like the `ErrorResponse` API which holds a status and data. We decided to make `HandlerResult` public API and put an optional `status` field on it.

This means that if you just call resolve with no `handlerOverride` you never need to know about `HandlerResult`. If you do pass a `handlerOverride`, then you need to return a proper HandlerResult with `type:"data"|"error"`.

[single-fetch-issue]: https://github.com/remix-run/remix/issues/7641
[single-fetch-rfc]: https://github.com/remix-run/remix/discussions/7640
[responsibilities-comment]: https://github.com/remix-run/remix/issues/7641#issuecomment-1836635069
