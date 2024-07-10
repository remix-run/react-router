---
title: Remix (and React Router) Streaming APIs
---

# Title

Date: 2022-07-27

Status: accepted

## Context

Remix aims to provide first-class support for React 18's streaming capabilities. Throughout the development process we went through many iterations and naming schemes around the APIs we plan to build into Remix to support streaming, so this document aims to lay out the final names we chose and the reasons behind it.

It's also worth nothing that even in a single-page-application without SSR-streaming, the same concepts still apply so these decisions were made with React Router 6.4.0 in mind as well - which will support the same Data APIs from Remix.

## Decision

Streaming in Remix can be thought of as having 3 touch points with corresponding APIs:

1. _Initiating_ a streamed response in your `loader` can be done by returning a `defer(object)` call from your `loader` in which some of the keys on `object` are `Promise` instances
2. _Accessing_ a streamed response from `useLoaderData`
   1. No new APIs here - when you return a `defer()` response from your loader, you'll get `Promise` values inside your `useLoaderData` object 👌
3. _Rendering_ a streamed value (with fallback and error handling) in your component
   1. You can render a `Promise` from `useLoaderData()` with the `<Await resolve={data.promise}>` component
   2. `<Await>` accepts an `errorElement` prop to handle error UI
   3. `<Await>` should be wrapped with a `<React.Suspense>` component to handle your loading UI

## Details

In the spirit of `#useThePlatform` we've chosen to leverage the `Promise` API to represent these "eventually available" values. When Remix receives a `defer()` response back from a `loader`, it needs to serialize that `Promise` over the network to the client application (prompting Jacob to coin the phrase [_"promise teleportation over the network"_][promise teleportation] 🔥).

### Initiating

In order to initiate a streamed response in your `loader`, you can use the `defer()` utility which accepts a JSON object with `Promise` values from your `loader`.

```tsx
export async function loader() {
  return defer({
    // Await this, don't stream
    critical: await fetchCriticalData(),
    // Don't await this - stream it!
    lazy: fetchLazyData(),
  });
}
```

By not using `await` on `fetchLazyData()` Remix knows that this value is not ready yet _but eventually will be_ and therefore Remix will leverage a streamed HTTP response allowing it to send up the resolved/rejected value when available. Essentially serializing/teleporting that Promise over the network via a streamed HTTP response.

Just like `json()`, the `defer()` will accept a second optional `responseInit` param that lets you customize the resulting `Response` (i.e., in case you need to set custom headers).

The name `defer` was settled on as a corollary to `<script defer>` which essentially tells the browser to _"fetch this script now but don't delay document parsing"_. In a similar vein, with `defer()` we're telling Remix to _"fetch this data now but don't delay the HTTP response"_.

We decided _not_ to support naked objects due to the ambiguity that would be introduced:

```tsx
// NOT VALID CODE - This is just an example of the ambiguity that would have
// been introduced had we chosen to support naked objects :)

// This would NOT be streamed
function exampleLoader1() {
  return Promise.resolve(5);
}

// This WOULD be streamed
function exampleLoader2() {
  return {
    value: Promise.resolve(5),
  };
}

// This would NOT be streamed
function exampleLoader3() {
  return {
    value: {
      nested: Promise.resolve(5),
    },
  };
}
```

<details>
  <summary>Other considered API names:</summary>
  <br/>
  <ul>
    <li><code>deferred()</code> - This is just a bit of a weird word that doesn't have much pre-existing semantic meaning. Is this the <code>jQuery.Deferred</code> thing from back in the day? Remix in general wants to avoid needlessly introducing net-new language to an already convoluted landscape!</li>
    <li><code>stream()</code> - We also thought <code>stream</code> might be a good name since that's what the call is telling Remix to do - stream the responses down to the browser. But - this is also potentially misleading because stream is ambiguous in ths case. Developers may mistakenly think that this gives them back a <code>Stream</code> instance and they can arbitrarily send multiple chunks of data down to the browser over time. This is not how the current API works - but also seems like a really interesting idea for Remix to consider in the future, so we wanted to keep the <code>stream()</code> name available for future use cases.</li>
  </ul>
</details>

### Accessing

No new APIs are needed for the "Accessing" stage 🎉. Since we've "teleported" these promises over the network, you can access them in your components just as you would with any other data returned from your loader. This value will always be a `Promise`, even after it's been settled.

```tsx
function Component() {
  const data = useLoaderData();
  // data.critical is a resolved value
  // data.lazy is a Promise
}
```

### Rendering

In order to render your `Promise` values from `useLoaderData()`, Remix provides a new `<Await>` component which handles rendering the resolved value, or propagating the rejected value through an `errorElement` or further upwards to the Route-level error boundaries. In order to access the resolved or rejected values, there are two new hooks that only work in the context of an `<Await>` component - `useAsyncValue()` and `useAsyncError()`.

This examples shows the full set of render-time APIs:

```tsx
function Component() {
  const data = useLoaderData(); // data.lazy is a Promise

  return (
    <React.Suspense fallback={<p>Loading...</p>}>
      <Await resolve={data.lazy} errorElement={<MyError />}>
        <MyData />
      </Await>
    </React.Suspense>
  );
}

function MyData() {
  const value = useAsyncValue(); // Get the resolved value
  return <p>Resolved: {value}</p>;
}

function MyError() {
  const error = useAsyncError(); // Get the rejected value
  return <p>Error: {error.message}</p>;
}
```

Note that `useAsyncValue` and `useAsyncError` only work in the context of an `<Await>` component.

The `<Await>` name comes from the fact that for these lazily-rendered promises, we're not `await`-ing the promise in our loader, so instead we need to `<Await>` the promise in our render function and provide a fallback UI. The `resolve` prop is intended to mimic how you'd await a resolved value in plain Javascript:

```tsx
// This JSX:
<Await resolve={promiseOrValue} />;

// Aims to resemble this Javascript:
const value = await Promise.resolve(promiseOrValue);
```

Just like `Promise.resolve` can accept a promise or a value, `<Await resolve>` can also accept a promise or a value. This is really useful in case you want to AB test `defer()` responses in the loader - you don't need to change the UI code to render the data.

```tsx
export async function loader({ request }: LoaderArgs) {
  const shouldAwait = isUserInTestGroup(request);
  return {
    maybeLazy: shouldAwait ? await fetchData() : fetchData(),
  };
}

function Component() {
  const data = useLoaderData();

  // No code forks even if data.maybeLazy is not a Promise!
  return (
    <React.Suspense fallback={<p>Loading...</p>}>
      <Await resolve={data.maybeLazy} errorElement={<MyError />}>
        <MyData />
      </Await>
    </React.Suspense>
  );
}
```

**Additional Notes on `<Await>`**

If you prefer the render props pattern, you can bypass `useAsyncValue()` and just grab the value directly:

```tsx
<Await resolve={data.lazy}>{(value) => <p>Resolved: {value}</p>}</Await>
```

If you do not provide an `errorElement`, then promise rejections will bubble up to the nearest Route-level error boundary and be accessible via `useRouteError()`.

<details>
  <summary>Other considered API names:</summary>
  <br>
  <p>We originally implemented this as a <code>&lt;Deferred value={promise} fallback={&lt;Loader /&gt;} errorElement={&lt;MyError/&gt;} /></code>, but eventually we chose to remove the built-in <code>&lt;Suspense&gt;</code> boundary for better composability and eventual use with <code>&lt;SuspenseList&gt;</code>.  Once that was removed, and we were only using a <code>Promise</code> it made sense to move to a generic <code>&lt;Await&gt;</code> component that could be used with <em>any</em> promise, not just those coming from <code>defer()</code> in a <code>loader</code></p>

  <p>We also considered various alternatives for the hook names - most notably `useResolvedValue`/`useRejectedValue`.  However, these were a bit too tightly coupled to the `Promise` nomenclature.  Remember, `Await` supports non-Promise values as well as render-errors, so it would be confusing if `useResolvedValue` was handing you a non-Promise value, or if `useRejectedValue` was handing you a render error from a resolved `Promise`.  `useAsyncValue`/`useAsyncError` better encompasses those scenarios as well.</p>
</details>

## React Router Notes

With the presence of the `<Await>` component in React Router and because the Promise's don't have to be serialized over the network - you can _technically_ just return raw Promise values on a naked object from your loader. However, this is strongly discouraged because the router will be unaware of these promises and thus won't be able to cancel them if the user navigates away prior to the promise settling.

By forcing users to call the `defer()` utility, we ensure that the router is able to track the in-flight promises and properly cancel them. It also allows us to handle synchronous rendering of promises that resolve prior to other critical data. Without the `defer()` utility these raw Promises would need to be thrown by the `<Await>` component to the `<Suspense>` boundary a single time to unwrap the value, resulting in a UI flicker.

[promise teleportation]: https://twitter.com/ebey_jacob/status/1548817107546095616
