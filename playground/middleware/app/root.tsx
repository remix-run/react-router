import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { rootContext } from "./contexts";

export const middleware: Route.MiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start root middleware");
    context.set(rootContext, "ROOT");
    let res = await next();
    console.log("end root middleware");
    return res;
  },
];

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start root middleware");
    context.set(rootContext, "ROOT");
    await next();
    console.log("end root middleware");
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <h1>Middleware playground</h1>
        <nav>
          <ul>
            <li>
              <Link to="/">Go to /</Link>
            </li>
            <li>
              Server middleware routes:
              <ul>
                <li>
                  <Link to="/server/a">Go to /server/a</Link>
                </li>
                <li>
                  <Link to="/server/a/b">Go to /server/a/b</Link>
                </li>
              </ul>
            </li>
            <li>
              Client middleware routes:
              <ul>
                <li>
                  <Link to="/client/a">Go to /client/a</Link>
                </li>
                <li>
                  <Link to="/client/a/b">Go to /client/a/b</Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return <Outlet />;
}
