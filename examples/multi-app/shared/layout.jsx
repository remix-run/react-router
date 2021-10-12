import * as React from "react";
import { Outlet, Link } from "react-router-dom";

function Layout({ app }) {
  return (
    <div>
      <h1>Welcome to the {app} app!</h1>
      <nav>
        <ul>
          <li>
            {app === "Home" ? <Link to="/">Home</Link> : <a href="/">Home</a>}
          </li>
          <li>
            {app === "Inbox" ? (
              <Link to="/">Inbox</Link>
            ) : (
              <a href="/inbox">Inbox</a>
            )}
          </li>
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
}

export { Layout };
