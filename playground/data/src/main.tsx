import * as React from "react";
import * as ReactClient from "react-dom/client";
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  createBrowserRouter,
  unstable_useRouterState as useRouterState,
  useLoaderData,
  useParams,
  useLocation,
} from "react-router";
import { RouterProvider } from "react-router/dom";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PROJECTS = [
  { id: "alpha", name: "Project Alpha", description: "The first project." },
  { id: "beta", name: "Project Beta", description: "The second project." },
  { id: "gamma", name: "Project Gamma", description: "The third project." },
];

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    Component: RootLayout,
    children: [
      {
        id: "home",
        index: true,
        Component: Home,
      },
      {
        id: "about",
        path: "about",
        Component: About,
      },
      {
        // Splat path so the data router matches `/declarative` and any
        // sub-paths beneath it; descendant `<Routes>` handle the rest.
        id: "declarative-shell",
        path: "declarative/*",
        Component: DeclarativeShell,
      },
      {
        id: "projects",
        path: "projects",
        async loader() {
          await sleep(1000)
          return { projects: PROJECTS };
        },
        Component: ProjectsLayout,
        children: [
          {
            id: "projects-index",
            index: true,
            Component: ProjectsIndex,
          },
          {
            id: "project",
            path: ":projectId",
            async loader({ params }) {
              await sleep(1000);
              const project = PROJECTS.find((p) => p.id === params.projectId);
              if (!project) throw new Response("Not Found", { status: 404 });
              return { project };
            },
            Component: ProjectDetail,
            children: [
              {
                id: "project-tasks",
                path: "tasks/:taskId",
                async loader({ params }) {
                  await sleep(750);
                  return {
                    task: {
                      id: params.taskId,
                      title: `Task #${params.taskId}`,
                    },
                  };
                },
                Component: TaskDetail,
              },
            ],
          },
        ],
      },
    ],
  },
]);

function RootLayout() {
  // Usage WITHOUT a path argument — `active` is always populated, `pending`
  // appears during in-flight navigations.
  const state = useRouterState();

  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <h1>unstable_useRouterState playground</h1>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/declarative">Declarative</NavLink>
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/projects/alpha">Alpha</NavLink>
        <NavLink to="/projects/beta?tab=overview">Beta (?tab=overview)</NavLink>
        <NavLink to="/projects/gamma/tasks/42">Gamma › Task 42</NavLink>
      </nav>

      <RouterStatePanel title="useRouterState()" state={state} />

      <hr style={{ margin: "16px 0" }} />
      <Outlet />
    </div>
  );
}

function RouterStatePanel({
  title,
  state,
}: {
  title: string;
  state: ReturnType<typeof useRouterState>;
}) {
  return (
    <section
      style={{
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
        background: "#fafafa",
      }}
    >
      <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Variant label="active" variant={state.active} />
        <Variant label="pending" variant={state.pending} />
      </div>
    </section>
  );
}

function Variant({
  label,
  variant,
}: {
  label: string;
  variant: ReturnType<typeof useRouterState>["pending"];
}) {
  return (
    <div
      style={{
        padding: 8,
        border: "1px dashed #aaa",
        borderRadius: 4,
        background: variant ? "#fff" : "#f0f0f0",
      }}
    >
      <strong>{label}:</strong>{" "}
      {variant === null ? (
        <em>null</em>
      ) : (
        <pre style={{ margin: "4px 0 0", fontSize: 12 }}>
          {JSON.stringify(variant, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
      <p>
        Click around the nav above. The panel shows the unified router state —
        try clicking <Link to="/projects/alpha">Alpha</Link> to watch the{" "}
        <code>pending</code> column populate during the loader delay.
      </p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
      <p>A simple sibling route — watch the panel update as you navigate.</p>
    </div>
  );
}

// Declarative `<Routes>`/`<Route>` mounted underneath a data route. The data
// router matches up through `declarative/*`; matching beyond that happens at
// React render time. `useRouterState()` reads from data router state, so even
// inside descendant routes it still reports the full URL, the data router's
// matches (capped at `declarative-shell`), and the data router's navigation
// type.
function DeclarativeShell() {
  return (
    <div>
      <h2>Declarative routes</h2>
      <p>
        These children are rendered via descendant <code>&lt;Routes&gt;</code>{" "}
        — not the data router. The hook still reflects data router state.
      </p>
      <nav style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <NavLink end to="/declarative">
          Index
        </NavLink>
        <NavLink to="/declarative/foo">Foo</NavLink>
        <NavLink to="/declarative/bar/123">Bar 123</NavLink>
      </nav>
      <Routes>
        <Route index element={<DeclarativeChild label="index" />} />
        <Route path="foo" element={<DeclarativeChild label="foo" />} />
        <Route
          path="bar/:barId"
          element={<DeclarativeChild label="bar/:barId" />}
        />
      </Routes>
    </div>
  );
}

function DeclarativeChild({ label }: { label: string }) {
  const state = useRouterState();
  const location = useLocation();
  const declarativeParams = useParams();
  return (
    <div
      style={{
        padding: 8,
        border: "1px solid #ddd",
        borderRadius: 4,
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Declarative child: {label}</h3>
      <p style={{ marginTop: 0 }}>
        <code>useParams()</code> from this declarative route:{" "}
        <code>{JSON.stringify(declarativeParams)}</code>
      </p>
      <RouterStatePanel
        title="useRouterState() — from inside <Routes>"
        state={state}
      />
      <p>{JSON.stringify(location)}</p>
    </div>
  );
}

function ProjectsLayout() {
  const { projects } = useLoaderData() as { projects: typeof PROJECTS };
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <aside>
        <h2>Projects</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <NavLink to={`/projects/${p.id}`}>{p.name}</NavLink>
            </li>
          ))}
        </ul>
      </aside>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

function ProjectsIndex() {
  return <p>Pick a project from the list.</p>;
}

function ProjectDetail() {
  const { project } = useLoaderData() as { project: (typeof PROJECTS)[number] };
  const params = useParams();
  return (
    <div>
      <h2>{project.name}</h2>
      <p>{project.description}</p>
      <p>
        <code>useParams()</code>: <code>{JSON.stringify(params)}</code>
      </p>
      <p>
        <Link to={`/projects/${project.id}/tasks/1`}>Open task 1</Link> ·{" "}
        <Link to={`/projects/${project.id}/tasks/2`}>Open task 2</Link>
      </p>
      <Outlet />
    </div>
  );
}

function TaskDetail() {
  const { task } = useLoaderData() as { task: { id: string; title: string } };
  return (
    <div
      style={{
        marginTop: 12,
        padding: 8,
        borderTop: "1px solid #ddd",
      }}
    >
      <h3>{task.title}</h3>
      <p>Task id: {task.id}</p>
    </div>
  );
}

ReactClient.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
