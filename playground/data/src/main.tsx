import * as React from "react";
import * as ReactClient from "react-dom/client";
import {
  Link,
  Outlet,
  createBrowserRouter,
  useLoaderData,
  useMatches,
  useParams,
} from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter(
  [
    {
      id: "root",
      path: "/",
      Component: Root,
      children: [
        {
          index: true,
          loader() {
            return { message: "Hello React Router!" };
          },
          Component: Index,
        },
        {
          path: "projects(/optional)",
          Component: ProjectsLayout,
          loader({ params }) {
            return { params };
          },
          children: [
            {
              index: true,
              Component: Project,
            },
            {
              path: "tasks/:taskId",
              Component: Task,
            },
          ],
        },
        {
          path: "archive/:year?/:month?",
          Component: Archive,
        },
        {
          path: "files/*",
          Component: Files,
        },
      ],
    },
  ],
  {
    future: {
      unstable_routePatternMatching: true,
    },
  },
);

/*
Route-pattern matching keeps route definitions in React Router path syntax:

createBrowserRouter(
  [
    {
      path: "/",
      children: [
        { path: "projects/:projectId?", Component: ProjectsLayout },
        { path: "archive/:year?/:month?", Component: Archive },
        { path: "files/*", Component: Files },
      ],
    },
  ],
  { future: { unstable_routePatternMatching: true } },
);
*/

function Root() {
  return (
    <main>
      <nav>
        <Link to="/">Home</Link>{" "}
        <Link to="/projects">Projects</Link>{" "}
        <Link to="/projects/react-router/tasks/42">Task</Link>{" "}
        <Link to="/projects/tasks/42">Optional project task</Link>{" "}
        <Link to="/archive/2026/07">Archive</Link>{" "}
        <Link to="/files/a/b/c">Files</Link>
      </nav>
      <pre>
        {JSON.stringify(useMatches(), null, 2)}
      </pre>
      <Outlet />
    </main>
  );
}

function Index() {
  let data = useLoaderData() as { message: string };
  return <h1>{data.message}</h1>;
}

function ProjectsLayout() {
  return (
    <>
      <h1>Projects</h1>
      <Outlet />
    </>
  );
}

function Project() {
  let { projectId } = useParams();
  return <p>Project: {projectId ?? "all"}</p>;
}

function Task() {
  let { projectId, taskId } = useParams();
  return (
    <p>
      Task {taskId} for {projectId ?? "all projects"}
    </p>
  );
}

function Archive() {
  let { year, month } = useParams();
  return (
    <p>
      Archive: {[year, month].filter(Boolean).join("/") || "all"}
    </p>
  );
}

function Files() {
  let params = useParams();
  return <p>Files: {params["*"]}</p>;
}

ReactClient.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
