import { Routes, Route, Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Server Rendering Example</h1>

      <p>
        If you check out the HTML source of this page, you'll notice that it
        already contains the HTML markup of the app that was sent from the
        server!
      </p>

      <p>
        This is great for search engines that need to index this page. It's also
        great for users because server-rendered pages tend to load more quickly
        on mobile devices and over slow networks.
      </p>

      <p>
        Another thing to notice is that when you click one of the links below
        and navigate to a different URL, then hit the refresh button on your
        browser, the server is able to generate the HTML markup for that page as
        well because you're using React Router on the server. This creates a
        seamless experience both for your users navigating around your site and
        for developers on your team who get to use the same routing library in
        both places.
      </p>

      {/* Routes nest inside one another. Nested route paths build upon
            parent route paths, and nested route elements render inside
            parent route elements. See the note about <Outlet> below. */}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
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
