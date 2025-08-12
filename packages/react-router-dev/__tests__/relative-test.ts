import { relative, route, configRoutesToRouteManifest } from "../config/routes";

describe("relative() route ID generation - Fix #12325", () => {
  describe("Verify updated behavior", () => {
    it("When using relative(), route IDs are generated based on relative paths", () => {
      const { route, layout, index } = relative("app/routes");

      const routes = [
        layout("_layout.tsx", [
          route("home", "home.tsx"),
          route("about", "about.tsx"),
          index("_index.tsx"),
        ]),
      ];

      const appDirectory = process.cwd();
      const manifest = configRoutesToRouteManifest(appDirectory, routes);

      const layoutRoute = Object.values(manifest).find((r) =>
        r.file.includes("_layout"),
      );
      const homeRoute = Object.values(manifest).find((r) =>
        r.file.includes("home"),
      );
      const indexRoute = Object.values(manifest).find((r) =>
        r.file.includes("_index"),
      );

      console.log("Layout ID:", layoutRoute?.id);
      console.log("Home ID:", homeRoute?.id);
      console.log("Index ID:", indexRoute?.id);

      expect(layoutRoute?.id).toBe("app/routes/_layout");
      expect(homeRoute?.id).toBe("app/routes/home");
      expect(indexRoute?.id).toBe("app/routes/_index");

      expect(layoutRoute?.id).not.toContain(process.cwd());
      expect(homeRoute?.id).not.toContain(process.cwd());
      expect(indexRoute?.id).not.toContain(process.cwd());
    });

    it("Even when using normal route(), relative path IDs are still generated", () => {
      const routes = [route("home", "app/routes/home.tsx")];

      const appDirectory = process.cwd();
      const manifest = configRoutesToRouteManifest(appDirectory, routes);

      const homeRoute = Object.values(manifest)[0];

      console.log("Normal route ID:", homeRoute.id);

      expect(homeRoute.id).toBe("app/routes/home");
      expect(homeRoute.id).not.toContain(process.cwd());
    });

    it("If an ID is explicitly specified, it is preserved as is", () => {
      const { route } = relative("app/routes");

      const routes = [route("home", "home.tsx", { id: "custom-home-id" })];

      const appDirectory = process.cwd();
      const manifest = configRoutesToRouteManifest(appDirectory, routes);
      const homeRoute = Object.values(manifest)[0];

      expect(homeRoute.id).toBe("custom-home-id");
    });

    it("Nested relative paths are handled correctly", () => {
      const { route, layout } = relative("app/routes/admin");

      const routes = [
        layout("_layout.tsx", [
          route("users", "users.tsx"),
          route("settings", "settings.tsx"),
        ]),
      ];

      const appDirectory = process.cwd();
      const manifest = configRoutesToRouteManifest(appDirectory, routes);

      const layoutRoute = Object.values(manifest).find((r) =>
        r.file.includes("_layout"),
      );
      const usersRoute = Object.values(manifest).find((r) =>
        r.file.includes("users"),
      );

      expect(layoutRoute?.id).toBe("app/routes/admin/_layout");
      expect(usersRoute?.id).toBe("app/routes/admin/users");
    });

    it("Route IDs returned from useMatches() should be relative paths", () => {
      const { route, layout, index } = relative("app/routes");
      const routes = [
        layout("root.tsx", [index("_index.tsx"), route("about", "about.tsx")]),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const matchIds = Object.keys(manifest);

      console.log("Route IDs that useMatches() will return:", matchIds);

      expect(matchIds).toEqual([
        "app/routes/root",
        "app/routes/_index",
        "app/routes/about",
      ]);
    });
  });

  describe("Various signature tests", () => {
    it("All route() overloads work correctly", () => {
      const { route } = relative("app/routes");

      const r1 = route("path1", "file1.tsx");
      expect(r1.id).toBe("app/routes/file1");

      const r2 = route("path2", "file2.tsx", [route("child", "child.tsx")]);
      expect(r2.id).toBe("app/routes/file2");

      const r3 = route("path3", "file3.tsx", { caseSensitive: true });
      expect(r3.id).toBe("app/routes/file3");

      const r4 = route("path4", "file4.tsx", { index: true }, [
        route("child", "child.tsx"),
      ]);
      expect(r4.id).toBe("app/routes/file4");
    });

    it("All layout() overloads work correctly", () => {
      const { layout } = relative("app/routes");

      const l1 = layout("layout1.tsx");
      expect(l1.id).toBe("app/routes/layout1");

      const l2 = layout("layout2.tsx", [route("child", "child.tsx")]);
      expect(l2.id).toBe("app/routes/layout2");

      const l3 = layout("layout3.tsx", { id: "custom" });
      expect(l3.id).toBe("custom");

      const l4 = layout("layout4.tsx", {}, [route("child", "child.tsx")]);
      expect(l4.id).toBe("app/routes/layout4");
    });
  });
});
