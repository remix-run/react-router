import {
  validateRouteConfig,
  route,
  layout,
  index,
  relative,
} from "../config/routes";

describe("route config", () => {
  describe("validateRouteConfig", () => {
    it("validates a route config", () => {
      expect(
        validateRouteConfig({
          routeConfigFile: "routes.ts",
          routeConfig: [
            route("parent", "parent.tsx", [route("child", "child.tsx")]),
          ],
        }).valid
      ).toBe(true);
    });

    it("is invalid when not an array", () => {
      let result = validateRouteConfig({
        routeConfigFile: "routes.ts",
        routeConfig: route("path", "file.tsx"),
      });

      expect(result.valid).toBe(false);
      expect(!result.valid && result.message).toMatchInlineSnapshot(
        `"Route config in "routes.ts" must be an array."`
      );
    });

    it("is invalid when route is a promise", () => {
      let result = validateRouteConfig({
        routeConfigFile: "routes.ts",
        /* @ts-expect-error */
        routeConfig: [route("parent", "parent.tsx", [Promise.resolve({})])],
      });

      expect(result.valid).toBe(false);
      expect(!result.valid && result.message).toMatchInlineSnapshot(`
        "Route config in "routes.ts" is invalid.

        Path: routes.0.children.0
        Invalid type: Expected object but received a promise. Did you forget to await?"
      `);
    });

    it("is invalid when file is missing", () => {
      let result = validateRouteConfig({
        routeConfigFile: "routes.ts",
        /* @ts-expect-error */
        routeConfig: [route("parent", "parent.tsx", [{ id: "child" }])],
      });

      expect(result.valid).toBe(false);
      expect(!result.valid && result.message).toMatchInlineSnapshot(`
        "Route config in "routes.ts" is invalid.

        Path: routes.0.children.0.file
        Invalid type: Expected string but received undefined"
      `);
    });

    it("is invalid when property is wrong type", () => {
      let result = validateRouteConfig({
        routeConfigFile: "routes.ts",
        /* @ts-expect-error */
        routeConfig: [route("parent", "parent.tsx", [{ file: 123 }])],
      });

      expect(result.valid).toBe(false);
      expect(!result.valid && result.message).toMatchInlineSnapshot(`
        "Route config in "routes.ts" is invalid.

        Path: routes.0.children.0.file
        Invalid type: Expected string but received 123"
      `);
    });

    it("shows multiple error messages", () => {
      let result = validateRouteConfig({
        routeConfigFile: "routes.ts",
        routeConfig: [
          /* @ts-expect-error */
          route("parent", "parent.tsx", [
            { id: "child" },
            { file: 123 },
            Promise.resolve(),
          ]),
        ],
      });

      expect(result.valid).toBe(false);
      expect(!result.valid && result.message).toMatchInlineSnapshot(`
        "Route config in "routes.ts" is invalid.

        Path: routes.0.children.0.file
        Invalid type: Expected string but received undefined

        Path: routes.0.children.1.file
        Invalid type: Expected string but received 123

        Path: routes.0.children.2
        Invalid type: Expected object but received a promise. Did you forget to await?"
      `);
    });
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
        expect(route("parent", "parent.tsx", [route("child", "child.tsx")]))
          .toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "child.tsx",
                "path": "child",
              },
            ],
            "file": "parent.tsx",
            "path": "parent",
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
          route("parent", "parent.tsx", { id: "custom-id" }, [
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
            "file": "parent.tsx",
            "id": "custom-id",
            "path": "parent",
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
        expect(layout("layout.tsx", [route("child", "child.tsx")]))
          .toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "child.tsx",
                "path": "child",
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
          layout("layout.tsx", { id: "custom-id" }, [
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
            "file": "layout.tsx",
            "id": "custom-id",
          }
        `);
      });
    });

    describe("relative", () => {
      it("supports relative routes", () => {
        let { route } = relative("/path/to/dirname");
        expect(
          route("parent", "nested/parent.tsx", [
            route("child", "nested/child.tsx", { id: "child" }),
          ])
        ).toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "/path/to/dirname/nested/child.tsx",
                "id": "child",
                "path": "child",
              },
            ],
            "file": "/path/to/dirname/nested/parent.tsx",
            "path": "parent",
          }
        `);
      });

      it("supports relative index routes", () => {
        let { index } = relative("/path/to/dirname");
        expect([
          index("nested/without-options.tsx"),
          index("nested/with-options.tsx", { id: "with-options" }),
        ]).toMatchInlineSnapshot(`
          [
            {
              "file": "/path/to/dirname/nested/without-options.tsx",
              "index": true,
            },
            {
              "file": "/path/to/dirname/nested/with-options.tsx",
              "id": "with-options",
              "index": true,
            },
          ]
        `);
      });

      it("supports relative layout routes", () => {
        let { layout } = relative("/path/to/dirname");
        expect(
          layout("nested/parent.tsx", [
            layout("nested/child.tsx", { id: "child" }),
          ])
        ).toMatchInlineSnapshot(`
          {
            "children": [
              {
                "children": undefined,
                "file": "/path/to/dirname/nested/child.tsx",
                "id": "child",
              },
            ],
            "file": "/path/to/dirname/nested/parent.tsx",
          }
        `);
      });
    });
  });
});
