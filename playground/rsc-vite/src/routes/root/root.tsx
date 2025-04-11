import {
  Link,
  Links,
  Outlet,
  ScrollRestoration,
  useRouteError,
} from "react-router";

import { Counter } from "../../counter";
import { ErrorReporter } from "./root.client";

export function loader() {
  return {
    counter: <Counter />,
    message: "Hello from the server!",
  };
}

export default function Root({
  loaderData: { counter, message },
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <>
      <h1>{message}</h1>
      {counter}
      <Outlet />
    </>
  );
}

export function HydrateFallback() {
  return <h1>Loading...</h1>;
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Something went wrong!</h1>
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
        <header>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
          </ul>
          <Counter />
        </header>
        {children}
        <ScrollRestoration />
      </body>
    </html>
  );
}
