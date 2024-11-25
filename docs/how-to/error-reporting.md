---
title: Error Reporting
---

# Error Reporting

React Router catches errors in your route modules and sends them to [error boundaries](./error-boundary) to prevent blank pages when errors occur. However, ErrorBoundary isn't sufficient for logging and reporting errors. To access these caught errors, use the handleError export of the server entry module.

## 1. Reveal the server entry

If you don't see `entry.server.tsx` in your app directory, you're using a default entry. Reveal it with this cli command:

```shellscript nonumber
react-router reveal
```

## 2. Export your error handler

This function is called whenever React Router catches an error in your application on the server.

```tsx filename=entry.server.tsx
import { type HandleErrorFunction } from "react-router";

export const handleError: HandleErrorFunction = (
  error,
  { request }
) => {
  // React Router may abort some interrupted requests, don't log those
  if (!request.signal.aborted) {
    myReportError(error);

    // make sure to still log the error so you can see it
    console.error(error);
  }
};
```
