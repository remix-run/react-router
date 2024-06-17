import * as React from "react";
import type { RouteObject } from "react-router";
import { matchRoutes } from "react-router";

function pickPaths(
  routes: RouteObject[],
  pathname: string,
  basename?: string
): string[] | null {
  let matches = matchRoutes(routes, pathname, basename);
  return matches && matches.map((match) => match.route.path || "");
}

describe("matchRoutes", () => {
  let userEditRoute: RouteObject = {
    path: "edit",
    element: <h1>User Edit</h1>,
  };
  let userProfileRoute: RouteObject = {
    path: ":id",
    element: <h1>User Profile</h1>,
    children: [userEditRoute],
  };
  let usersRoute: RouteObject = {
    path: "/users",
    element: <h1>Users</h1>,
    children: [{ index: true, element: <h1>Index</h1> }, userProfileRoute],
  };
  let indexWithPathRoute: RouteObject = {
    path: "/withpath",
    index: true,
  };
  let layoutRouteIndex: RouteObject = {
    path: "/layout",
    index: true,
    element: <h1>Layout</h1>,
  };
  let layoutRoute: RouteObject = {
    path: "/layout",
    children: [
      { path: "item", element: <h1>Item</h1> },
      { path: ":id", element: <h1>ID</h1> },
      { path: "*", element: <h1>Not Found</h1> },
    ],
  };
  let routes: RouteObject[] = [
    { path: "/", element: <h1>Root Layout</h1> },
    {
      path: "/home",
      element: <h1>Home</h1>,
      children: [
        { index: true, element: <h1>Index</h1> },
        { path: "*", element: <h1>Not Found</h1> },
      ],
    },
    indexWithPathRoute,
    layoutRoute,
    layoutRouteIndex,
    usersRoute,
    { path: "*", element: <h1>Not Found</h1> },
  ];

  it("matches root * routes correctly", () => {
    expect(pickPaths(routes, "/not-found")).toEqual(["*"]);
    expect(pickPaths(routes, "/hometypo")).toEqual(["*"]);
  });

  it("matches index routes with path correctly", () => {
    expect(pickPaths(routes, "/withpath")).toEqual(["/withpath"]);
  });

  it("matches index routes with path over layout", () => {
    expect(matchRoutes(routes, "/layout")?.[0].route.index).toBe(true);
    expect(pickPaths(routes, "/layout")).toEqual(["/layout"]);
  });

  it("matches static path over index", () => {
    expect(pickPaths(routes, "/layout/item")).toEqual(["/layout", "item"]);
  });

  it("matches dynamic layout path with param over index", () => {
    expect(pickPaths(routes, "/layout/id")).toEqual(["/layout", ":id"]);
  });

  it("matches dynamic layout path with splat over index", () => {
    expect(pickPaths(routes, "/layout/id/more")).toEqual(["/layout", "*"]);
  });

  it("matches nested index routes correctly", () => {
    expect(pickPaths(routes, "/users")).toEqual(["/users", ""]);
  });

  it("matches nested dynamic routes correctly", () => {
    expect(pickPaths(routes, "/users/mj")).toEqual(["/users", ":id"]);
    expect(pickPaths(routes, "/users/mj/edit")).toEqual([
      "/users",
      ":id",
      "edit",
    ]);
  });

  it("matches nested dynamic routes with params ending in = (e.x. base64 encoded Id)", () => {
    expect(pickPaths(routes, "/users/VXNlcnM6MQ==")).toEqual(["/users", ":id"]);
    expect(pickPaths(routes, "/users/VXNlcnM6MQ==/edit")).toEqual([
      "/users",
      ":id",
      "edit",
    ]);
  });

  it("matches nested * routes correctly", () => {
    expect(pickPaths(routes, "/home/typo")).toEqual(["/home", "*"]);
  });

  it("returns the same route object on match.route as the one that was passed in", () => {
    let matches = matchRoutes(routes, "/users/mj")!;
    expect(matches[0].route).toBe(usersRoute);
    expect(matches[1].route).toBe(userProfileRoute);
  });

  describe("with a basename", () => {
    it("matches a pathname that starts with the basename", () => {
      expect(pickPaths(routes, "/app/users/mj", "/app")).toEqual([
        "/users",
        ":id",
      ]);

      // basename should not be case-sensitive
      expect(pickPaths(routes, "/APP/users/mj", "/app")).toEqual([
        "/users",
        ":id",
      ]);
    });

    it("does not match a pathname that does not start with the basename", () => {
      expect(pickPaths(routes, "/home", "/app")).toBeNull();
    });

    it("does not match a pathname that does not start with basename/", () => {
      expect(pickPaths(routes, "/appextra/home", "/app")).toBeNull();
    });
  });
});
