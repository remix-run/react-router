import { Outlet } from "react-router-dom";
import { navigateWithoutReactContext } from "./utils";

const handleNavigate = (path: string) => navigateWithoutReactContext(path);

export function Layout() {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
      <nav>
        <ul>
          <li onClick={() => handleNavigate("/")}>Home</li>
          <li onClick={() => handleNavigate("/about")}>About</li>
          <li onClick={() => handleNavigate("/dashboard")}>Dashboard</li>
          <li onClick={() => handleNavigate("/nothing-here")}>Nothing Here</li>
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

export function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

export function About() {
  return (
    <div>
      <h2>About</h2>
    </div>
  );
}

export function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
    </div>
  );
}

export function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p onClick={() => handleNavigate("/")}>Go to the home page</p>
    </div>
  );
}
