import type { Route } from "./+types/root";

import {
  Meta,
  Link,
  Outlet,
  isRouteErrorResponse,
  useNavigation,
  useRevalidator,
} from "react-router";
import "./root.css";

export const meta = () => [{ title: "React Router Vite" }];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  console.log({ navigation: navigation.state, revalidator: revalidator.state });

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
          <p>Navigation: {navigation.state}</p>
          <p>Revalidation: {revalidator.state}</p>
          <nav>
            <ul>
              <li>
                <Link to="/" viewTransition={true}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/server-loader" viewTransition={true}>
                  Server loader
                </Link>
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

export default function Root() {
  return (
    <>
      <Outlet />
    </>
  );
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
