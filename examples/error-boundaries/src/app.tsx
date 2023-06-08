import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import "./index.css";
import {
  Fallback,
  Layout,
  RootErrorBoundary,
  Project,
  ProjectErrorBoundary,
  projectLoader,
} from "./routes";

let router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <Outlet />,
        errorElement: <RootErrorBoundary />,
        children: [
          {
            path: "projects/:projectId",
            element: <Project />,
            errorElement: <ProjectErrorBoundary />,
            loader: projectLoader,
          },
        ],
      },
    ],
  },
]);

if (import.meta.hot) {
  import.meta.hot.dispose(() => router.dispose());
}

export default function App() {
  return <RouterProvider router={router} fallbackElement={<Fallback />} />;
}
