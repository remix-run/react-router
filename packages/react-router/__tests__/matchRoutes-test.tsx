import * as React from "react";
import { Outlet, matchRoutes } from "react-router";

describe("matchRoutes", () => {
  it("returns the same route object on match.route as the one that was passed in", () => {
    let userProfileRoute = { path: ":id", element: <h1>user profile </h1> };
    let usersRoute = {
      path: "/users",
      element: (
        <h1>
          users <Outlet />
        </h1>
      ),
      children: [userProfileRoute]
    };

    let matches = matchRoutes([usersRoute], "/users/mj")!;

    expect(matches).not.toBeNull();
    expect(matches[0].route).toBe(usersRoute);
    expect(matches[1].route).toBe(userProfileRoute);
  });
});
