import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import type { RouteObject } from "react-router";
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  useParams,
  useRoutes
} from "react-router";
import type { InitialEntry } from "history";

describe("route matching", () => {
  describe("using a route config object", () => {
    function RoutesRenderer({ routes }: { routes: RouteObject[] }) {
      return useRoutes(routes);
    }

    let routes = [
      {
        path: "courses",
        element: <Courses />,
        children: [
          {
            path: ":id",
            element: <Course />,
            children: [{ path: "grades", element: <CourseGrades /> }]
          },
          { path: "new", element: <NewCourse /> },
          { index: true, element: <CoursesIndex /> },
          { path: "*", element: <CoursesNotFound /> }
        ]
      },
      {
        path: "courses",
        element: <Landing />,
        children: [
          { path: "react-fundamentals", element: <ReactFundamentals /> },
          { path: "advanced-react", element: <AdvancedReact /> },
          { path: "*", element: <NeverRender /> }
        ]
      },
      { path: "/", element: <Home /> },
      { path: "*", element: <NotFound /> }
    ];

    describeRouteMatching(<RoutesRenderer routes={routes} />);
  });

  describe("using <Routes> with <Route> elements", () => {
    let routes = (
      <Routes>
        <Route path="courses" element={<Courses />}>
          <Route path=":id" element={<Course />}>
            <Route path="grades" element={<CourseGrades />} />
          </Route>
          <Route path="new" element={<NewCourse />} />
          <Route index element={<CoursesIndex />} />
          <Route path="*" element={<CoursesNotFound />} />
        </Route>
        <Route path="courses" element={<Landing />}>
          <Route path="react-fundamentals" element={<ReactFundamentals />} />
          <Route path="advanced-react" element={<AdvancedReact />} />
          <Route path="*" element={<NeverRender />} />
        </Route>
        <Route index element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );

    describeRouteMatching(routes);
  });

  function describeRouteMatching(routes: React.ReactNode) {
    let testPaths = [
      "/courses",
      "/courses/routing",
      "/courses/routing/grades",
      "/courses/new",
      "/courses/not/found",
      "/courses/react-fundamentals",
      "/courses/advanced-react",
      "/",
      "/not-found"
    ];

    testPaths.forEach(path => {
      it(`renders the right elements at ${path}`, () => {
        expect(renderRoutes(routes, path)).toMatchSnapshot();
      });
    });
  }

  function renderRoutes(children: React.ReactNode, entry: InitialEntry) {
    let renderer = createTestRenderer(
      <Router initialEntries={[entry]} children={children} />
    );
    return renderer.toJSON();
  }

  function Courses() {
    return (
      <div>
        <h1>Courses</h1>
        <Outlet />
      </div>
    );
  }

  function Course() {
    let { id } = useParams();
    return (
      <div>
        <h2>Course {id}</h2>
        <Outlet />
      </div>
    );
  }

  function CourseGrades() {
    return <p>Course Grades</p>;
  }

  function NewCourse() {
    return <p>New Course</p>;
  }

  function CoursesIndex() {
    return <p>All Courses</p>;
  }

  function CoursesNotFound() {
    return <p>Course Not Found</p>;
  }

  function Landing() {
    return (
      <p>
        <h1>Welcome to React Training</h1>
        <Outlet />
      </p>
    );
  }

  function ReactFundamentals() {
    return <p>React Fundamentals</p>;
  }

  function AdvancedReact() {
    return <p>Advanced React</p>;
  }

  function Home() {
    return <p>Home</p>;
  }

  function NotFound() {
    return <p>Not Found</p>;
  }

  function NeverRender(): React.ReactElement {
    throw new Error("NeverRender should ... uh ... never render");
  }
});
