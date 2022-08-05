import React from "react";
import ReactDOM from "react-dom/client";

import { DataBrowserRouter, Outlet, Route } from "react-router-dom";
import "./index.css";
import {
  Fallback,
  Layout,
  RootErrorBoundary,
  Project,
  ProjectErrorBoundary,
  projectLoader,
} from "./routes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataBrowserRouter fallbackElement={<Fallback />}>
      <Route path="/" element={<Layout />}>
        <Route
          path=""
          element={<Outlet />}
          errorElement={<RootErrorBoundary />}
        >
          <Route
            path="projects/:projectId"
            element={<Project />}
            errorElement={<ProjectErrorBoundary />}
            loader={projectLoader}
          />
        </Route>
      </Route>
    </DataBrowserRouter>
  </React.StrictMode>
);
