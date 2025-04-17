"use client";

import { useRouteError, useNavigation } from "react-router";

export function ErrorReporter() {
  const error = useRouteError();

  if (typeof document !== "undefined") {
    console.log(error);
  }

  return null;
}

export function NavigationState() {
  let navigation = useNavigation();
  return <p>Navigation state: {navigation.state}</p>;
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Something went wrong!</h1>
      <ErrorReporter />
    </>
  );
}

export function shouldRevalidate({ nextUrl }: { nextUrl: URL }) {
  return !nextUrl.pathname.endsWith("/about");
}
