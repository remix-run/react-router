import { matchRoutes } from "react-router";

describe("index route matching", () => {
  it("throws when the index route has children", () => {
    expect(() => {
      matchRoutes(
        [
          {
            path: "/users",
            children: [
              // This config is not valid because index routes cannot have children
              // @ts-expect-error
              {
                index: true,
                children: [{ path: "not-valid" }],
              },
              { path: ":id" },
            ],
          },
        ],
        "/users/mj"
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Index routes must not have a path or child routes. Please update the index route at the path \\"/users/\\"."`
    );
  });

  it("throws when the index route has a path", () => {
    expect(() => {
      matchRoutes(
        [
          {
            path: "/users",
            children: [
              // This config is not valid because index routes cannot have paths
              // @ts-expect-error
              {
                index: true,
                path: "not-valid",
              },
              { path: ":id" },
            ],
          },
        ],
        "/users/mj"
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Index routes must not have a path or child routes. Please update the index route at the path \\"/users/not-valid\\"."`
    );
  });
});
