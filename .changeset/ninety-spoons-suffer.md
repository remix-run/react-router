---
"react-router": patch
"react-router-dom": patch
"@remix-run/router": patch
---

feat: Add `createStaticRouter` for `@remix-run/router` SSR usage

**Notable changes:**

- `request` is now the driving force inside the router utils, so that we can better handle `Request` instances coming form the server (as opposed to `string` and `Path` instances coming from the client)
- Removed the `signal` param from `loader` and `action` functions in favor of `request.signal`

**Example usage (Document Requests):**

```jsx
// Create a static handler
let { dataRoutes, query } = createStaticHandler({ routes });

// Perform a full-document query for the incoming Fetch Request.  This will
// execute the appropriate action/loaders and return either the state or a
// Fetch Response in the case of redirects.
let state = await query(fetchRequest);

// If we received a Fetch Response back, let our server runtime handle directly
if (state instanceof Response) {
  throw state;
}

// Otherwise, render our application providing the data routes and state
let html = ReactDOMServer.renderToString(
  <React.StrictMode>
    <DataStaticRouter dataRoutes={dataRoutes} state={state} />
  </React.StrictMode>
);

// Grab the hydrationData to send to the client for <DataBrowserRouter>
let hydrationData = {
  loaderData: state.loaderData,
  actionData: state.actionData,
  errors: state.errors,
};
```

**Example usage (Data Requests):**

```jsx
// Create a static route handler
let { queryRoute } = createStaticHandler({ routes });

// Perform a single-route query for the incoming Fetch Request.  This will
// execute the appropriate singular action/loader and return either the raw
// data or a Fetch Response
let data = await queryRoute(fetchRequest);

// If we received a Fetch Response back, return it directly
if (data instanceof Response) {
  return data;
}

// Otherwise, construct a Response from the raw data (assuming json here)
return new Response(JSON.stringify(data), {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
});
```
