---
title: Await
new: true
---

## `<Await />`

<details>
  <summary>Type declaration</summary>

```tsx
declare function Await(
  props: AwaitProps
): React.ReactElement;

interface AwaitProps {
  children: React.ReactNode | AwaitResolveRenderFunction;
  errorElement?: React.ReactNode;
  resolve: TrackedPromise | any;
}

interface AwaitResolveRenderFunction {
  (data: Awaited<any>): React.ReactElement;
}
```

</details>

This component is responsible for rendering Promises. This can be thought of as a Promise-renderer with a built-in error boundary. You should always render `<Await>` inside a `<React.Suspense>` boundary to handle fallback displays prior to the promise settling.

`<Await>` can be used to resolve the promise in one of two ways:

Directly as a render function:

```tsx
<Await resolve={promise}>{(data) => <p>{data}</p>}</Await>
```

Or indirectly via the `useAsyncValue` hook:

```tsx
function Accessor() {
  const data = useAsyncValue();
  return <p>{data}</p>;
}

<Await resolve={promise}>
  <Accessor />
</Await>;
```

`<Await>` is primarily intended to be used with the [`defer()`][deferred response] data returned from your `loader`. Returning a deferred value from your loader will allow you to render fallbacks with `<Await>`. A full example can be found in the [Deferred guide][deferred guide].

### Error Handling

If the passed promise rejects, you can provide an optional `errorElement` to handle that error in a contextual UI via the `useAsyncError` hook. If you do not provide an errorElement, the rejected value will bubble up to the nearest route-level `errorElement` and be accessible via the [`useRouteError`][userouteerror] hook.

```tsx
function ErrorHandler() {
  const error = useAsyncError();
  return (
    <p>Uh Oh, something went wrong! {error.message}</p>
  );
}

<Await resolve={promise} errorElement={<ErrorElement />}>
  <Accessor />
</Await>;
```

[useloaderdata]: ../hooks/use-loader-data
[userouteerror]: ../hooks/use-route-error
[defer response]: ../fetch/defer
[deferred guide]: ../guides/deferred
