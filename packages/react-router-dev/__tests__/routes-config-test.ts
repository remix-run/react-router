import { route, layout, index, relative } from "../config/routes";

describe("routes config", () => {
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
