import { Link, Links, Outlet, ScrollRestoration } from "react-router";

export { ErrorBoundary } from "./root.client";

import { Counter } from "../../counter";

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
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>
      {counter}
      <Outlet />
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
        {children}
        <ScrollRestoration />
      </body>
    </html>
  );
}
