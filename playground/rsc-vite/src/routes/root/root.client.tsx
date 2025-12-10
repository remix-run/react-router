"use client";

import {
  useRouteError,
  useNavigation,
  isRouteErrorResponse,
  Outlet,
  ScrollRestoration,
  Link,
  Links,
} from "react-router";
import { Counter } from "../../counter";

export default function RootRoute({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h1>Root Route</h1>
      <p>Loader data: {loaderData.message}</p>
      {loaderData.counter}
      <Outlet />
    </div>
  );
}

export function ErrorReporter() {
  const error = useRouteError();

  if (typeof document !== "undefined") {
    console.log(error);
  }

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h2>Error Response</h2>
        <p>Status: {error.status}</p>
        <p>Data: {JSON.stringify(error.data)}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Error</h2>
      <p>{error instanceof Error ? error.message : String(error)}</p>
    </div>
  );
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
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>React Server</title>
        <Links />
      </head>
      <body>
        <div className="server-box">
          <header>
            <Link to="/">Home</Link>
            {" | "}
            <Link to="/about">About</Link>
            {" | "}
            <Link to="/parent">Parent</Link>
            {" | "}
            <Link to="/parent/child">Child</Link>
            {" | "}
            <Link to="/redirect">Redirect</Link>
          </header>
          <h1>Root Layout</h1>
          <NavigationState />
          <Counter />
          {children}
        </div>
        <ScrollRestoration />
      </body>
    </html>
  );
}
