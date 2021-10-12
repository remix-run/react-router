import * as React from "react";
import { Outlet } from "react-router-dom";

function Layout({ app }) {
  return (
    <div>
      <h1>Welcome to the {app} app!</h1>
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
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

export { Layout };
