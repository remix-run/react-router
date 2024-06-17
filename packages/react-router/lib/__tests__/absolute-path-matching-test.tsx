import type { RouteObject } from "react-router";
import { matchRoutes } from "react-router";

function pickPaths(routes: RouteObject[], pathname: string): string[] | null {
  let matches = matchRoutes(routes, pathname);
  return matches && matches.map((match) => match.route.path || "");
}

describe("absolute path matching", () => {
  it("matches a nested route with an absolute path", () => {
    let routes = [
      {
        path: "/users",
        children: [
          { index: true },
          { path: "add" },
          { path: "remove" },
          { path: "/users/:id" },
        ],
      },
    ];

    expect(pickPaths(routes, "/users")).toEqual(["/users", ""]);
    expect(pickPaths(routes, "/users/add")).toEqual(["/users", "add"]);
    expect(pickPaths(routes, "/users/remove")).toEqual(["/users", "remove"]);
    expect(pickPaths(routes, "/users/123")).toEqual(["/users", "/users/:id"]);
  });

  it("matches a nested splat route with an absolute path", () => {
    let routes = [
      {
        path: "/users",
        children: [{ path: "/users/*" }],
      },
    ];

    expect(pickPaths(routes, "/users")).toEqual(["/users"]);
    expect(pickPaths(routes, "/users/not-found")).toEqual([
      "/users",
      "/users/*",
    ]);
  });

  it("throws when the nested path does not begin with its parent path", () => {
    expect(() => {
      matchRoutes(
        [
          {
            path: "/users",
            children: [
              { path: ":id" },
              // This one should throw because it doesn't begin with /users
              { path: "/not/users" },
            ],
          },
        ],
        "/users/123"
      );
    }).toThrow("absolute child route path must start");
  });
});
