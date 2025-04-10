"use client";

import { useRouteError } from "react-router";

export function ErrorReporter() {
  const error = useRouteError();

  console.log(error);

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
