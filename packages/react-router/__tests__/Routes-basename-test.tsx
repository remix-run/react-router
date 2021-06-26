import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  useParams
} from "react-router";

describe("<Routes> with a basename", () => {
  function User() {
    let { userId } = useParams();
    return (
      <div>
        <h1>User: {userId}</h1>
        <Outlet />
      </div>
    );
  }

  function Dashboard() {
    return <h1>Dashboard</h1>;
  }

  let userRoute = (
    <Route path="users/:userId" element={<User />}>
      <Route path="dashboard" element={<Dashboard />} />
    </Route>
  );

  it("does not match when the URL pathname does not start with that base", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/app/users/michael/dashboard"]}>
        <Routes basename="/base">{userRoute}</Routes>
      </Router>
    );

    expect(renderer.toJSON()).toBeNull();
  });

  it("matches when the URL pathname starts with that base", () => {
    let renderer = createTestRenderer(
      <Router initialEntries={["/app/users/michael/dashboard"]}>
        <Routes basename="/app">{userRoute}</Routes>
      </Router>
    );

    expect(renderer.toJSON()).not.toBeNull();
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <h1>
          User: 
          michael
        </h1>
        <h1>
          Dashboard
        </h1>
      </div>
    `);
  });
});
