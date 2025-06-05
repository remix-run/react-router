"use client";

import {
  Link,
  Links,
  Outlet,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { loader } from "./root";

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
        {children}
        <ScrollRestoration />
      </body>
    </html>
  );
}

export function Component() {
  const { counter, message } = useLoaderData<typeof loader>();
  return (
    <>
      <h1>{message}</h1>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/fetcher">Fetcher</Link>
        </li>
      </ul>
      {counter}
      <Outlet />
    </>
  );
}

export function ErrorBoundary() {
  return <h1>Something went wrong!</h1>;
}
