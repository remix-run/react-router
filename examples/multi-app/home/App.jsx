import { Routes, Route, Outlet, Link } from "react-router-dom";
import "./index.css";

export default function HomeApp() {
  return (
    <Routes>
      <Route path="/" element={<Layout app="Home" />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}

function Layout({ app }) {
  return (
    <div>
      <h1>Welcome to the {app} app!</h1>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
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
      <p>
        This example demonstrates how you can stitch two React Router apps
        together using the <code>`basename`</code> prop on{" "}
        <code>`BrowserRouter`</code> and <code>`StaticRouter`</code>.
      </p>
    </div>
  );
}
