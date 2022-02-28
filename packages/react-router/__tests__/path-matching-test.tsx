import type { RouteObject } from "react-router";
import { matchRoutes } from "react-router";

function pickPaths(routes: RouteObject[], pathname: string): string[] | null {
  let matches = matchRoutes(routes, pathname);
  return matches && matches.map((match) => match.route.path || "");
}

describe("path matching", () => {
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
      { path: "*" },
    ];

    expect(pickPaths(routes, "/groups/main/users/me")).toEqual([
      "/groups/main/users/me",
    ]);
    expect(pickPaths(routes, "/groups/other/users/me")).toEqual([
      "/groups/:groupId/users/me",
    ]);
    expect(pickPaths(routes, "/groups/123/users/456")).toEqual([
      "/groups/:groupId/users/:userId",
    ]);
    expect(pickPaths(routes, "/groups/main/users/a/b")).toEqual([
      "/groups/:groupId/users/*",
    ]);
    expect(pickPaths(routes, "/groups/main/users")).toEqual([
      "/groups/main/users",
    ]);
    expect(pickPaths(routes, "/groups/123/users")).toEqual([
      "/groups/:groupId/users",
    ]);
    expect(pickPaths(routes, "/groups/main")).toEqual(["/groups/main"]);
    expect(pickPaths(routes, "/groups/123")).toEqual(["/groups/:groupId"]);
    expect(pickPaths(routes, "/groups")).toEqual(["/groups"]);
    expect(pickPaths(routes, "/files/some/long/path")).toEqual(["/files/*"]);
    expect(pickPaths(routes, "/files")).toEqual(["/files"]);
    expect(pickPaths(routes, "/one/two/three/four/five")).toEqual([
      "/:one/:two/:three/:four/:five",
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
            children: [{ path: "subjects" }],
          },
          { path: "new" },
          { index: true },
          { path: "*" },
        ],
      },
      {
        path: "courses",
        children: [{ path: "react-fundamentals" }, { path: "advanced-react" }],
      },
      { path: "/" },
      { path: "*" },
    ];

    expect(pickPaths(routes, "/courses")).toEqual(["courses", ""]);
    expect(pickPaths(routes, "/courses/routing")).toEqual(["courses", ":id"]);
    expect(pickPaths(routes, "/courses/routing/subjects")).toEqual([
      "courses",
      ":id",
      "subjects",
    ]);
    expect(pickPaths(routes, "/courses/new")).toEqual(["courses", "new"]);
    expect(pickPaths(routes, "/courses/whatever/path")).toEqual([
      "courses",
      "*",
    ]);
    expect(pickPaths(routes, "/courses/react-fundamentals")).toEqual([
      "courses",
      "react-fundamentals",
    ]);
    expect(pickPaths(routes, "/courses/advanced-react")).toEqual([
      "courses",
      "advanced-react",
    ]);
    expect(pickPaths(routes, "/")).toEqual(["/"]);
    expect(pickPaths(routes, "/whatever")).toEqual(["*"]);
  });

  test("nested index route vs sibling static route", () => {
    let routes = [
      {
        path: ":page",
        children: [{ index: true }],
      },
      { path: "page" },
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
              path: ":courseId",
            },
          ],
        },
      ],
    },
  ];

  test("top-level route", () => {
    let location = { pathname: "/users/michael" };
    let matches = matchRoutes(routes, location);

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(1);
    expect(matches).toMatchObject([
      {
        params: { userId: "michael" },
        pathname: "/users/michael",
        pathnameBase: "/users/michael",
      },
    ]);
  });

  test("deeply nested route", () => {
    let location = { pathname: "/users/michael/subjects/react" };
    let matches = matchRoutes(routes, location);

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(3);
    expect(matches).toMatchObject([
      {
        params: { userId: "michael", courseId: "react" },
        pathname: "/users/michael",
        pathnameBase: "/users/michael",
      },
      {
        params: { userId: "michael", courseId: "react" },
        pathname: "/users/michael/subjects",
        pathnameBase: "/users/michael/subjects",
      },
      {
        params: { userId: "michael", courseId: "react" },
        pathname: "/users/michael/subjects/react",
        pathnameBase: "/users/michael/subjects/react",
      },
    ]);
  });
});

describe("path matching with splats", () => {
  describe("splat after /", () => {
    let routes = [{ path: "users/:id/files/*" }];

    it("finds the correct match", () => {
      let match = matchRoutes(routes, "/users/mj/files/secrets.txt")!;

      expect(match).not.toBeNull();
      expect(match[0]).toMatchObject({
        params: { id: "mj", "*": "secrets.txt" },
        pathname: "/users/mj/files/secrets.txt",
        pathnameBase: "/users/mj/files",
      });
    });

    describe("when other characters come before the /", () => {
      it("does not find a match", () => {
        let match = matchRoutes(routes, "/users/mj/filesssss/secrets.txt");
        expect(match).toBeNull();
      });
    });
  });

  test("parent route with splat", () => {
    let routes = [
      { path: "users/:id/files/*", children: [{ path: "secrets.txt" }] },
    ];
    let match = matchRoutes(routes, "/users/mj/files/secrets.txt")!;

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { id: "mj", "*": "secrets.txt" },
      pathname: "/users/mj/files/secrets.txt",
      pathnameBase: "/users/mj/files",
    });
    expect(match[1]).toMatchObject({
      params: { id: "mj", "*": "secrets.txt" },
      pathname: "/users/mj/files/secrets.txt",
    });
  });

  test("multiple nested routes", () => {
    let routes = [
      { path: "*", children: [{ path: "*", children: [{ path: "*" }] }] },
    ];
    let match = matchRoutes(routes, "/one/two/three")!;

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { "*": "one/two/three" },
      pathname: "/one/two/three",
      pathnameBase: "/",
    });
    expect(match[1]).toMatchObject({
      params: { "*": "one/two/three" },
      pathname: "/one/two/three",
      pathnameBase: "/",
    });
    expect(match[2]).toMatchObject({
      params: { "*": "one/two/three" },
      pathname: "/one/two/three",
      pathnameBase: "/",
    });
  });

  test("nested routes with partial matching", () => {
    let routes = [
      { path: "/", children: [{ path: "courses", children: [{ path: "*" }] }] },
    ];
    let match = matchRoutes(routes, "/courses/abc");

    expect(match).not.toBeNull();
    expect(match).toHaveLength(3);
    expect(match[0]).toMatchObject({
      params: { "*": "abc" },
      pathname: "/",
      pathnameBase: "/",
    });
    expect(match[1]).toMatchObject({
      params: { "*": "abc" },
      pathname: "/courses",
      pathnameBase: "/courses",
    });
    expect(match[2]).toMatchObject({
      params: { "*": "abc" },
      pathname: "/courses/abc",
      pathnameBase: "/courses",
    });
  });
});
