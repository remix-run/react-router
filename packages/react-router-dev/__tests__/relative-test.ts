import { relative, route, configRoutesToRouteManifest } from "../config/routes";
import * as Path from "pathe";

describe("relative() route ID generation - Fix #14125", () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
  });

  describe("Issue #14125 reproduction", () => {
    it("Without fix: route IDs would contain absolute paths", () => {
      const { route: relativeRoute } = relative("app/routes");
      const routes = [relativeRoute("test", "test.tsx")];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const testRoute = Object.values(manifest)[0];

      expect(testRoute.id).toBe("app/routes/test");
      expect(testRoute.id).not.toMatch(/^\/Users\//);
      expect(testRoute.id).not.toMatch(/^\/home\//);
      expect(testRoute.id).not.toMatch(/^C:\\/);
    });

    it("Demonstrates the original issue with useMatches() output", () => {
      const { layout, route: relativeRoute } = relative("app/routes");
      const routes = [
        layout("layout.tsx", [relativeRoute("test", "test.tsx")]),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const routeIds = Object.values(manifest).map((r) => r.id);

      routeIds.forEach((id) => {
        expect(id).not.toContain(process.cwd());
        expect(Path.isAbsolute(id)).toBe(false);
      });
    });
  });

  describe("Verify fix behavior", () => {
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
  });

  describe("Edge cases", () => {
    it("Handles Windows-style paths correctly", () => {
      const { route } = relative("app\\routes\\windows");
      const routes = [route("test", "test.tsx")];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const testRoute = Object.values(manifest)[0];

      const normalizedId = testRoute.id.replace(/\\/g, "/");
      expect(normalizedId).toMatch(/app\/routes\/windows\/test/);
    });

    it("Handles deeply nested relative paths", () => {
      const { route } = relative("app/routes/admin/settings/advanced");
      const routes = [route("security", "security.tsx")];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const securityRoute = Object.values(manifest)[0];

      expect(securityRoute.id).toBe(
        "app/routes/admin/settings/advanced/security",
      );
    });

    it("Handles files with multiple extensions correctly", () => {
      const { route } = relative("app/routes");
      const routes = [
        route("test", "test.component.tsx"),
        route("api", "api.service.ts"),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const testRoute = Object.values(manifest).find((r) =>
        r.file.includes("test.component"),
      );
      const apiRoute = Object.values(manifest).find((r) =>
        r.file.includes("api.service"),
      );

      expect(testRoute?.id).toBe("app/routes/test.component");
      expect(apiRoute?.id).toBe("app/routes/api.service");
    });

    it("Handles relative paths starting with './'", () => {
      const { route } = relative("./app/routes");
      const routes = [route("test", "test.tsx")];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const testRoute = Object.values(manifest)[0];

      expect(testRoute.id).toBe("app/routes/test");
    });

    it("Handles relative paths with '../'", () => {
      const { route } = relative("app/routes/../routes");
      const routes = [route("test", "test.tsx")];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const testRoute = Object.values(manifest)[0];

      expect(testRoute.id).toBe("app/routes/test");
    });

    it("Handles empty path parameter correctly", () => {
      const { route } = relative("app/routes");
      const routes = [
        route(null, "null-path.tsx"),
        route(undefined, "undefined-path.tsx"),
        route("", "empty-path.tsx"),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const nullRoute = Object.values(manifest).find((r) =>
        r.file.includes("null-path"),
      );
      const undefinedRoute = Object.values(manifest).find((r) =>
        r.file.includes("undefined-path"),
      );
      const emptyRoute = Object.values(manifest).find((r) =>
        r.file.includes("empty-path"),
      );

      expect(nullRoute?.id).toBe("app/routes/null-path");
      expect(undefinedRoute?.id).toBe("app/routes/undefined-path");
      expect(emptyRoute?.id).toBe("app/routes/empty-path");
    });

    it("Handles special characters in file names", () => {
      const { route } = relative("app/routes");
      const routes = [
        route("test", "test-file.tsx"),
        route("test2", "test_file.tsx"),
        route("test3", "test.file.tsx"),
        route("test4", "$userId.tsx"),
        route("test5", "[...slug].tsx"),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);

      expect(Object.values(manifest)[0].id).toBe("app/routes/test-file");
      expect(Object.values(manifest)[1].id).toBe("app/routes/test_file");
      expect(Object.values(manifest)[2].id).toBe("app/routes/test.file");
      expect(Object.values(manifest)[3].id).toBe("app/routes/$userId");
      expect(Object.values(manifest)[4].id).toBe("app/routes/[...slug]");
    });
  });

  describe("Cross-environment consistency", () => {
    it("Generates consistent IDs across different working directories", () => {
      const cwd1 = "/Users/dev/projects/app1";
      const cwd2 = "/home/ubuntu/apps/app2";

      const { route } = relative("app/routes");
      const routes = [route("test", "test.tsx")];

      process.chdir = jest.fn().mockReturnValue(undefined);
      process.cwd = jest
        .fn()
        .mockReturnValueOnce(cwd1)
        .mockReturnValueOnce(cwd2);

      const manifest1 = configRoutesToRouteManifest(cwd1, routes);
      const manifest2 = configRoutesToRouteManifest(cwd2, routes);

      const route1 = Object.values(manifest1)[0];
      const route2 = Object.values(manifest2)[0];

      expect(route1.id).toBe(route2.id);
      expect(route1.id).toBe("app/routes/test");
    });

    it("Works correctly when process.cwd() contains spaces", () => {
      const cwdWithSpaces = "/Users/dev/my projects/react app";
      process.cwd = jest.fn().mockReturnValue(cwdWithSpaces);

      const { route } = relative("app/routes");
      const routes = [route("test", "test.tsx")];

      const manifest = configRoutesToRouteManifest(cwdWithSpaces, routes);
      const testRoute = Object.values(manifest)[0];

      expect(testRoute.id).toBe("app/routes/test");
      expect(testRoute.id).not.toContain(cwdWithSpaces);
    });
  });

  describe("Multiple relative() instances", () => {
    it("Multiple relative() calls with different base paths work independently", () => {
      const adminRoutes = relative("app/routes/admin");
      const userRoutes = relative("app/routes/user");
      const publicRoutes = relative("app/routes/public");

      const routes = [
        adminRoutes.route("dashboard", "dashboard.tsx"),
        userRoutes.route("profile", "profile.tsx"),
        publicRoutes.route("home", "home.tsx"),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const routeIds = Object.values(manifest).map((r) => r.id);

      expect(routeIds).toContain("app/routes/admin/dashboard");
      expect(routeIds).toContain("app/routes/user/profile");
      expect(routeIds).toContain("app/routes/public/home");
    });

    it("Nested relative() calls maintain correct hierarchy", () => {
      const baseRoutes = relative("app/routes");
      const adminRoutes = relative("app/routes/admin");

      const routes = [
        baseRoutes.layout("root.tsx", [
          adminRoutes.layout("admin-layout.tsx", [
            adminRoutes.route("users", "users.tsx"),
            adminRoutes.route("settings", "settings.tsx"),
          ]),
        ]),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const adminLayout = Object.values(manifest).find((r) =>
        r.file.includes("admin-layout"),
      );
      const usersRoute = Object.values(manifest).find((r) =>
        r.file.includes("users"),
      );

      expect(adminLayout?.id).toBe("app/routes/admin/admin-layout");
      expect(usersRoute?.id).toBe("app/routes/admin/users");
      expect(usersRoute?.parentId).toBe(adminLayout?.id);
    });
  });

  describe("Function overload signatures", () => {
    it("All route() overloads work correctly", () => {
      const { route } = relative("app/routes");

      const r1 = route("path1", "file1.tsx");
      expect(r1.id).toBe("app/routes/file1");

      const r2 = route("path2", "file2.tsx", [route("child", "child.tsx")]);
      expect(r2.id).toBe("app/routes/file2");

      const r3 = route("path3", "file3.tsx", { caseSensitive: true });
      expect(r3.id).toBe("app/routes/file3");
      expect(r3.caseSensitive).toBe(true);

      const r4 = route("path4", "file4.tsx", { index: true }, [
        route("child", "child.tsx"),
      ]);
      expect(r4.id).toBe("app/routes/file4");
      expect(r4.index).toBe(true);

      const r5 = route("path5", "file5.tsx", { id: "custom-id" });
      expect(r5.id).toBe("custom-id");

      const r6 = route(
        "path6",
        "file6.tsx",
        { id: "custom-id", caseSensitive: true },
        [route("child", "child.tsx")],
      );
      expect(r6.id).toBe("custom-id");
      expect(r6.caseSensitive).toBe(true);
    });

    it("All layout() overloads work correctly", () => {
      const { layout, route } = relative("app/routes");

      const l1 = layout("layout1.tsx");
      expect(l1.id).toBe("app/routes/layout1");

      const l2 = layout("layout2.tsx", [route("child", "child.tsx")]);
      expect(l2.id).toBe("app/routes/layout2");
      expect(l2.children).toHaveLength(1);

      const l3 = layout("layout3.tsx", { id: "custom" });
      expect(l3.id).toBe("custom");

      const l4 = layout("layout4.tsx", {}, [route("child", "child.tsx")]);
      expect(l4.id).toBe("app/routes/layout4");
      expect(l4.children).toHaveLength(1);

      const l5 = layout("layout5.tsx", { id: "custom-layout" }, [
        route("child1", "child1.tsx"),
        route("child2", "child2.tsx"),
      ]);
      expect(l5.id).toBe("custom-layout");
      expect(l5.children).toHaveLength(2);
    });

    it("All index() overloads work correctly", () => {
      const { index } = relative("app/routes");

      const i1 = index("index1.tsx");
      expect(i1.id).toBe("app/routes/index1");
      expect(i1.index).toBe(true);

      const i2 = index("index2.tsx", { id: "custom-index" });
      expect(i2.id).toBe("custom-index");
      expect(i2.index).toBe(true);

      const i3 = index("index3.tsx", {});
      expect(i3.id).toBe("app/routes/index3");
      expect(i3.index).toBe(true);
    });
  });

  describe("Potential issues and regression tests", () => {
    it("Does not break when mixing relative() and regular route() calls", () => {
      const { route: relativeRoute } = relative("app/routes/admin");

      const routes = [
        route("/", "app/routes/home.tsx"),
        relativeRoute("dashboard", "dashboard.tsx"),
        route("/about", "app/routes/about.tsx"),
      ];

      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const routeIds = Object.values(manifest).map((r) => r.id);

      expect(routeIds).toContain("app/routes/home");
      expect(routeIds).toContain("app/routes/admin/dashboard");
      expect(routeIds).toContain("app/routes/about");
    });

    it("Handles duplicate route IDs with proper error", () => {
      const { route } = relative("app/routes");

      const routes = [
        route("test", "test.tsx", { id: "duplicate-id" }),
        route("another", "another.tsx", { id: "duplicate-id" }),
      ];

      expect(() => {
        configRoutesToRouteManifest(process.cwd(), routes);
      }).toThrow(
        'Unable to define routes with duplicate route id: "duplicate-id"',
      );
    });

    it("Preserves all route properties when adding ID", () => {
      const { route } = relative("app/routes");

      const testRoute = route("/test/:id", "test.tsx", {
        caseSensitive: true,
        index: false,
      });

      expect(testRoute.path).toBe("/test/:id");
      expect(testRoute.caseSensitive).toBe(true);
      expect(testRoute.index).toBe(false);
      expect(testRoute.id).toBe("app/routes/test");
    });

    it("Handles absolute paths in relative() directory parameter", () => {
      const absolutePath = Path.resolve(process.cwd(), "app/routes");
      const { route } = relative(absolutePath);

      const routes = [route("test", "test.tsx")];
      const manifest = configRoutesToRouteManifest(process.cwd(), routes);
      const testRoute = Object.values(manifest)[0];

      expect(testRoute.id).toBe("app/routes/test");
    });

    it("Type safety is maintained with complex nested structures", () => {
      const { route, layout, index } = relative("app/routes");

      const complexRoute = layout("root.tsx", [
        layout("admin.tsx", [
          route("users", "users/index.tsx", [
            index("users/list.tsx"),
            route(":id", "users/[id].tsx"),
          ]),
          route("settings", "settings.tsx"),
        ]),
        route("public", "public.tsx"),
      ]);

      expect(complexRoute.id).toBe("app/routes/root");
      expect(complexRoute.children).toBeDefined();
      expect(complexRoute.children?.length).toBe(2);

      const adminLayout = complexRoute.children?.[0];
      expect(adminLayout?.id).toBe("app/routes/admin");
      expect(adminLayout?.children?.length).toBe(2);
    });
  });
});
