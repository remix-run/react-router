import * as React from "react";
import * as ReactClient from "react-dom/client";
import { createBrowserRouter, useLoaderData } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
  {
    id: "index",
    path: "/",
    loader() {
      return { message: "Hello React Router!" };
    },
    Component() {
      let data = useLoaderData();
      return <h1>{data.message}</h1>;
    },
  },
]);

ReactClient.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
