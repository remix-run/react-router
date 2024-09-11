import * as React from "react";
import {
  Await,
  createBrowserRouter,
  RouterProvider,
  useAsyncError,
  useFetcher,
} from "react-router-dom";

import "./index.css";

let router = createBrowserRouter([
  {
    path: "/",
    Component() {
      let fetcher = useFetcher();
      return (
        <>
          <p>fetcher state: {fetcher.state}</p>
          <button onClick={() => fetcher.load("/fetch")}>Load</button>
          <br />
          <br />
          <br />
          <button onClick={() => fetcher.abort()}>fetcher.abort()</button>{" "}
          <button onClick={() => fetcher.abort({ data: fetcher.data })}>
            {"fetcher.abort({ data:  })"}
          </button>{" "}
          <button onClick={() => fetcher.abort({ reason: new Error("oh no") })}>
            {"fetcher.abort({ reason })"}
          </button>{" "}
          <button
            onClick={() =>
              fetcher.abort({ data: fetcher.data, reason: new Error("oh no") })
            }
          >
            {"fetcher.abort({ data, reason })"}
          </button>
          <br />
          {fetcher.data ? (
            <>
              <p>fetcher critical data: {fetcher.data?.critical}</p>
              <p>
                fetcher lazy data:{" "}
                <React.Suspense fallback={"Loading..."}>
                  <Await
                    resolve={fetcher.data.lazy}
                    errorElement={<ErrorElement />}
                  >
                    {(val) => val}
                  </Await>
                </React.Suspense>
              </p>
            </>
          ) : null}
        </>
      );
    },
  },
  {
    path: "/fetch",
    async loader({ request }) {
      await new Promise((r) => setTimeout(r, 1000));
      return {
        critical: "CRITICAL",
        lazy: new Promise((resolve, reject) => {
          request.signal.addEventListener("abort", () =>
            reject(request.signal.reason)
          );
          setTimeout(() => resolve("LAZY"), 3000);
        }),
      };
    },
  },
]);

function ErrorElement() {
  let error = useAsyncError();
  return <>Error! {error.message}</>;
}

export default function App() {
  return <RouterProvider router={router} fallbackElement={<p>Loading...</p>} />;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => router.dispose());
}
