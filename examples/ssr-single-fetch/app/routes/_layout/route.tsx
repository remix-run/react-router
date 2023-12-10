import {
  Link,
  Outlet,
  isRouteErrorResponse,
  useRouteError,
} from "react-router-dom";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head></head>
      <body>
        <div>
          <h1>Data Router Server Rendering Example</h1>

          <p>
            If you check out the HTML source of this page, you'll notice that it
            already contains the HTML markup of the app that was sent from the
            server, and all the loader data was pre-fetched!
          </p>

          <p>
            This is great for search engines that need to index this page. It's
            also great for users because server-rendered pages tend to load more
            quickly on mobile devices and over slow networks.
          </p>

          <p>
            Another thing to notice is that when you click one of the links
            below and navigate to a different URL, then hit the refresh button
            on your browser, the server is able to generate the HTML markup for
            that page as well because you're using React Router on the server.
            This creates a seamless experience both for your users navigating
            around your site and for developers on your team who get to use the
            same routing library in both places.
          </p>

          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/lazy">Lazy</Link>
              </li>
              <li>
                <Link to="/redirect">Redirect to Home</Link>
              </li>
              <li>
                <Link to="/nothing-here">Nothing Here</Link>
              </li>
            </ul>
          </nav>

          <hr />

          {children}
        </div>
      </body>
    </html>
  );
}

export function Component() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error({ isRouteErrorResponse: isRouteErrorResponse(error), error });

  return (
    <Layout>
      <h1>Oops!</h1>
      <p>Something went wrong.</p>
    </Layout>
  );
}
