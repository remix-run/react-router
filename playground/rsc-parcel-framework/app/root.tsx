import { Link, Outlet } from "react-router";
import "./root.css";

export function Layout({ children }: { children: React.ReactNode }) {
  console.log("Layout");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>React Router Parcel</title>
      </head>
      <body>
        <header>
          <h1 className="root__header">React Router Parcel</h1>
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/server-loader">Server loader</Link>
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
            </ul>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

export function ServerComponent() {
  console.log("Root");
  return (
    <>
      <Outlet />
    </>
  );
}

export function ErrorBoundary() {
  return <h1>Oooops</h1>;
}
