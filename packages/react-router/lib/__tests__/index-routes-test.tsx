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
      `"Index routes must not have child routes. Please remove all child routes from route path "/users/"."`
    );
  });
});
