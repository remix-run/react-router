import { Routes, Route, Outlet, Link } from "react-router-dom";
import { NoMatch } from "../inbox/no-match";
import "./index.css";

export default function HomeApp() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NoMatch />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div>
      <h1>Welcome to the Home app!</h1>

      <p>
        This example demonstrates how you can stitch two React Router apps
        together using the <code>`basename`</code> prop on{" "}
        <code>`BrowserRouter`</code> and <code>`StaticRouter`</code>.
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            {/* Use a normal <a> when linking to the "Inbox" app so the browser
                does a full document reload, which is what we want when exiting
                this app and entering another so we execute its entry point in
                inbox/main.jsx. */}
            <a href="/inbox">Inbox</a>
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
      <p>This is the home page.</p>
    </div>
  );
}

function About() {
  return (
    <div>
      <p>This is the about page.</p>
    </div>
  );
}
