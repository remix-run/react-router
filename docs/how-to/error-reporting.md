---
title: Error Reporting
---

# Error Reporting

[MODES: framework,data]

<br/>
<br/>

React Router catches errors in your route modules and sends them to [error boundaries](./error-boundary) to prevent blank pages when errors occur. However, `ErrorBoundary` isn't sufficient for logging and reporting errors.

## Server Errors

[modes: framework]

To access these caught errors on the server, use the `handleError` export of the server entry module.

### 1. Reveal the server entry

If you don't see [`entry.server.tsx`][entryserver] in your app directory, you're using a default entry. Reveal it with this cli command:

```shellscript nonumber
react-router reveal entry.server
```

### 2. Export your error handler

This function is called whenever React Router catches an error in your application on the server.

```tsx filename=entry.server.tsx
import { type HandleErrorFunction } from "react-router";

export const handleError: HandleErrorFunction = (
  error,
  { request },
) => {
  // React Router may abort some interrupted requests, don't log those
  if (!request.signal.aborted) {
    myReportError(error);

    // make sure to still log the error so you can see it
    console.error(error);
  }
};
```

See also:

- [`handleError`][handleError]

## Client Errors

To access these caught errors on the client, use the `onError` prop on your [`HydratedRouter`][hydratedrouter] or [`RouterProvider`][routerprovider] component.

### Framework Mode

[modes: framework]

#### 1. Reveal the client entry

If you don't see [`entry.client.tsx`][entryclient] in your app directory, you're using a default entry. Reveal it with this cli command:

```shellscript nonumber
react-router reveal entry.client
```

#### 2. Add your error handler

This function is called whenever React Router catches an error in your application on the client.

```tsx filename=entry.client.tsx
import { type ClientOnErrorFunction } from "react-router";

const onError: ClientOnErrorFunction = (
  error,
  { location, params, unstable_pattern, errorInfo },
) => {
  myReportError(error, location, errorInfo);

  // make sure to still log the error so you can see it
  console.error(error, errorInfo);
};

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={onError} />
    </StrictMode>,
  );
});
```

See also:

- [`<HydratedRouter onError>`][hydratedrouter-onerror]

### Data Mode

[modes: data]

This function is called whenever React Router catches an error in your application on the client.

```tsx
import { type ClientOnErrorFunction } from "react-router";

const onError: ClientOnErrorFunction = (
  error,
  { location, params, unstable_pattern, errorInfo },
) => {
  myReportError(error, location, errorInfo);

  // make sure to still log the error so you can see it
  console.error(error, errorInfo);
};

function App() {
  return <RouterProvider onError={onError} />;
}
```

See also:

- [`<RouterProvider onError>`][routerprovider-onerror]

[entryserver]: ../api/framework-conventions/entry.server.tsx
[handleError]: ../api/framework-conventions/entry.server.tsx#handleerror
[entryclient]: ../api/framework-conventions/entry.client.tsx
[hydratedrouter]: ../api/framework-routers/HydratedRouter
[routerprovider]: ../api/data-routers/RouterProvider
[hydratedrouter-onerror]: ../api/framework-routers/HydratedRouter#onError
[routerprovider-onerror]: ../api/data-routers/RouterProvider#onError
