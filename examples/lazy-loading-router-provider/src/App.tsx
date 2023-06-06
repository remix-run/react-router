import {
  Outlet,
  Link,
  createBrowserRouter,
  RouterProvider,
  useNavigation,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "about",
        // Single route in lazy file
        lazy: () => import("./pages/About"),
      },
      {
        path: "dashboard",
        async lazy() {
          // Multiple routes in lazy file
          let { DashboardLayout } = await import("./pages/Dashboard");
          return { Component: DashboardLayout };
        },
        children: [
          {
            index: true,
            async lazy() {
              let { DashboardIndex } = await import("./pages/Dashboard");
              return { Component: DashboardIndex };
            },
          },
          {
            path: "messages",
            async lazy() {
              let { dashboardMessagesLoader, DashboardMessages } = await import(
                "./pages/Dashboard"
              );
              return {
                loader: dashboardMessagesLoader,
                Component: DashboardMessages,
              };
            },
          },
        ],
      },
      {
        path: "*",
        element: <NoMatch />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} fallbackElement={<p>Loading...</p>} />;
}

function Layout() {
  let navigation = useNavigation();

  return (
    <div>
      <h1>Lazy Loading Example using RouterProvider</h1>

      <p>
        This example demonstrates how to lazily load route definitions using{" "}
        <code>route.lazy()</code>. To get the full effect of this demo, be sure
        to open your Network tab and watch the new bundles load dynamically as
        you navigate around.
      </p>

      <p>
        The "About" and "Dashboard" pages are not loaded until you click on the
        link. When you do, the code is loaded via a dynamic{" "}
        <code>import()</code> statement during the <code>loading</code> phase of
        the navigation. Once the code loads, the route loader executes, and then
        the element renders with the loader-provided data.
      </p>

      <p>
        This works for all data-loading/rendering related properties of a route,
        including <code>action</code>, <code>loader</code>, <code>element</code>
        , <code>errorElement</code>, and <code>shouldRevalidate</code>. You
        cannot return path-matching properties from <code>lazy()</code> such as{" "}
        <code>path</code>, <code>index</code>, <code>children</code>, and{" "}
        <code>caseSensitive</code>.
      </p>

      <div style={{ position: "fixed", top: 0, right: 0 }}>
        {navigation.state !== "idle" && <p>Navigation in progress...</p>}
      </div>

      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/dashboard/messages">Messages (Dashboard)</Link>
          </li>
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
