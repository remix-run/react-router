import * as React from "react";
import {
  BrowserRouter as Router,
  Outlet,
  Link,
  useRoutes,
  RouteObject
} from "react-router-dom";

let routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "*", element: <NoMatch /> }
    ]
  }
];

export default function MyApp() {
  return (
    <Router>
      <div>
        <h1>Welcome to the app!</h1>
        <App />
      </div>
    </Router>
  );
}

function App() {
  let element = useRoutes(routes);
  return element;
}

function Layout() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/nothing-here">Nothing Here</Link>
          </li>
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
