import {
  Link,
  Outlet,
  isRouteErrorResponse,
  useRouteError,
} from "react-router-dom";

function Nav() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>
    </nav>
  );
}

export function Component() {
  return (
    <html>
      <head></head>
      <body>
        <Nav />

        <Outlet />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error({ isRouteErrorResponse: isRouteErrorResponse(error), error });

  return (
    <html>
      <head></head>
      <body>
        <Nav />

        <h1>Oops!</h1>
        <p>Something went wrong.</p>
      </body>
    </html>
  );
}
