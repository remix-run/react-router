import * as React from "react";
import { Routes, Route, Outlet, Link } from "react-router-dom";

export default function Dashboard() {
  // These routes are defined when this component is loaded on demand via
  // dynamic import() on the home page!
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardIndex />} />
        <Route path="messages" element={<Messages />} />
      </Route>
    </Routes>
  );
}

function DashboardLayout() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard Home</Link>
          </li>
          <li>
            <Link to="/dashboard/messages">Messages</Link>
          </li>
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
}

function DashboardIndex() {
  return (
    <div>
      <h2>Dashboard Index</h2>
    </div>
  );
}

function Messages() {
  return (
    <div>
      <h2>Messages</h2>
      <ul>
        <li>Message 1</li>
        <li>Message 2</li>
      </ul>
    </div>
  );
}
