import React from "react";
import ReactDOM from "react-dom/client";

import { DataBrowserRouter, Route } from "react-router-dom";

import "./index.css";
import { Layout, getArrayLoader, LongPage } from "./routes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataBrowserRouter fallbackElement={<p>Loading...</p>}>
      <Route path="/" element={<Layout />}>
        <Route index element={<h2>Home</h2>} />
        <Route
          path="restore-by-key"
          loader={getArrayLoader}
          element={<LongPage />}
        />
        <Route
          path="restore-by-pathname"
          loader={getArrayLoader}
          element={<LongPage />}
          handle={{ scrollMode: "pathname" }}
        />
        <Route
          path="link-to-hash"
          loader={getArrayLoader}
          element={<LongPage />}
        />
      </Route>
    </DataBrowserRouter>
  </React.StrictMode>
);
