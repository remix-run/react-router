import { Link, Links, Outlet, ScrollRestoration } from "react-router";
import { type MiddlewareFunction } from "react-router";

import { Counter } from "../../counter";
import { ErrorReporter, NavigationState } from "./root.client";
import "./root.css";
import { Suspense } from "react";

export { shouldRevalidate } from "./root.client";

export function headers() {
  return new Headers({ "x-root": "yes" });
}

export const middleware: MiddlewareFunction<Response>[] = [
  async ({ request }, next) => {
    console.log(">>> RSC middleware", request.url);
    let res = await next();
    console.log("<<< RSC middleware", request.url);
    return res;
  },
];

export async function loader() {
  await new Promise((r) => setTimeout(r, 500));
  return {
    counter: <Counter key="counter" />,
    message: `Root route loader ran at ${new Date().toISOString()}`,
  };
}

export default function RootRoute({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <p>Root Route</p>
      <p>Loader data: {loaderData.message}</p>
      {loaderData.counter}
      <Outlet />
    </div>
  );
}

export function HydrateFallback() {
  return <p>Loading...</p>;
}

export function ErrorBoundary() {
  return (
    <>
      <p>Root - Something went wrong!</p>
      <ErrorReporter />
    </>
  );
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
          <p>Root Layout</p>
          <NavigationState />
          <Counter />
          <Suspense>{children}</Suspense>
        </div>
        <ScrollRestoration />
      </body>
    </html>
  );
}
