import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import {
  createBrowserRouter,
  Link,
  RouterProvider,
  useNavigation,
} from "react-router-dom";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    Component() {
      let navigation = useNavigation();
      let isLoading = navigation.state !== "idle";
      return (
        <>
          <h1>Home</h1>
          <Link to="/test">Test</Link>
          <p>
            The /test route has a 1s delay in it's loader, so the DOM transition
            doesn't start until the loader completes
          </p>
          {isLoading ? <div className="is-loading">Loading...</div> : null}
        </>
      );
    },
  },
  {
    path: "/test",
    async loader() {
      await new Promise((r) => setTimeout(r, 1000));
      return null;
    },
    Component() {
      let navigation = useNavigation();
      let isLoading = navigation.state !== "idle";
      return (
        <>
          <h1>Test</h1>
          <Link to="/">Home</Link>
          <p>
            The home route has no loader so it starts transitioning immediately
          </p>
          {isLoading ? <div className="is-loading">Loading...</div> : null}
        </>
      );
    },
  },
]);

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOMClient.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
