"use client";

import { isRouteErrorResponse, useRouteError } from "react-router";

const reportedErrors = new Set();

export function ErrorReporter() {
  const error = useRouteError();

  const routeError = isRouteErrorResponse(error);

  if (!routeError && !reportedErrors.has(error)) {
    reportedErrors.add(error);
    console.log(error);
  }

  return null;
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Something went wrong!</h1>
      <ErrorReporter />
    </>
  );
}
