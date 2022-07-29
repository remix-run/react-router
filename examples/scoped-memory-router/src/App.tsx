import * as React from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  createScopedMemoryRouterEnvironment,
} from "react-router-dom";

const {
  MemoryRouter: ScopedMemoryRouter,
  Routes: ScopedRoutes,
  Route: ScopedRoute,
  useNavigate: useScopedNavigate,
  Link: ScopedLink,
} = createScopedMemoryRouterEnvironment();

export default function App() {
  return (
    <div>
      <h1>Scoped Memory Router Example</h1>

      <p>
        This example demonstrates using{" "}
        <code>createScopedMemoryRouterEnvironment</code> to have nested
        MemoryRouters. It leverages this feature to create a Modal routing
        system inside of a BrowserRouter
      </p>

      {/* Routes nest inside one another. Nested route paths build upon
            parent route paths, and nested route elements render inside
            parent route elements. See the note about <Outlet> below. */}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="modals" element={<ModalRouter />} />

          {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
}

function ModalRouter() {
  return (
    <ScopedMemoryRouter initialEntries={["/"]}>
      <ScopedRoutes>
        <ScopedRoute path="/" element={<FirstModal />} />
        <ScopedRoute path="second" element={<SecondModal />} />
        <ScopedRoute path="third" element={<ThirdModal />} />
      </ScopedRoutes>
    </ScopedMemoryRouter>
  );
}

function Layout() {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
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
          <li>
            <Link to="/modals">Scoped Memory Router Modals</Link>
          </li>
        </ul>
      </nav>

      <hr />

      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
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

function FirstModal() {
  return (
    <div className="baseModal">
      <div className="modalContents">
        <h1>First Modal</h1>
        <ScopedLink to="/second">Go to second modal</ScopedLink>
        <Link to="/">Go home</Link>
      </div>
    </div>
  );
}

function SecondModal() {
  const navigate = useScopedNavigate();
  return (
    <div className="baseModal">
      <div className="modalContents">
        <h1>Second Modal</h1>
        <ScopedLink to="/third">Go to third modal</ScopedLink>
        <button onClick={() => navigate(-1)}>Go back</button>
        <Link to="/">Go home</Link>
      </div>
    </div>
  );
}

function ThirdModal() {
  const navigate = useScopedNavigate();
  return (
    <div className="baseModal">
      <div className="modalContents">
        <h1>Third Modal</h1>
        <button onClick={() => navigate(-1)}>Go back</button>
        <Link to="/">Go home</Link>
      </div>
    </div>
  );
}
