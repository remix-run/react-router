import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import {
  Await,
  createBrowserRouter,
  defer,
  json,
  Link,
  Outlet,
  RouterProvider,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router-dom";
import "./index.css";

const router = createBrowserRouter(
  [
    {
      path: "/",
      Component() {
        let navigation = useNavigation();
        return (
          <>
            {navigation.state !== "idle" ? (
              <div className="is-loading">Loading...</div>
            ) : null}
            <Nav />
            <div className="content">
              <Outlet />
            </div>
          </>
        );
      },
      children: [
        {
          index: true,
          Component() {
            return <h1>Home</h1>;
          },
        },
        {
          path: "loader",
          async loader() {
            await new Promise((r) => setTimeout(r, 1000));
            return json({ message: "LOADER DATA" });
          },
          Component() {
            let data = useLoaderData() as { message: string };
            return (
              <>
                <h1>Test</h1>
                <p>Loader Data: {data.message}</p>
              </>
            );
          },
        },
        {
          path: "defer",
          async loader({ request }) {
            let value = new URL(request.url).searchParams.get("value") || "";
            await new Promise((r) => setTimeout(r, 500));
            return defer({
              value,
              critical: "CRITICAL PATH DATA " + value,
              lazy: new Promise((r) =>
                setTimeout(() => r("LAZY DATA " + value), 2500)
              ),
            });
          },
          Component() {
            let data = useLoaderData() as {
              value: string;
              critical: string;
              lazy: Promise<string>;
            };
            return (
              <>
                <h1>Defer {data.value}</h1>
                <p>Critical Data: {data.critical}</p>
                {/*
                  use a key on then suspense boundary to trigger a fallback
                  on location changes
                */}
                <React.Suspense
                  fallback={<p>Suspense boundary in the route...</p>}
                  key={useLocation().key}
                >
                  <Await resolve={data.lazy}>
                    {(value) => <p>Lazy Data: {value}</p>}
                  </Await>
                </React.Suspense>
              </>
            );
          },
        },
        {
          path: "defer-no-boundary",
          async loader({ request }) {
            let value = new URL(request.url).searchParams.get("value") || "";
            await new Promise((r) => setTimeout(r, 500));
            return defer({
              value,
              critical: "CRITICAL PATH DATA - NO BOUNDARY " + value,
              lazy: new Promise((r) =>
                setTimeout(() => r("LAZY DATA - NO BOUNDARY " + value), 1000)
              ),
            });
          },
          Component() {
            let data = useLoaderData() as {
              value: string;
              data: string;
              critical: string;
              lazy: Promise<string>;
            };
            return (
              <>
                <h1>Defer No Boundary {data.value}</h1>
                <p>Critical Data: {data.critical}</p>
                <div>
                  <Await resolve={data.lazy}>
                    {(value) => <p>Lazy Data: {value}</p>}
                  </Await>
                </div>
              </>
            );
          },
        },
      ],
    },
  ],
  {
    future: {
      // Prevent react router from await-ing defer() promises for revalidating
      // loaders, which includes changing search params on the active route
      v7_fallbackOnDeferRevalidation: true,
    },
  }
);

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOMClient.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider
      router={router}
      future={{
        // Wrap all state updates in React.startTransition()
        v7_startTransition: true,
        // Wrap all completed navigation state updates in
        // document.startViewTransition()
        unstable_startViewTransition: true,
      }}
    />
  </React.StrictMode>
);

function Nav() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
          <ul>
            <li>
              ✅ The / route has no loader is should be an immediate/synchronous
              transition
            </li>
          </ul>
        </li>
        <li>
          <Link to="/loader">Loader Delay</Link>
          <ul>
            <li>
              ✅ The /loader route has a 1 second loader delay, and updates the
              DOM synchronously upon completion
            </li>
          </ul>
        </li>
        <li>
          <Link to="/defer">Deferred Data</Link>
          <ul>
            <li>
              The /defer route has a a 500ms loader delay with a 1s defer call
              that will Suspend in the destination route
            </li>
            <li>
              ✅ It also uses a location-based key on the suspense boundary so
              revalidations will trigger a fresh fallback. Click this link again
              while on the page to see this behavior (requires
              v7_fallbackOnDeferRevalidation: true)
            </li>
            <li>
              ❌ Without the key on the suspense boundary, it will animate in
              the current boundary on top of itself
            </li>
          </ul>
        </li>
        <li>
          <Link to="/defer-no-boundary">Deferred Data (without boundary)</Link>
          <ul>
            <li>
              The /defer-no-boundary route has a a 500ms loader delay with a 1s
              defer call without a Suspense boundary in the destination route
            </li>
            <li>
              ❌ This is where things go awry because without a boundary the
              usage of React.startTransition causes React to freeze the current
              UI in place so we animate the current page and then the updates
              snap in. This is where I think React needs to be involved since
              they decide when it's finally OK to update the DOM inside
              startTransition
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
