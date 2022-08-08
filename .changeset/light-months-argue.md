---
"react-router": patch
"@remix-run/router": patch
---

Feat: adds `defer()` support to data routers

Returning a `defer()` from a `loader` allows you to separate _critical_ loader data that you want to wait for prior to rendering the destination page from _non-critical_ data that you are OK to show a spinner for until it loads.

```jsx
// In your route loader, return a defer() and choose per-key whether to
// await the promise or not.  As soon as the awaited promises resolve, the
// page will be rendered.
function loader() {
  return defer({
    critical: await getCriticalData(),
    lazy: getLazyData(),
  });
};

// In your route element, grab the values from useLoaderData and render them
// with <Await> inside a <React.Suspense> boundary
function Page() {
  let data = useLoaderData();
  return (
    <>
      <p>Critical Data: {data.critical}</p>
      <React.Suspense fallback={<p>Loading...</p>}>
        <Await resolve={data.lazy} errorElement={<RenderError />}>
          <RenderData />
        </Await>
      </React.Suspense>
    </>
  );
}

// Use separate components to render the data once it resolves, and access it
// via the useAsyncValue hook
function RenderData() {
  let data = useAsyncValue();
  return <p>Lazy: {data}</p>;
}

function RenderError() {
  let data = useAsyncError();
  return <p>Error! {data.message} {data.stack}</p>;
}
```

If you want to skip the separate components, you can use the Render Props
pattern and handle the rendering of the deferred data inline:

```jsx
function Page() {
  let data = useLoaderData();
  return (
    <>
      <p>Critical Data: {data.critical}</p>
      <React.Suspense fallback={<p>Loading...</p>}>
        <Await resolve={data.lazy} errorElement={<RenderError />}>
          {(data) => <p>{data}</p>}
        </Await>
      </React.Suspense>
    </>
  );
}
```
