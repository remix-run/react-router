import * as React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import {
  Await,
  createBrowserRouter,
  defer,
  Form,
  Link,
  Outlet,
  RouterProvider,
  useAsyncError,
  useAsyncValue,
  useFetcher,
  useFetchers,
  useLoaderData,
  useNavigation,
  useParams,
  useRevalidator,
  useRouteError,
} from "react-router-dom";

import type { Todos } from "./todos";
import { addTodo, deleteTodo, getTodos } from "./todos";

import "./index.css";

let router = createBrowserRouter(
  [
    {
      path: "/",
      Component() {
        let fetchers = useFetchers();
        return (
          <>
            <pre>{JSON.stringify(fetchers)}</pre>
            <Outlet />
          </>
        );
      },
      children: [
        {
          index: true,
          Component() {
            let fetcher = useFetcher({ key: "a" });
            let fetcher2 = useFetcher({ key: "a" });
            return (
              <div>
                <button onClick={() => fetcher.load("/fetch")}>Load</button>
                <button onClick={() => fetcher2.load("/fetch")}>Load</button>
                <pre>{JSON.stringify(fetcher)}</pre>
                <pre>{JSON.stringify(fetcher2)}</pre>
              </div>
            );
          },
        },
      ],
    },
    {
      path: "/fetch",
      loader: () => new Promise((r) => setTimeout(() => r("FETCH"), 1000)),
    },
  ],
  {
    future: {
      v7_fetcherPersist: true,
    },
  }
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => router.dispose());
}

export default function App() {
  return <RouterProvider router={router} fallbackElement={<Fallback />} />;
}

export function sleep(n: number = 500) {
  return new Promise((r) => setTimeout(r, n));
}

export function Fallback() {
  return <p>Performing initial data load</p>;
}
