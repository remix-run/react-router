"use client";

import { Outlet, useLoaderData } from "react-router";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>React Server</title>
      </head>
      <body>{children}</body>
    </html>
  );
}

export default function Root() {
  const { counter, message } = useLoaderData<typeof import("./root").loader>();
  return (
    <>
      <h1>{message}</h1>
      {counter}
      <Outlet />
    </>
  );
}

export function ErrorBoundary() {
  return <h1>Something went wrong!</h1>;
}
