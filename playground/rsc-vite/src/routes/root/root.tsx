import { Link, Links, Outlet, ScrollRestoration } from "react-router";
import { type unstable_MiddlewareFunction } from "react-router/rsc";

import { Counter } from "../../counter";
import { ErrorReporter, NavigationState } from "./root.client";

export { shouldRevalidate } from "./root.client";

export function headers() {
  return new Headers({ "x-root": "yes" });
}

export const unstable_middleware: unstable_MiddlewareFunction<Response>[] = [
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
    counter: <Counter />,
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
      <h1>Root Route</h1>
      <p>Loader data: {loaderData.message}</p>
      {loaderData.counter}
      <Outlet />
    </div>
  );
}

export function HydrateFallback() {
  return <h1>Loading...</h1>;
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Root - Something went wrong!</h1>
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
        <div style={{ border: "1px solid black", padding: "10px" }}>
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
