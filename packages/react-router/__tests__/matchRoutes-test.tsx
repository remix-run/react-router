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

  it("matches routes with special characters", () => {
    // Ensure we can use special characters in any number of ways:
    //   As a static route: /✅
    //   As a static child of root layout route: /✅
    //   As a static child of a static layout route: /static/✅
    //   As a static child of a param layout route: /:param/✅
    //   As a root splat route: /*
    //   As a root param route: /:param
    //   As a child splat route: /splat/*
    //   As a child param route: /dynamic/:param/

    let getStaticRoutes = (char) => [{ path: char }];
    let getNestedStaticRoutes = (char) => [
      {
        path: "/",
        children: [{ path: char }],
      },
      {
        path: "/static",
        children: [{ path: char }],
      },
      {
        path: "/:param",
        children: [{ path: char }],
      },
    ];
    let rootSplatRoutes = [
      {
        index: true,
      },
      {
        path: "*",
      },
    ];
    let rootParamRoute = [
      {
        index: true,
      },
      {
        path: ":param",
      },
    ];
    let nestedRoutes = [
      {
        index: true,
      },
      {
        path: "dynamic",
        children: [
          {
            path: ":param",
          },
        ],
      },
      {
        path: "splat",
        children: [
          {
            path: "*",
          },
        ],
      },
    ];

    let specialChars = [
      // Include non-special characters here to ensure the behavior is the same
      "x",
      "X",
      "!",
      "@",
      "$",
      "^",
      "&",
      "*",
      "(",
      ")",
      "_",
      "+",
      "-",
      "=",
      "~",
      "{",
      "}",
      "[",
      "]",
      "|",
      "<",
      ">",
      ".",
      ",",
      ":",
      ";",
      "🤯",
      "✅",
      "🔥",
      "ä",
      "Ä",
      "ø",
      "山",
      "人",
      "口",
      "刀",
      "木",
    ];

    specialChars.forEach((char) => {
      expect(matchRoutes(rootSplatRoutes, `/${char}`)).toEqual([
        {
          params: {
            "*": char,
          },
          pathname: `/${char}`,
          pathnameBase: "/",
          route: expect.objectContaining({
            path: "*",
          }),
        },
      ]);
      expect(matchRoutes(rootParamRoute, `/${char}`)).toEqual([
        {
          params: {
            param: char,
          },
          pathname: `/${char}`,
          pathnameBase: `/${char}`,
          route: expect.objectContaining({
            path: ":param",
          }),
        },
      ]);
      expect(matchRoutes(nestedRoutes, `/dynamic/${char}`)).toEqual([
        {
          params: {
            param: char,
          },
          pathname: "/dynamic",
          pathnameBase: "/dynamic",
          route: expect.objectContaining({
            path: "dynamic",
          }),
        },
        {
          params: {
            param: char,
          },
          pathname: `/dynamic/${char}`,
          pathnameBase: `/dynamic/${char}`,
          route: {
            path: ":param",
          },
        },
      ]);
      expect(matchRoutes(nestedRoutes, `/splat/${char}`)).toEqual([
        {
          params: {
            "*": char,
          },
          pathname: "/splat",
          pathnameBase: "/splat",
          route: expect.objectContaining({
            path: "splat",
          }),
        },
        {
          params: {
            "*": char,
          },
          pathname: `/splat/${char}`,
          pathnameBase: `/splat`,
          route: {
            path: "*",
          },
        },
      ]);

      // This just becomes a splat/param route - skip it for static routes :)
      if (char === "*" || char === ":") {
        return;
      }

      expect(matchRoutes(getStaticRoutes(char), `/${char}`)).toEqual([
        {
          params: {},
          pathname: `/${char}`,
          pathnameBase: `/${char}`,
          route: expect.objectContaining({
            path: char,
          }),
        },
      ]);

      expect(matchRoutes(getNestedStaticRoutes(char), `/${char}`)).toEqual([
        {
          params: {},
          pathname: `/`,
          pathnameBase: `/`,
          route: expect.objectContaining({
            path: "/",
          }),
        },
        {
          params: {},
          pathname: `/${char}`,
          pathnameBase: `/${char}`,
          route: expect.objectContaining({
            path: char,
          }),
        },
      ]);
      expect(
        matchRoutes(getNestedStaticRoutes(char), `/static/${char}`)
      ).toEqual([
        {
          params: {},
          pathname: `/static`,
          pathnameBase: `/static`,
          route: expect.objectContaining({
            path: "/static",
          }),
        },
        {
          params: {},
          pathname: `/static/${char}`,
          pathnameBase: `/static/${char}`,
          route: expect.objectContaining({
            path: char,
          }),
        },
      ]);
      expect(matchRoutes(getNestedStaticRoutes(char), `/foo/${char}`)).toEqual([
        {
          params: {
            param: "foo",
          },
          pathname: `/foo`,
          pathnameBase: `/foo`,
          route: expect.objectContaining({
            path: "/:param",
          }),
        },
        {
          params: {
            param: "foo",
          },
          pathname: `/foo/${char}`,
          pathnameBase: `/foo/${char}`,
          route: expect.objectContaining({
            path: char,
          }),
        },
      ]);
    });
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
