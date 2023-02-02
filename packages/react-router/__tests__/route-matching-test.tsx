import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import type { RouteObject } from "react-router";
import {
  MemoryRouter,
  Outlet,
  Routes,
  Route,
  useParams,
  useRoutes,
} from "react-router";

describe("route matching", () => {
  function describeRouteMatching(
    routes: React.ReactNode,
    testPaths?: string[]
  ) {
    let defaultTestPaths = [
      "/courses",
      "/courses/routing",
      "/courses/routing/grades",
      "/courses/new",
      "/courses/not/found",
      "/courses/react-fundamentals",
      "/courses/advanced-react",
      "/",
      "/not-found",
    ];

    (testPaths || defaultTestPaths).forEach((path) => {
      it(`renders the right elements at ${path}`, () => {
        let renderer: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
          renderer = TestRenderer.create(
            <MemoryRouter initialEntries={[path]} children={routes} />
          );
        });

        expect(renderer.toJSON()).toMatchSnapshot();
      });
    });
  }

  describe("using a route config object", () => {
    let routes = [
      {
        path: "courses",
        element: <Courses />,
        children: [
          { index: true, element: <CoursesIndex /> },
          {
            path: ":id",
            element: <Course />,
            children: [{ path: "grades", element: <CourseGrades /> }],
          },
          { path: "new", element: <NewCourse /> },
          { path: "*", element: <CoursesNotFound /> },
        ],
      },
      {
        path: "courses",
        element: <Landing />,
        children: [
          { path: "react-fundamentals", element: <ReactFundamentals /> },
          { path: "advanced-react", element: <AdvancedReact /> },
          { path: "*", element: <NeverRender /> },
        ],
      },
      { index: true, element: <Home /> },
      { path: "*", element: <NotFound /> },
    ];

    function RoutesRenderer({ routes }: { routes: RouteObject[] }) {
      return useRoutes(routes);
    }

    describeRouteMatching(<RoutesRenderer routes={routes} />);
  });

  describe("using <Routes> with <Route> elements", () => {
    let routes = (
      <Routes>
        <Route path="courses" element={<Courses />}>
          <Route index element={<CoursesIndex />} />
          <Route path=":id" element={<Course />}>
            <Route path="grades" element={<CourseGrades />} />
          </Route>
          <Route path="new" element={<NewCourse />} />
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

  describe("using nested <Routes> with <Route> elements", () => {
    let routes = (
      <Routes>
        <Route path="*" element={<SplatRoute />} />
      </Routes>
    );

    const testPaths = [
      encodeURI("/route with space"),
      encodeURI("/route with space/nested"),
    ];

    describeRouteMatching(routes, testPaths);
  });

  function SplatRoute() {
    return (
      <div>
        <h1>Splat route</h1>
        <Routes>
          <Route path="/route with space/*" element={<RouteWithSpace />} />
        </Routes>
      </div>
    );
  }

  function RouteWithSpace() {
    return (
      <div>
        <h1>Route with space</h1>
        <Routes>
          <Route path="nested" element={<NestedRouteWithSpace />} />
        </Routes>
      </div>
    );
  }

  function NestedRouteWithSpace() {
    return <p>Nested route with space</p>;
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
