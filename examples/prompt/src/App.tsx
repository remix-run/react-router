import * as React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Link,
  Prompt
} from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div>
        <h1>Welcome to the app!</h1>

        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
      </div>
    </Router>
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
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
}

function Home() {
  let [isBlocking, setIsBlocking] = React.useState(false);

  return (
    <div>
      <h2>Home</h2>

      <form
        onSubmit={event => {
          event.preventDefault();
          event.currentTarget.reset();
          setIsBlocking(false);
        }}
      >
        <Prompt
          when={isBlocking}
          message={`Are you sure you wantto leave?`}
        />

        <p>
          Blocking?{" "}
          {isBlocking ? "Yes, click a link or the back button" : "Nope"}
        </p>

        <p>
          <input
            size={50}
            placeholder="type something to block transitions"
            onChange={event => {
              setIsBlocking(event.target.value.length > 0);
            }}
          />
        </p>

        <p>
          <button>Submit to stop blocking</button>
        </p>
      </form>
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
