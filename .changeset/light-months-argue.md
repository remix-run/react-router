---
"react-router": patch
"@remix-run/router": patch
---

Feat: adds `deferred` support to data routers

Returning a `deferred` from a `loader` allows you to separate _critical_ loader data that you want to wait for prior to rendering the destination page from _non-critical_ data that you are OK to show a spinner for until it loads.

```jsx
// In your route loader, return a deferred() and choose per-key whether to
// await the promise or not.  As soon as the awaited promises resolve, the
// page will be rendered.
function loader() {
  return deferred({
    critical: await getCriticalData(),
    lazy1: getLazyData(),
  });
};

// In your route element, grab the values from useLoaderData and render them
// with <Deferred>
function DeferredPage() {
  let data = useLoaderData();
  return (
    <>
      <p>Critical Data: {data.critical}</p>
      <Deferred
        data={data.lazy}
        fallback={<p>Loading...</p>}
        errorBoundary={<RenderDeferredError />}>
        <RenderDeferredData />
      </Deferred>
    </>
  );
}

// Use separate components to render the data once it resolves, and access it
// via the useDeferred hook
function RenderDeferredData() {
  let data = useDeferred();
  return <p>Lazy: {data}</p>;
}

function RenderDeferredError() {
  let data = useDeferred();
  return (<p>Error! {data.message} {data.stack}</p>;
}
```

If you want to skip the separate components, you can use the Render Props
pattern and handle the rendering inline:

```jsx
function DeferredPage() {
  let data = useLoaderData();
  return (
    <>
      <p>Critical Data: {data.critical}</p>
      <Deferred data={data.lazy} fallback={<p>Loading...</p>}>
        {({ data }) =>
          isDeferredError(data) ? <p>Error! {data.message}</p> : <p>{data}</p>
        }
      </Deferred>
    </>
  );
}
```
