import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import {
  Await,
  createBrowserRouter,
  defer,
  json,
  Link,
  NavLink,
  Outlet,
  RouterProvider,
  unstable_useViewTransition,
  unstable_useViewTransitionFrom,
  useLoaderData,
  useNavigation,
  useParams,
} from "react-router-dom";
import "./index.css";

const images = [
  "https://remix.run/blog-images/headers/the-future-is-now.jpg",
  "https://remix.run/blog-images/headers/waterfall.jpg",
  "https://remix.run/blog-images/headers/webpack.png",
  "https://remix.run/blog-images/headers/remix-conf.jpg",
];

// FIXME: Remove
function LOG(...args: any[]) {
  console.debug(new Date().toISOString(), ...args);
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      Component() {
        // turn on basic view transitions for the whole app
        unstable_useViewTransition();

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
            return defer({
              value,
              critical: "CRITICAL PATH DATA " + value,
              lazy: new Promise((r) =>
                setTimeout(() => r("LAZY DATA " + value), 1000)
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
                <React.Suspense
                  fallback={<p>Suspense boundary in the route...</p>}
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
        {
          path: "images",
          Component() {
            return (
              <div className="image-list">
                <h1>Image List</h1>
                <div>
                  {images.map((src, idx) => (
                    <NavLink
                      key={src}
                      to={`/images/${idx}`}
                      unstable_viewTransition
                    >
                      <p>Image Number {idx}</p>
                      <img src={src} alt={`Img ${idx}`} />
                    </NavLink>
                    // <NavImage key={src} src={src} idx={idx} />
                  ))}
                </div>
              </div>
            );
          },
        },
        {
          path: "images/:id",
          Component() {
            let params = useParams();
            let isTransitioning = unstable_useViewTransitionFrom("/images");
            return (
              <div
                className={`image-detail ${
                  isTransitioning ? "transitioning" : ""
                }`}
              >
                <h1>Image Number {params.id}</h1>
                <img src={images[Number(params.id)]} alt={`${params.id}`} />
              </div>
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
      unstable_fallbackOnDeferRevalidation: true,
    },
  }
);

function NavImage({ src, idx }: { src: string; idx: number }) {
  let href = `/images/${idx}`;
  let isTransitioning = unstable_useViewTransition(href);
  console.log(href, isTransitioning);
  return (
    <NavLink to={href}>
      <p style={{ viewTransitionName: isTransitioning ? "image-title" : "" }}>
        Image Number {idx}
      </p>
      <img
        src={src}
        alt={`Img ${idx}`}
        style={{ viewTransitionName: isTransitioning ? "image-expand" : "" }}
      />
    </NavLink>
  );
}

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOMClient.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider
      router={router}
      future={{
        // Wrap all state updates in React.startTransition()
        v7_startTransition: true,
      }}
    />
  </React.StrictMode>
);

function Nav() {
  let value = Math.round(Math.random() * 100);
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
          <ul>
            <li>
              The / route has no loader is should be an immediate/synchronous
              transition
            </li>
          </ul>
        </li>
        <li>
          <Link to="/loader">Loader Delay</Link>
          <ul>
            <li>
              The /loader route has a 1 second loader delay, and updates the DOM
              synchronously upon completion
            </li>
          </ul>
        </li>
        <li>
          <Link to="/images">Image Gallery Example</Link>
        </li>
        <li>
          <Link to={`/defer?value=${value}`}>Deferred Data</Link>
          <ul>
            <li>
              The /defer route has 1s defer call that will Suspend in the
              destination route
            </li>
            <li>
              Due to flushSync, it will always re-fallback on navigations - even
              without a key on the suspense boundary
            </li>
          </ul>
        </li>
        <li>
          <Link to="/defer-no-boundary">Deferred Data (without boundary)</Link>
          <ul>
            <li>
              The /defer-no-boundary route has a 1s defer call without a
              Suspense boundary in the destination route
            </li>
            <li>❌ This is where things go wrong</li>
            <li>
              Calling React.flushSync inside React.startTransition breaks the
              "freezing" of the UI since suspending UI doesn't seem to know it's
              inside of startTransition anymore. This makes some sense since
              they're sort of inherently opposites
            </li>
            <li>
              However, we need to call React.flushSync inside
              document.startViewTransition for more complex animations
            </li>
            <li>
              So do we just disable startTransition if startViewTransitions have
              been enabled? We still get the same error...
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
