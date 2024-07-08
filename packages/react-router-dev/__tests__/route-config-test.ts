import { dataRoutes } from "../config/routes";

describe("route config", () => {
  describe("dataRoutes", () => {
    it("converts a simple index route", () => {
      expect(
        dataRoutes([
          {
            file: "app/index.tsx",
            index: true,
          },
        ])
      ).toMatchInlineSnapshot(`
        {
          "app/index": {
            "caseSensitive": undefined,
            "file": "app/index.tsx",
            "id": "app/index",
            "index": true,
            "parentId": "root",
            "path": undefined,
          },
        }
      `);
    });

    it("handles nested routes with layout", () => {
      expect(
        dataRoutes([
          {
            id: "layout",
            file: "app/layout.tsx",
            children: [
              {
                id: "child1",
                path: "child1",
                file: "app/child1.tsx",
              },
              {
                id: "child2",
                path: "child2",
                file: "app/child2.tsx",
              },
            ],
          },
        ])
      ).toMatchInlineSnapshot(`
        {
          "child1": {
            "caseSensitive": undefined,
            "file": "app/child1.tsx",
            "id": "child1",
            "index": undefined,
            "parentId": "layout",
            "path": "child1",
          },
          "child2": {
            "caseSensitive": undefined,
            "file": "app/child2.tsx",
            "id": "child2",
            "index": undefined,
            "parentId": "layout",
            "path": "child2",
          },
          "layout": {
            "caseSensitive": undefined,
            "file": "app/layout.tsx",
            "id": "layout",
            "index": undefined,
            "parentId": "root",
            "path": undefined,
          },
        }
      `);
    });
  });
});
