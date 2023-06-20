import path from "node:path";

import {
  flatRoutesUniversal,
  getRoutePathConflictErrorMessage,
  getRouteIdConflictErrorMessage,
  getRouteSegments,
} from "../config/flat-routes";
import type { ConfigRoute } from "../config/routes";
import { normalizeSlashes } from "../config/routes";

let APP_DIR = path.join("test", "root", "app");

describe("flatRoutes", () => {
  describe("creates proper route paths", () => {
    let tests: [string, string | undefined][] = [
      ["routes.$", "routes/*"],
      ["routes.sub.$", "routes/sub/*"],
      ["routes.$slug", "routes/:slug"],
      ["routes.sub.$slug", "routes/sub/:slug"],
      ["$", "*"],
      ["flat.$", "flat/*"],
      ["$slug", ":slug"],
      ["nested/index", "nested"],
      ["nested.$", "*"],
      ["nested.$slug", ":slug"],
      ["nested._layout.$param", ":param"],

      ["flat.$slug", "flat/:slug"],
      ["flat.sub", "flat/sub"],
      ["flat._index", "flat"],
      ["_index", undefined],
      ["_layout/index", undefined],
      ["_layout.test", "test"],
      ["_layout.$param", ":param"],
      ["$slug[.]json", ":slug.json"],
      ["sub.[sitemap.xml]", "sub/sitemap.xml"],
      ["posts.$slug.[image.jpg]", "posts/:slug/image.jpg"],
      ["sub.[[]", "sub/["],
      ["sub.]", "sub/]"],
      ["sub.[[]]", "sub/[]"],
      ["beef]", "beef]"],
      ["[index]", "index"],
      ["test.inde[x]", "test/index"],
      ["[i]ndex.[[].[[]]", "index/[/[]"],

      // Optional segment routes
      ["(routes).$", "routes?/*"],
      ["(routes).(sub).$", "routes?/sub?/*"],
      ["(routes).($slug)", "routes?/:slug?"],
      ["(routes).sub.($slug)", "routes?/sub/:slug?"],
      ["(nested).$", "nested?/*"],
      ["(flat).$", "flat?/*"],
      ["($slug)", ":slug?"],
      ["(nested).($slug)", "nested?/:slug?"],
      ["(flat).($slug)", "flat?/:slug?"],
      ["flat.(sub)", "flat/sub?"],
      ["_layout.(test)", "test?"],
      ["_layout.($user)", ":user?"],
      ["(nested)._layout.($param)", "nested?/:param?"],
      ["($slug[.]json)", ":slug.json?"],
      ["(sub).([sitemap.xml])", "sub?/sitemap.xml?"],
      ["(sub).[(sitemap.xml)]", "sub?/(sitemap.xml)"],
      ["(posts).($slug).([image.jpg])", "posts?/:slug?/image.jpg?"],
      [
        "($[$dollabills]).([.]lol).(what).([$]).($up)",
        ":$dollabills?/.lol?/what?/$?/:up?",
      ],
      ["(sub).(])", "sub?/]?"],
      ["(sub).([[]])", "sub?/[]?"],
      ["(sub).([[])", "sub?/[?"],
      ["(beef])", "beef]?"],
      ["([index])", "index?"],
      ["(test).(inde[x])", "test?/index?"],
      ["([i]ndex).([[]).([[]])", "index?/[?/[]?"],

      // Opting out of parent layout
      ["user_.projects.$id.roadmap", "user/projects/:id/roadmap"],
      ["app.projects_.$id.roadmap", "app/projects/:id/roadmap"],
      ["shop_.projects_.$id.roadmap", "shop/projects/:id/roadmap"],
    ];

    let manifest = flatRoutesUniversal(
      APP_DIR,
      tests.map((t) => path.join(APP_DIR, "routes", t[0] + ".tsx"))
    );

    for (let [input, expected] of tests) {
      it(`"${input}" -> "${expected}"`, () => {
        if (input.endsWith("/route") || input.endsWith("/index")) {
          input = input.replace(/\/(route|index)$/, "");
        }
        let routeInfo = manifest[path.posix.join("routes", input)];
        expect(routeInfo.path).toBe(expected);
      });
    }

    let invalidSlashFiles = [
      "($[$dollabills]).([.]lol)[/](what)/([$]).$",
      "$[$dollabills].[.]lol[/]what/[$].$",
    ];

    for (let invalid of invalidSlashFiles) {
      test("should error when using `/` in a route segment", () => {
        let regex = new RegExp(
          /Route segment (".*?") for (".*?") cannot contain "\/"/
        );
        expect(() => getRouteSegments(invalid)).toThrow(regex);
      });
    }

    let invalidSplatFiles: string[] = [
      "routes/about.[*].tsx",
      "routes/about.*.tsx",
      "routes/about.[.[.*].].tsx",
    ];

    for (let invalid of invalidSplatFiles) {
      test("should error when using `*` in a route segment", () => {
        let regex = new RegExp(
          /Route segment (".*?") for (".*?") cannot contain "\*"/
        );
        expect(() => getRouteSegments(invalid)).toThrow(regex);
      });
    }

    let invalidParamFiles: string[] = [
      "routes/about.[:name].tsx",
      "routes/about.:name.tsx",
    ];

    for (let invalid of invalidParamFiles) {
      test("should error when using `:` in a route segment", () => {
        let regex = new RegExp(
          /Route segment (".*?") for (".*?") cannot contain ":"/
        );
        expect(() => getRouteSegments(invalid)).toThrow(regex);
      });
    }
  });

  describe("should return the correct route hierarchy", () => {
    // we'll add file manually before running the tests
    let testFiles: [string, Omit<ConfigRoute, "file">][] = [
      [
        "routes/_auth.tsx",
        {
          id: "routes/_auth",
          parentId: "root",
          path: undefined,
        },
      ],
      [
        "routes/_auth.forgot-password.tsx",
        {
          id: "routes/_auth.forgot-password",
          parentId: "routes/_auth",
          path: "forgot-password",
        },
      ],
      [
        "routes/_auth.login.tsx",
        {
          id: "routes/_auth.login",
          parentId: "routes/_auth",
          path: "login",
        },
      ],
      [
        "routes/_auth.reset-password.tsx",
        {
          id: "routes/_auth.reset-password",
          parentId: "routes/_auth",
          path: "reset-password",
        },
      ],
      [
        "routes/_auth.signup.tsx",
        {
          id: "routes/_auth.signup",
          parentId: "routes/_auth",
          path: "signup",
        },
      ],
      [
        "routes/_landing/index.tsx",
        {
          id: "routes/_landing",
          parentId: "root",
          path: undefined,
        },
      ],
      [
        "routes/_landing._index/index.tsx",
        {
          id: "routes/_landing._index",
          parentId: "routes/_landing",
          path: undefined,
          index: true,
        },
      ],
      [
        "routes/_landing.index.tsx",
        {
          id: "routes/_landing.index",
          parentId: "routes/_landing",
          path: "index",
        },
      ],
      [
        "routes/_about.tsx",
        {
          id: "routes/_about",
          parentId: "root",
          path: undefined,
        },
      ],
      [
        "routes/_about.faq.tsx",
        {
          id: "routes/_about.faq",
          parentId: "routes/_about",
          path: "faq",
        },
      ],
      [
        "routes/_about.$splat.tsx",
        {
          id: "routes/_about.$splat",
          parentId: "routes/_about",
          path: ":splat",
        },
      ],
      [
        "routes/app.tsx",
        {
          id: "routes/app",
          parentId: "root",
          path: "app",
        },
      ],
      [
        "routes/app.calendar.$day.tsx",
        {
          id: "routes/app.calendar.$day",
          parentId: "routes/app",
          path: "calendar/:day",
        },
      ],
      [
        "routes/app.calendar._index.tsx",
        {
          id: "routes/app.calendar._index",
          index: true,
          parentId: "routes/app",
          path: "calendar",
        },
      ],
      [
        "routes/app.projects.tsx",
        {
          id: "routes/app.projects",
          parentId: "routes/app",
          path: "projects",
        },
      ],
      [
        "routes/app.projects.$id.tsx",
        {
          id: "routes/app.projects.$id",
          parentId: "routes/app.projects",
          path: ":id",
        },
      ],
      [
        "routes/app._pathless.tsx",
        {
          id: "routes/app._pathless",
          parentId: "routes/app",
          path: undefined,
        },
      ],
      [
        "routes/app._pathless._index.tsx",
        {
          id: "routes/app._pathless._index",
          parentId: "routes/app._pathless",
          index: true,
          path: undefined,
        },
      ],
      [
        "routes/app._pathless.child.tsx",
        {
          id: "routes/app._pathless.child",
          parentId: "routes/app._pathless",
          path: "child",
        },
      ],
      [
        "routes/folder/route.tsx",
        {
          id: "routes/folder",
          parentId: "root",
          path: "folder",
        },
      ],
      [
        "routes/[route].tsx",
        {
          id: "routes/[route]",
          parentId: "root",
          path: "route",
        },
      ],

      // Opt out of parent layout
      [
        "routes/app_.projects.$id.roadmap[.pdf].tsx",
        {
          id: "routes/app_.projects.$id.roadmap[.pdf]",
          parentId: "root",
          path: "app/projects/:id/roadmap.pdf",
        },
      ],
      [
        "routes/app_.projects.$id.roadmap.tsx",
        {
          id: "routes/app_.projects.$id.roadmap",
          parentId: "root",
          path: "app/projects/:id/roadmap",
        },
      ],

      [
        "routes/app.skip.tsx",
        {
          id: "routes/app.skip",
          parentId: "routes/app",
          path: "skip",
        },
      ],
      [
        "routes/app.skip_.layout.tsx",
        {
          id: "routes/app.skip_.layout",
          index: undefined,
          parentId: "routes/app",
          path: "skip/layout",
        },
      ],

      [
        "routes/app_.skipall_._index.tsx",
        {
          id: "routes/app_.skipall_._index",
          index: true,
          parentId: "root",
          path: "app/skipall",
        },
      ],

      // Escaping route segments
      [
        "routes/_about.[$splat].tsx",
        {
          id: "routes/_about.[$splat]",
          parentId: "routes/_about",
          path: "$splat",
        },
      ],
      [
        "routes/_about.[[].tsx",
        {
          id: "routes/_about.[[]",
          parentId: "routes/_about",
          path: "[",
        },
      ],
      [
        "routes/_about.[]].tsx",
        {
          id: "routes/_about.[]]",
          parentId: "routes/_about",
          path: "]",
        },
      ],
      [
        "routes/_about.[.].tsx",
        {
          id: "routes/_about.[.]",
          parentId: "routes/_about",
          path: ".",
        },
      ],

      // Optional route segments
      [
        "routes/(nested)._layout.($slug).tsx",
        {
          id: "routes/(nested)._layout.($slug)",
          parentId: "root",
          path: "nested?/:slug?",
        },
      ],
      [
        "routes/(routes).$.tsx",
        {
          id: "routes/(routes).$",
          parentId: "root",
          path: "routes?/*",
        },
      ],
      [
        "routes/(routes).(sub).$.tsx",
        {
          id: "routes/(routes).(sub).$",
          parentId: "root",
          path: "routes?/sub?/*",
        },
      ],
      [
        "routes/(routes).($slug).tsx",
        {
          id: "routes/(routes).($slug)",
          parentId: "root",
          path: "routes?/:slug?",
        },
      ],
      [
        "routes/(routes).sub.($slug).tsx",
        {
          id: "routes/(routes).sub.($slug)",
          parentId: "root",
          path: "routes?/sub/:slug?",
        },
      ],
      [
        "routes/(nested).$.tsx",
        {
          id: "routes/(nested).$",
          parentId: "root",
          path: "nested?/*",
        },
      ],
      [
        "routes/(flat).$.tsx",
        {
          id: "routes/(flat).$",
          parentId: "root",
          path: "flat?/*",
        },
      ],
      [
        "routes/(flat).($slug).tsx",
        {
          id: "routes/(flat).($slug)",
          parentId: "root",
          path: "flat?/:slug?",
        },
      ],
      [
        "routes/flat.(sub).tsx",
        {
          id: "routes/flat.(sub)",
          parentId: "root",
          path: "flat/sub?",
        },
      ],
      [
        "routes/_layout.tsx",
        {
          id: "routes/_layout",
          parentId: "root",
          path: undefined,
        },
      ],
      [
        "routes/_layout.(test).tsx",
        {
          id: "routes/_layout.(test)",
          parentId: "routes/_layout",
          path: "test?",
        },
      ],
      [
        "routes/_layout.($slug).tsx",
        {
          id: "routes/_layout.($slug)",
          parentId: "routes/_layout",
          path: ":slug?",
        },
      ],

      // Optional + escaped route segments
      [
        "routes/([_index]).tsx",
        {
          id: "routes/([_index])",
          parentId: "root",
          path: "_index?",
        },
      ],
      [
        "routes/(_[i]ndex).([[]).([[]]).tsx",
        {
          id: "routes/(_[i]ndex).([[]).([[]])",
          parentId: "root",
          path: "_index?/[?/[]?",
        },
      ],
      [
        "routes/(sub).([[]).tsx",
        {
          id: "routes/(sub).([[])",
          parentId: "root",
          path: "sub?/[?",
        },
      ],
      [
        "routes/(sub).(]).tsx",
        {
          id: "routes/(sub).(])",
          parentId: "root",
          path: "sub?/]?",
        },
      ],
      [
        "routes/(sub).([[]]).tsx",
        {
          id: "routes/(sub).([[]])",
          parentId: "root",
          path: "sub?/[]?",
        },
      ],
      [
        "routes/(beef]).tsx",
        {
          id: "routes/(beef])",
          parentId: "root",
          path: "beef]?",
        },
      ],
      [
        "routes/(test).(inde[x]).tsx",
        {
          id: "routes/(test).(inde[x])",
          parentId: "root",
          path: "test?/index?",
        },
      ],
      [
        "routes/($[$dollabills]).([.]lol).(what).([$]).($up).tsx",
        {
          id: "routes/($[$dollabills]).([.]lol).(what).([$]).($up)",
          parentId: "root",
          path: ":$dollabills?/.lol?/what?/$?/:up?",
        },
      ],
      [
        "routes/(posts).($slug).([image.jpg]).tsx",
        {
          id: "routes/(posts).($slug).([image.jpg])",
          parentId: "root",
          path: "posts?/:slug?/image.jpg?",
        },
      ],
      [
        "routes/(sub).([sitemap.xml]).tsx",
        {
          id: "routes/(sub).([sitemap.xml])",
          parentId: "root",
          path: "sub?/sitemap.xml?",
        },
      ],
      [
        "routes/(sub).[(sitemap.xml)].tsx",
        {
          id: "routes/(sub).[(sitemap.xml)]",
          parentId: "root",
          path: "sub?/(sitemap.xml)",
        },
      ],
      [
        "routes/($slug[.]json).tsx",
        {
          id: "routes/($slug[.]json)",
          parentId: "root",
          path: ":slug.json?",
        },
      ],

      [
        "routes/[]otherstuff].tsx",
        {
          id: "routes/[]otherstuff]",
          parentId: "root",
          path: "otherstuff]",
        },
      ],
      [
        "routes/brand.tsx",
        {
          id: "routes/brand",
          parentId: "root",
          path: "brand",
        },
      ],
      [
        "routes/brand._index.tsx",
        {
          id: "routes/brand._index",
          parentId: "routes/brand",
          index: true,
        },
      ],
      [
        "routes/$.tsx",
        {
          id: "routes/$",
          parentId: "root",
          path: "*",
        },
      ],
    ];

    let files: [string, ConfigRoute][] = testFiles.map(([file, route]) => {
      return [file, { ...route, file }];
    });

    let routeManifest = flatRoutesUniversal(
      APP_DIR,
      files.map(([file]) => path.join(APP_DIR, file))
    );
    let routes = Object.values(routeManifest);

    expect(routes).toHaveLength(files.length);

    for (let [file, route] of files) {
      test(`hierarchy for ${file} - ${route.path}`, () => {
        expect(routes).toContainEqual(route);
      });
    }
  });

  describe("doesn't warn when there's not a route collision", () => {
    let consoleError = jest
      .spyOn(global.console, "error")
      .mockImplementation(() => {});

    afterEach(consoleError.mockReset);

    test("same number of segments and the same dynamic segment index", () => {
      let testFiles = [
        path.join(APP_DIR, "routes", "_user.$username.tsx"),
        path.join(APP_DIR, "routes", "sneakers.$sneakerId.tsx"),
      ];

      let routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      let routes = Object.values(routeManifest);

      expect(routes).toHaveLength(testFiles.length);
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe("warns when there's a route collision", () => {
    let consoleError = jest
      .spyOn(global.console, "error")
      .mockImplementation(() => {});

    afterEach(consoleError.mockReset);

    test("index files", () => {
      let testFiles = [
        path.join("routes", "_dashboard._index.tsx"),
        path.join("routes", "_landing._index.tsx"),
        path.join("routes", "_index.tsx"),
      ];

      // route manifest uses the full path
      let fullPaths = testFiles.map((file) => path.join(APP_DIR, file));

      // this is for the expected error message,
      // which uses the relative path from the app directory internally
      let normalizedTestFiles = testFiles.map((file) => normalizeSlashes(file));

      let routeManifest = flatRoutesUniversal(APP_DIR, fullPaths);

      let routes = Object.values(routeManifest);

      expect(routes).toHaveLength(1);
      expect(consoleError).toHaveBeenCalledWith(
        getRoutePathConflictErrorMessage("/", normalizedTestFiles)
      );
    });

    test("folder/route.tsx matching folder.tsx", () => {
      let testFiles = [
        path.join("routes", "dashboard", "route.tsx"),
        path.join("routes", "dashboard.tsx"),
      ];

      // route manifest uses the full path
      let fullPaths = testFiles.map((file) => path.join(APP_DIR, file));

      // this is for the expected error message,
      // which uses the relative path from the app directory internally
      let normalizedTestFiles = testFiles.map((file) => normalizeSlashes(file));

      let routeManifest = flatRoutesUniversal(APP_DIR, fullPaths);

      let routes = Object.values(routeManifest);

      expect(routes).toHaveLength(1);
      expect(consoleError).toHaveBeenCalledWith(
        getRouteIdConflictErrorMessage(
          path.posix.join("routes", "dashboard"),
          normalizedTestFiles
        )
      );
    });

    test.skip("same path, different param name", () => {
      let testFiles = [
        path.join(APP_DIR, "routes", "products.$pid.tsx"),
        path.join(APP_DIR, "routes", "products.$productId.tsx"),
      ];

      let routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      let routes = Object.values(routeManifest);

      expect(routes).toHaveLength(1);
      expect(consoleError).toHaveBeenCalledWith(
        getRoutePathConflictErrorMessage("/products/:pid", testFiles)
      );
    });

    test("pathless layouts should not collide", () => {
      let testFiles = [
        path.join(APP_DIR, "routes", "_a.tsx"),
        path.join(APP_DIR, "routes", "_a._index.tsx"),
        path.join(APP_DIR, "routes", "_a.a.tsx"),
        path.join(APP_DIR, "routes", "_b.tsx"),
        path.join(APP_DIR, "routes", "_b.b.tsx"),
      ];

      let routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      let routes = Object.values(routeManifest);

      expect(consoleError).not.toHaveBeenCalled();
      expect(routes).toHaveLength(5);

      // When using folders and route.tsx files
      testFiles = [
        path.join(APP_DIR, "routes", "_a", "route.tsx"),
        path.join(APP_DIR, "routes", "_a._index", "route.tsx"),
        path.join(APP_DIR, "routes", "_a.a", "route.tsx"),
        path.join(APP_DIR, "routes", "_b", "route.tsx"),
        path.join(APP_DIR, "routes", "_b.b", "route.tsx"),
      ];

      routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      routes = Object.values(routeManifest);

      expect(consoleError).not.toHaveBeenCalled();
      expect(routes).toHaveLength(5);
    });

    test("nested pathless layouts should not collide", () => {
      let testFiles = [
        path.join(APP_DIR, "routes", "nested._a.tsx"),
        path.join(APP_DIR, "routes", "nested._a._index.tsx"),
        path.join(APP_DIR, "routes", "nested._a.a.tsx"),
        path.join(APP_DIR, "routes", "nested._b.tsx"),
        path.join(APP_DIR, "routes", "nested._b.b.tsx"),
      ];

      let routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      let routes = Object.values(routeManifest);

      expect(consoleError).not.toHaveBeenCalled();
      expect(routes).toHaveLength(5);

      // When using folders and route.tsx files
      testFiles = [
        path.join(APP_DIR, "routes", "nested._a", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._a._index", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._a.a", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._b", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._b.b", "route.tsx"),
      ];

      routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      routes = Object.values(routeManifest);

      expect(consoleError).not.toHaveBeenCalled();
      expect(routes).toHaveLength(5);
    });

    test("legit collisions without nested pathless layouts should collide (paths)", () => {
      let testFiles = [
        path.join(APP_DIR, "routes", "nested._a.tsx"),
        path.join(APP_DIR, "routes", "nested._a.a.tsx"),
        path.join(APP_DIR, "routes", "nested._b.tsx"),
        path.join(APP_DIR, "routes", "nested._b.a.tsx"),
      ];

      let routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      let routes = Object.values(routeManifest);

      expect(consoleError).toHaveBeenCalledWith(
        getRoutePathConflictErrorMessage("/nested/a", [
          "routes/nested._a.a.tsx",
          "routes/nested._b.a.tsx",
        ])
      );
      expect(routes).toHaveLength(3);

      // When using folders and route.tsx files
      consoleError.mockClear();
      testFiles = [
        path.join(APP_DIR, "routes", "nested._a", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._a.a", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._b", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._b.a", "route.tsx"),
      ];

      routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      routes = Object.values(routeManifest);

      expect(consoleError).toHaveBeenCalledWith(
        getRoutePathConflictErrorMessage("/nested/a", [
          "routes/nested._a.a/route.tsx",
          "routes/nested._b.a/route.tsx",
        ])
      );
      expect(routes).toHaveLength(3);
    });

    test("legit collisions without nested pathless layouts should collide (index routes)", () => {
      let testFiles = [
        path.join(APP_DIR, "routes", "nested._a.tsx"),
        path.join(APP_DIR, "routes", "nested._a._index.tsx"),
        path.join(APP_DIR, "routes", "nested._b.tsx"),
        path.join(APP_DIR, "routes", "nested._b._index.tsx"),
      ];

      let routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      let routes = Object.values(routeManifest);

      expect(consoleError).toHaveBeenCalledWith(
        getRoutePathConflictErrorMessage("/nested", [
          "routes/nested._a._index.tsx",
          "routes/nested._b._index.tsx",
        ])
      );
      expect(routes).toHaveLength(3);

      // When using folders and route.tsx files
      consoleError.mockClear();
      testFiles = [
        path.join(APP_DIR, "routes", "nested._a", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._a._index", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._b", "route.tsx"),
        path.join(APP_DIR, "routes", "nested._b._index", "route.tsx"),
      ];

      routeManifest = flatRoutesUniversal(APP_DIR, testFiles);

      routes = Object.values(routeManifest);

      expect(consoleError).toHaveBeenCalledWith(
        getRoutePathConflictErrorMessage("/nested", [
          "routes/nested._a._index/route.tsx",
          "routes/nested._b._index/route.tsx",
        ])
      );
      expect(routes).toHaveLength(3);
    });
  });
});
