import type { Route } from "./+types/root";

import { Meta, Link, Outlet, isRouteErrorResponse, type MiddlewareFunction } from "react-router";
import "./root.css";

export const middleware: MiddlewareFunction[] = [
  async ({ request }, next) => {
    let response = await next();

    if (
      request.method === "GET" &&
      response instanceof Response &&
      response.status === 200 &&
      request.headers.get("sec-purpose") === "prefetch" &&
      !response.headers.has("Cache-Control")
    ) {
      let cachedResponse = new Response(response.body, response);
      cachedResponse.headers.set("Cache-Control", "max-age=5");
      return cachedResponse;
    }
    return response;
  }
];

export const meta = () => [{ title: "React Router Vite" }];

// export const shouldRevalidate = () => false;

export function ServerLayout({ children }: { children: React.ReactNode }) {
  console.log("Layout");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
      </head>
      <body>
        <header>
          <h1 className="root__header">React Router Vite</h1>
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/server-loader" prefetch="intent">Server loader</Link>
              </li>
              <li>
                <Link to="/client-loader">Client loader</Link>
              </li>
              <li>
                <Link to="/client-loader-hydrate">Client loader hydrate</Link>
              </li>
              <li>
                <Link to="/client-loader-without-server-loader">
                  Client loader without server loader
                </Link>
              </li>
              <li>
                <Link to="/mdx">MDX</Link>
              </li>
              <li>
                <Link to="/mdx-glob">MDX glob</Link>
              </li>
            </ul>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

export function ServerComponent({}: Route.ServerComponentProps) {
  console.log("Root");
  return (
    <>
      <Outlet />
    </>
  );
}

// export default function ClientComponent() {
//   console.log("Root");
//   return (
//     <>
//       <Outlet />
//     </>
//   );
// }

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <h1>
      {isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : error instanceof Error
          ? error.message
          : "Unknown Error"}
    </h1>
  );
}
