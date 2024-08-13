import { routes, route, layout, index } from "../config/routes";

describe("routes config", () => {
  it("returns an array of routes", () => {
    let config = routes([
      { path: "/", file: "routes/home.js" },
      {
        path: "inbox",
        file: "routes/inbox.js",
        children: [
          { path: "/", file: "routes/inbox/index.js", index: true },
          { path: ":messageId", file: "routes/inbox/$messageId.js" },
          { path: "archive", file: "routes/inbox/archive.js" },
        ],
      },
    ]);

    expect(config.routes).toMatchInlineSnapshot(`
      {
        "routes/home": {
          "caseSensitive": undefined,
          "file": "routes/home.js",
          "id": "routes/home",
          "index": undefined,
          "parentId": "root",
          "path": "/",
        },
        "routes/inbox": {
          "caseSensitive": undefined,
          "file": "routes/inbox.js",
          "id": "routes/inbox",
          "index": undefined,
          "parentId": "root",
          "path": "inbox",
        },
        "routes/inbox/$messageId": {
          "caseSensitive": undefined,
          "file": "routes/inbox/$messageId.js",
          "id": "routes/inbox/$messageId",
          "index": undefined,
          "parentId": "routes/inbox",
          "path": ":messageId",
        },
        "routes/inbox/archive": {
          "caseSensitive": undefined,
          "file": "routes/inbox/archive.js",
          "id": "routes/inbox/archive",
          "index": undefined,
          "parentId": "routes/inbox",
          "path": "archive",
        },
        "routes/inbox/index": {
          "caseSensitive": undefined,
          "file": "routes/inbox/index.js",
          "id": "routes/inbox/index",
          "index": true,
          "parentId": "routes/inbox",
          "path": "/",
        },
      }
    `);
  });

  it("returns an array of routes using helpers", () => {
    let config = routes([
      route("/", "routes/home.js"),
      layout("routes/authenticated.js", [
        route("inbox", "routes/inbox.js", [
          index("routes/inbox/index.js"),
          route(":messageId", "routes/inbox/$messageId.js"),
        ]),
        route("outbox", "routes/outbox.js", [
          index("routes/outbox/index.js"),
          route(":messageId", "routes/outbox/$messageId.js"),
        ]),
      ]),
    ]);

    expect(config.routes).toMatchInlineSnapshot(`
      {
        "routes/authenticated": {
          "caseSensitive": undefined,
          "file": "routes/authenticated.js",
          "id": "routes/authenticated",
          "index": undefined,
          "parentId": "root",
          "path": undefined,
        },
        "routes/home": {
          "caseSensitive": undefined,
          "file": "routes/home.js",
          "id": "routes/home",
          "index": undefined,
          "parentId": "root",
          "path": "/",
        },
        "routes/inbox": {
          "caseSensitive": undefined,
          "file": "routes/inbox.js",
          "id": "routes/inbox",
          "index": undefined,
          "parentId": "routes/authenticated",
          "path": "inbox",
        },
        "routes/inbox/$messageId": {
          "caseSensitive": undefined,
          "file": "routes/inbox/$messageId.js",
          "id": "routes/inbox/$messageId",
          "index": undefined,
          "parentId": "routes/inbox",
          "path": ":messageId",
        },
        "routes/inbox/index": {
          "caseSensitive": undefined,
          "file": "routes/inbox/index.js",
          "id": "routes/inbox/index",
          "index": true,
          "parentId": "routes/inbox",
          "path": undefined,
        },
        "routes/outbox": {
          "caseSensitive": undefined,
          "file": "routes/outbox.js",
          "id": "routes/outbox",
          "index": undefined,
          "parentId": "routes/authenticated",
          "path": "outbox",
        },
        "routes/outbox/$messageId": {
          "caseSensitive": undefined,
          "file": "routes/outbox/$messageId.js",
          "id": "routes/outbox/$messageId",
          "index": undefined,
          "parentId": "routes/outbox",
          "path": ":messageId",
        },
        "routes/outbox/index": {
          "caseSensitive": undefined,
          "file": "routes/outbox/index.js",
          "id": "routes/outbox/index",
          "index": true,
          "parentId": "routes/outbox",
          "path": undefined,
        },
      }
    `);
  });

  it("allows multiple routes with the same route module", () => {
    let config = routes([
      route("/user/:id", "routes/_index.tsx", { id: "user-by-id" }),
      route("/user", "routes/_index.tsx", { id: "user" }),
      route("/other", "routes/other-route.tsx"),
    ]);

    expect(config.routes).toMatchInlineSnapshot(`
      {
        "routes/other-route": {
          "caseSensitive": undefined,
          "file": "routes/other-route.tsx",
          "id": "routes/other-route",
          "index": undefined,
          "parentId": "root",
          "path": "/other",
        },
        "user": {
          "caseSensitive": undefined,
          "file": "routes/_index.tsx",
          "id": "user",
          "index": undefined,
          "parentId": "root",
          "path": "/user",
        },
        "user-by-id": {
          "caseSensitive": undefined,
          "file": "routes/_index.tsx",
          "id": "user-by-id",
          "index": undefined,
          "parentId": "root",
          "path": "/user/:id",
        },
      }
    `);
  });

  it("throws an error on route id collisions", () => {
    // Two conflicting custom id's
    let defineNonUniqueRoutes = () => {
      routes([
        route("/user/:id", "routes/user.tsx", { id: "user" }),
        route("/user", "routes/user.tsx", { id: "user" }),
        route("/other", "routes/other-route.tsx"),
      ]);
    };

    expect(defineNonUniqueRoutes).toThrowErrorMatchingInlineSnapshot(
      `"Unable to define routes with duplicate route id: "user""`
    );

    // Custom id conflicting with a later-defined auto-generated id
    defineNonUniqueRoutes = () => {
      routes([
        route("/user/:id", "routes/user.tsx", { id: "routes/user" }),
        route("/user", "routes/user.tsx"),
      ]);
    };

    expect(defineNonUniqueRoutes).toThrowErrorMatchingInlineSnapshot(
      `"Unable to define routes with duplicate route id: "routes/user""`
    );

    // Custom id conflicting with an earlier-defined auto-generated id
    defineNonUniqueRoutes = () => {
      routes([
        route("/user", "routes/user.tsx"),
        route("/user/:id", "routes/user.tsx", { id: "routes/user" }),
      ]);
    };

    expect(defineNonUniqueRoutes).toThrowErrorMatchingInlineSnapshot(
      `"Unable to define routes with duplicate route id: "routes/user""`
    );
  });

  describe("route helpers", () => {
    describe("route", () => {
      it("supports basic routes", () => {
        expect(route("path", "file.tsx")).toMatchInlineSnapshot(`
          {
            "children": undefined,
            "file": "file.tsx",
            "path": "path",
          }
        `);
      });

      it("supports children", () => {
        expect(route("path", "file.tsx", [route("child", "child.tsx")]))
          .toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "child.tsx",
                "path": "child",
              },
            ],
            "file": "file.tsx",
            "path": "path",
          }
        `);
      });

      it("supports custom IDs", () => {
        expect(route("path", "file.tsx", { id: "custom-id" }))
          .toMatchInlineSnapshot(`
          {
            "children": undefined,
            "file": "file.tsx",
            "id": "custom-id",
            "path": "path",
          }
        `);
      });

      it("supports custom IDs with children", () => {
        expect(
          route("path", "file.tsx", { id: "custom-id" }, [
            route("child", "child.tsx"),
          ])
        ).toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "child.tsx",
                "path": "child",
              },
            ],
            "file": "file.tsx",
            "id": "custom-id",
            "path": "path",
          }
        `);
      });

      it("supports case sensitive routes", () => {
        expect(route("path", "file.tsx", { caseSensitive: true }))
          .toMatchInlineSnapshot(`
          {
            "caseSensitive": true,
            "children": undefined,
            "file": "file.tsx",
            "path": "path",
          }
        `);
      });

      it("supports pathless index", () => {
        expect(route(null, "file.tsx", { index: true })).toMatchInlineSnapshot(`
          {
            "children": undefined,
            "file": "file.tsx",
            "index": true,
            "path": undefined,
          }
        `);
      });

      it("ignores unsupported options", () => {
        expect(
          // @ts-expect-error unsupportedOption
          route(null, "file.tsx", {
            index: true,
            unsupportedOption: 123,
          })
        ).toMatchInlineSnapshot(`
          {
            "children": undefined,
            "file": "file.tsx",
            "index": true,
            "path": undefined,
          }
        `);
      });
    });

    describe("index", () => {
      it("supports basic routes", () => {
        expect(index("file.tsx")).toMatchInlineSnapshot(`
          {
            "file": "file.tsx",
            "index": true,
          }
        `);
      });

      it("supports custom IDs", () => {
        expect(index("file.tsx", { id: "custom-id" })).toMatchInlineSnapshot(`
          {
            "file": "file.tsx",
            "id": "custom-id",
            "index": true,
          }
        `);
      });

      it("ignores unsupported options", () => {
        expect(
          index("file.tsx", {
            id: "custom-id",
            // @ts-expect-error
            unsupportedOption: 123,
          })
        ).toMatchInlineSnapshot(`
          {
            "file": "file.tsx",
            "id": "custom-id",
            "index": true,
          }
        `);
      });
    });

    describe("layout", () => {
      it("supports basic routes", () => {
        expect(layout("layout.tsx")).toMatchInlineSnapshot(`
          {
            "children": undefined,
            "file": "layout.tsx",
          }
        `);
      });

      it("supports children", () => {
        expect(layout("layout.tsx", [route("path", "file.tsx")]))
          .toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "file.tsx",
                "path": "path",
              },
            ],
            "file": "layout.tsx",
          }
        `);
      });

      it("supports custom IDs", () => {
        expect(layout("layout.tsx", { id: "custom-id" }))
          .toMatchInlineSnapshot(`
          {
            "children": undefined,
            "file": "layout.tsx",
            "id": "custom-id",
          }
        `);
      });

      it("supports custom IDs with children", () => {
        expect(
          layout("layout.tsx", { id: "custom-id" }, [route("path", "file.tsx")])
        ).toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "file.tsx",
                "path": "path",
              },
            ],
            "file": "layout.tsx",
            "id": "custom-id",
          }
        `);
      });
    });
  });
});
