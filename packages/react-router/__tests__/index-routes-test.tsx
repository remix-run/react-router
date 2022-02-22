import { matchRoutes } from "react-router";

describe("index route matching", () => {
  it("throws when the index route has children", () => {
    expect(() => {
      matchRoutes(
        [
          {
            path: "/users",
            children: [
              {
                index: true,
                // This config is not valid because index routes cannot have children
                children: [{ path: "not-valid" }],
              },
              { path: ":id" },
            ],
          },
        ],
        "/users/mj"
      );
    }).toThrow("must not have child routes");
  });
});
