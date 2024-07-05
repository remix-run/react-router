import {
  type RouteConfig,
  type RouteManifest,
  routeConfigToRouteManifest,
  routeManifestToRouteConfig,
} from "../config/routes";

describe("route config", () => {
  describe("routeConfigToRouteManifest", () => {
    it("converts a simple root route with an index", () => {
      const routeConfig: RouteConfig = {
        id: "root",
        file: "app/root.tsx",
        children: [
          {
            file: "app/index.tsx",
            index: true,
          },
        ],
      };

      const manifest: RouteManifest = routeConfigToRouteManifest(routeConfig);
      expect(manifest).toMatchInlineSnapshot(`
        {
          "app/index": {
            "caseSensitive": undefined,
            "file": "app/index.tsx",
            "id": "app/index",
            "index": true,
            "parentId": "root",
            "path": undefined,
          },
          "root": {
            "caseSensitive": undefined,
            "file": "app/root.tsx",
            "id": "root",
            "index": undefined,
            "parentId": undefined,
            "path": undefined,
          },
        }
      `);
    });

    it("handles nested routes with layout", () => {
      const routeConfig: RouteConfig = {
        id: "root",
        file: "app/root.tsx",
        children: [
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
        ],
      };

      const manifest: RouteManifest = routeConfigToRouteManifest(routeConfig);
      expect(manifest).toMatchInlineSnapshot(`
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
          "root": {
            "caseSensitive": undefined,
            "file": "app/root.tsx",
            "id": "root",
            "index": undefined,
            "parentId": undefined,
            "path": undefined,
          },
        }
      `);
    });
  });

  describe("routeManifestToRouteConfig", () => {
    it("reconstructs a simple root route with an index", () => {
      const manifest: RouteManifest = {
        root: {
          id: "root",
          file: "app/root.tsx",
        },
        index: {
          id: "index",
          parentId: "root",
          file: "app/index.tsx",
          index: true,
        },
      };

      const config = routeManifestToRouteConfig(manifest);
      expect(config).toMatchInlineSnapshot(`
        {
          "caseSensitive": undefined,
          "file": "app/index.tsx",
          "id": "index",
          "index": true,
          "path": undefined,
        }
      `);
    });

    it("reconstructs nested routes with layout", () => {
      const manifest: RouteManifest = {
        root: {
          id: "root",
          file: "app/root.tsx",
        },
        layout: {
          id: "layout",
          parentId: "root",
          file: "app/layout.tsx",
        },
        child1: {
          id: "child1",
          parentId: "layout",
          file: "app/child1.tsx",
        },
        child2: {
          id: "child2",
          parentId: "layout",
          file: "app/child2.tsx",
        },
      };

      const config = routeManifestToRouteConfig(manifest);
      expect(config).toMatchInlineSnapshot(`
        {
          "caseSensitive": undefined,
          "file": "app/child2.tsx",
          "id": "child2",
          "index": undefined,
          "path": undefined,
        }
      `);
    });
  });
});
