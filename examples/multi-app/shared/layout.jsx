import * as React from "react";
import { Outlet } from "react-router-dom";

function Layout({app}) {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/feed">Feed</a>
          </li>
          <li>
            <a href="/profile">Profile</a>
          </li>
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
};

export { Layout };
