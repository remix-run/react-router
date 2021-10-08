import * as React from "react";
import type { RouteObject } from "react-router-dom";
import { Outlet, Link, useRoutes, useParams } from "react-router-dom";

export default function App() {
  let routes: RouteObject[] = [
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        {
          path: "/courses",
          element: <Courses />,
          children: [
            { index: true, element: <CoursesIndex /> },
            { path: "/courses/:id", element: <Course /> }
          ]
        },
        { path: "*", element: <NoMatch /> }
      ]
    }
  ];

  // The useRoutes() hook allows you to define your routes as JavaScript objects
  // instead of <Routes> and <Route> elements. This is really just a style
  // preference for those who prefer to not use JSX for their routes config.
  let element = useRoutes(routes);

  return (
    <div>
      <h1>Welcome to the app!</h1>
      {element}
    </div>
  );
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
            <Link to="/courses">Courses</Link>
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

function Courses() {
  return (
    <div>
      <h2>Courses</h2>
      <Outlet />
    </div>
  );
}

function CoursesIndex() {
  return (
    <div>
      <p>Please choose a course:</p>

      <nav>
        <ul>
          <li>
            <Link to="react-fundamentals">React Fundamentals</Link>
          </li>
          <li>
            <Link to="advanced-react">Advanced React</Link>
          </li>
          <li>
            <Link to="react-router">React Router</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function Course() {
  let { id } = useParams<"id">();

  return (
    <div>
      <h2>
        Welcome to the {id!.split("-").map(capitalizeString).join(" ")} course!
      </h2>

      <p>This is a great course. You're gonna love it!</p>

      <Link to="/courses">See all courses</Link>
    </div>
  );
}

function capitalizeString(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function NoMatch() {
  return (
    <div>
      <h2>It looks like you're lost...</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
