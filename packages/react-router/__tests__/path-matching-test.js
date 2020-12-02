import { matchRoutes } from "react-router";

describe("path matching", () => {
  function pickPaths(routes, pathname) {
    let matches = matchRoutes(routes, { pathname });
    return matches ? matches.map(match => match.route.path) : null;
  }

  test("root vs. dynamic", () => {
    let routes = [{ path: "/" }, { path: ":id" }];
    expect(pickPaths(routes, "/")).toEqual(["/"]);
    expect(pickPaths(routes, "/123")).toEqual([":id"]);
  });

  test("precedence of a bunch of routes in a flat route config", () => {
    let routes = [
      { path: "/groups/main/users/me" },
      { path: "/groups/:groupId/users/me" },
      { path: "/groups/:groupId/users/:userId" },
      { path: "/groups/:groupId/users/*" },
      { path: "/groups/main/users" },
      { path: "/groups/:groupId/users" },
      { path: "/groups/main" },
      { path: "/groups/:groupId" },
      { path: "/groups" },
      { path: "/files/*" },
      { path: "/files" },
      { path: "/:one/:two/:three/:four/:five" },
      { path: "/" },
      { path: "*" }
    ];

    expect(pickPaths(routes, "/groups/main/users/me")).toEqual([
      "/groups/main/users/me"
    ]);
    expect(pickPaths(routes, "/groups/other/users/me")).toEqual([
      "/groups/:groupId/users/me"
    ]);
    expect(pickPaths(routes, "/groups/123/users/456")).toEqual([
      "/groups/:groupId/users/:userId"
    ]);
    expect(pickPaths(routes, "/groups/main/users/a/b")).toEqual([
      "/groups/:groupId/users/*"
    ]);
    expect(pickPaths(routes, "/groups/main/users")).toEqual([
      "/groups/main/users"
    ]);
    expect(pickPaths(routes, "/groups/123/users")).toEqual([
      "/groups/:groupId/users"
    ]);
    expect(pickPaths(routes, "/groups/main")).toEqual(["/groups/main"]);
    expect(pickPaths(routes, "/groups/123")).toEqual(["/groups/:groupId"]);
    expect(pickPaths(routes, "/groups")).toEqual(["/groups"]);
    expect(pickPaths(routes, "/files/some/long/path")).toEqual(["/files/*"]);
    expect(pickPaths(routes, "/files")).toEqual(["/files"]);
    expect(pickPaths(routes, "/one/two/three/four/five")).toEqual([
      "/:one/:two/:three/:four/:five"
    ]);
    expect(pickPaths(routes, "/")).toEqual(["/"]);
    expect(pickPaths(routes, "/no/where")).toEqual(["*"]);
  });

  test("precedence of a bunch of routes in a nested route config", () => {
    let routes = [
      {
        path: "courses",
        children: [
          {
            path: ":id",
            children: [{ path: "subjects" }]
          },
          { path: "new" },
          { path: "/" },
          { path: "*" }
        ]
      },
      {
        path: "courses",
        children: [
          { path: "react-fundamentals" },
          { path: "advanced-react" },
          { path: "*" }
        ]
      },
      { path: "/" },
      { path: "*" }
    ];

    expect(pickPaths(routes, "/courses")).toEqual(["courses", "/"]);
    expect(pickPaths(routes, "/courses/routing")).toEqual(["courses", ":id"]);
    expect(pickPaths(routes, "/courses/routing/subjects")).toEqual([
      "courses",
      ":id",
      "subjects"
    ]);
    expect(pickPaths(routes, "/courses/new")).toEqual(["courses", "new"]);
    expect(pickPaths(routes, "/courses/whatever/path")).toEqual([
      "courses",
      "*"
    ]);
    expect(pickPaths(routes, "/courses/react-fundamentals")).toEqual([
      "courses",
      "react-fundamentals"
    ]);
    expect(pickPaths(routes, "/courses/advanced-react")).toEqual([
      "courses",
      "advanced-react"
    ]);
    expect(pickPaths(routes, "/")).toEqual(["/"]);
    expect(pickPaths(routes, "/whatever")).toEqual(["*"]);
  });

  test("nested index route vs sibling static route", () => {
    let routes = [
      {
        path: ":page",
        children: [{ path: "/" }]
      },
      { path: "page" }
    ];

    expect(pickPaths(routes, "/page")).toEqual(["page"]);
  });
});

describe("path matching with a basename", () => {
  let routes = [
    {
      path: "/users/:userId",
      children: [
        {
          path: "subjects",
          children: [
            {
              path: ":courseId"
            }
          ]
        }
      ]
    }
  ];

  test("top-level route", () => {
    let location = { pathname: "/app/users/michael" };
    let matches = matchRoutes(routes, location, "/app");

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(1);
    expect(matches).toMatchObject([
      {
        pathname: "/users/michael",
        params: { userId: "michael" }
      }
    ]);
  });

  test("deeply nested route", () => {
    let location = { pathname: "/app/users/michael/subjects/react" };
    let matches = matchRoutes(routes, location, "/app");

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(3);
    expect(matches).toMatchObject([
      {
        pathname: "/users/michael",
        params: { userId: "michael" }
      },
      {
        pathname: "/users/michael/subjects",
        params: { userId: "michael" }
      },
      {
        pathname: "/users/michael/subjects/react",
        params: { userId: "michael", courseId: "react" }
      }
    ]);
  });
});

describe("path matching with splats", () => {
  test("splat after /", () => {
    let routes = [{ path: "users/:id/files/*" }];
    let match = matchRoutes(routes, "/users/mj/files/secrets.md");

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { id: "mj", "*": "secrets.md" },
      pathname: "/users/mj/files"
    });
  });

  test("splat after something other than /", () => {
    let routes = [{ path: "users/:id/files-*" }];
    let match = matchRoutes(routes, "/users/mj/files-secrets.md");

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      pathname: "/users/mj/files-",
      params: { id: "mj", "*": "secrets.md" }
    });
  });

  test("parent route with splat after /", () => {
    let routes = [
      { path: "users/:id/files/*", children: [{ path: "secrets.md" }] }
    ];
    let match = matchRoutes(routes, "/users/mj/files/secrets.md");

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      pathname: "/users/mj/files",
      params: { id: "mj", "*": "secrets.md" }
    });
    expect(match[1]).toMatchObject({
      pathname: "/users/mj/files/secrets.md",
      params: { id: "mj" }
    });
  });

  test("multiple nested routes", () => {
    let routes = [
      { path: "*", children: [{ path: "*", children: [{ path: "*" }] }] }
    ];
    let match = matchRoutes(routes, "/one/two/three");

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      pathname: "/",
      params: { "*": "/one/two/three" }
    });
    expect(match[1]).toMatchObject({
      pathname: "/",
      params: { "*": "/one/two/three" }
    });
    expect(match[2]).toMatchObject({
      pathname: "/",
      params: { "*": "/one/two/three" }
    });
  });
});
