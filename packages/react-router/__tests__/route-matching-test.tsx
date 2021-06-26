import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  useParams,
  useRoutes
} from "react-router";

describe("route matching", () => {
  describe("using a route config object", () => {
    function RoutesRenderer({ routes }) {
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
          { path: "/", element: <CoursesIndex /> },
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
          <Route path="/" element={<CoursesIndex />} />
          <Route path="*" element={<CoursesNotFound />} />
        </Route>
        <Route path="courses" element={<Landing />}>
          <Route path="react-fundamentals" element={<ReactFundamentals />} />
          <Route path="advanced-react" element={<AdvancedReact />} />
          <Route path="*" element={<NeverRender />} />
        </Route>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );

    describeRouteMatching(routes);
  });

  describe("using <Routes> and the *secret menu*", () => {
    let routes = (
      <Routes>
        <Courses path="courses">
          <Course path=":id">
            <CourseGrades path="grades" />
          </Course>
          <NewCourse path="new" />
          <CoursesIndex path="/" />
          <CoursesNotFound path="*" />
        </Courses>
        <Landing path="courses">
          <ReactFundamentals path="react-fundamentals" />
          <AdvancedReact path="advanced-react" />
          <NeverRender path="*" />
        </Landing>
        <Home path="/" />
        <NotFound path="*" />
      </Routes>
    );

    describeRouteMatching(routes);
  });

  function describeRouteMatching(routes) {
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

  function renderRoutes(children, entry) {
    let renderer = createTestRenderer(
      <Router initialEntries={[entry]} children={children} />
    );

    return renderer.toJSON();
  }

  function Courses(props: Props) {
    return (
      <div>
        <h1>Courses</h1>
        <Outlet />
      </div>
    );
  }

  function Course(props: Props) {
    let { id } = useParams();

    return (
      <div>
        <h2>Course {id}</h2>
        <Outlet />
      </div>
    );
  }

  function CourseGrades(props: Props) {
    return <p>Course Grades</p>;
  }

  function NewCourse(props: Props) {
    return <p>New Course</p>;
  }

  function CoursesIndex(props: Props) {
    return <p>All Courses</p>;
  }

  function CoursesNotFound(props: Props) {
    return <p>Course Not Found</p>;
  }

  function Landing(props: Props) {
    return (
      <p>
        <h1>Welcome to React Training</h1>
        <Outlet />
      </p>
    );
  }

  function ReactFundamentals(props: Props) {
    return <p>React Fundamentals</p>;
  }

  function AdvancedReact(props: Props) {
    return <p>Advanced React</p>;
  }

  function Home(props: Props) {
    return <p>Home</p>;
  }

  function NotFound(props: Props) {
    return <p>Not Found</p>;
  }

  function NeverRender(props: Props): React.ReactElement {
    throw new Error("NeverRender should ... uh ... never render");
  }
});

interface Props {
  children?: React.ReactNode;
  path?: string;
}
