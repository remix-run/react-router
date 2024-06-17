import type { RouteObject } from "react-router";
import { matchRoutes } from "react-router";

function pickPaths(routes: RouteObject[], pathname: string): string[] | null {
  let matches = matchRoutes(routes, pathname);
  return matches && matches.map((match) => match.route.path || "");
}

function pickPathsAndParams(routes: RouteObject[], pathname: string) {
  let matches = matchRoutes(routes, pathname);
  return (
    matches &&
    matches.map((match) => ({
      ...(match.route.index ? { index: match.route.index } : {}),
      ...(match.route.path ? { path: match.route.path } : {}),
      params: match.params,
    }))
  );
}

describe("path matching", () => {
  test("root vs. dynamic", () => {
    let routes = [{ path: "/" }, { path: ":id" }];
    expect(pickPaths(routes, "/")).toEqual(["/"]);
    expect(pickPaths(routes, "/123")).toEqual([":id"]);
  });

  test("precedence of a bunch of routes in a flat route config", () => {
    let routes = [
      { path: "/groups/main/users/me" },
      { path: "/groups/:groupId/users/me" },
      { path: "/groups/:groupId/users/:userId" },
      { path: "/groups/:groupId/users/*" },
      { path: "/groups/main/users" },
      { path: "/groups/:groupId/users" },
      { path: "/groups/main" },
      { path: "/groups/:groupId" },
      { path: "/groups" },
      { path: "/files/*" },
      { path: "/files" },
      { path: "/:one/:two/:three/:four/:five" },
      { path: "/" },
      { path: "*" },
    ];

    expect(pickPaths(routes, "/groups/main/users/me")).toEqual([
      "/groups/main/users/me",
    ]);
    expect(pickPaths(routes, "/groups/other/users/me")).toEqual([
      "/groups/:groupId/users/me",
    ]);
    expect(pickPaths(routes, "/groups/123/users/456")).toEqual([
      "/groups/:groupId/users/:userId",
    ]);
    expect(pickPaths(routes, "/groups/main/users/a/b")).toEqual([
      "/groups/:groupId/users/*",
    ]);
    expect(pickPaths(routes, "/groups/main/users")).toEqual([
      "/groups/main/users",
    ]);
    expect(pickPaths(routes, "/groups/123/users")).toEqual([
      "/groups/:groupId/users",
    ]);
    expect(pickPaths(routes, "/groups/main")).toEqual(["/groups/main"]);
    expect(pickPaths(routes, "/groups/123")).toEqual(["/groups/:groupId"]);
    expect(pickPaths(routes, "/groups")).toEqual(["/groups"]);
    expect(pickPaths(routes, "/files/some/long/path")).toEqual(["/files/*"]);
    expect(pickPaths(routes, "/files")).toEqual(["/files"]);
    expect(pickPaths(routes, "/one/two/three/four/five")).toEqual([
      "/:one/:two/:three/:four/:five",
    ]);
    expect(pickPaths(routes, "/")).toEqual(["/"]);
    expect(pickPaths(routes, "/no/where")).toEqual(["*"]);
  });

  test("precedence of a bunch of routes in a nested route config", () => {
    let routes = [
      {
        path: "courses",
        children: [
          {
            path: ":id",
            children: [{ path: "subjects" }],
          },
          { path: "new" },
          { index: true },
          { path: "*" },
        ],
      },
      {
        path: "courses",
        children: [{ path: "react-fundamentals" }, { path: "advanced-react" }],
      },
      { path: "/" },
      { path: "*" },
    ];

    expect(pickPaths(routes, "/courses")).toEqual(["courses", ""]);
    expect(pickPaths(routes, "/courses/routing")).toEqual(["courses", ":id"]);
    expect(pickPaths(routes, "/courses/routing/subjects")).toEqual([
      "courses",
      ":id",
      "subjects",
    ]);
    expect(pickPaths(routes, "/courses/new")).toEqual(["courses", "new"]);
    expect(pickPaths(routes, "/courses/whatever/path")).toEqual([
      "courses",
      "*",
    ]);
    expect(pickPaths(routes, "/courses/react-fundamentals")).toEqual([
      "courses",
      "react-fundamentals",
    ]);
    expect(pickPaths(routes, "/courses/advanced-react")).toEqual([
      "courses",
      "advanced-react",
    ]);
    expect(pickPaths(routes, "/")).toEqual(["/"]);
    expect(pickPaths(routes, "/whatever")).toEqual(["*"]);
  });

  test("nested index route vs sibling static route", () => {
    let routes = [
      {
        path: ":page",
        children: [{ index: true }],
      },
      { path: "page" },
    ];

    expect(pickPaths(routes, "/page")).toEqual(["page"]);
  });

  test("dynamic segments can contain dashes", () => {
    let routes = [
      {
        path: ":foo-bar",
      },
      {
        path: "foo-bar",
      },
    ];

    expect(matchRoutes(routes, "/foo-bar")).toMatchInlineSnapshot(`
      [
        {
          "params": {},
          "pathname": "/foo-bar",
          "pathnameBase": "/foo-bar",
          "route": {
            "path": "foo-bar",
          },
        },
      ]
    `);
    expect(matchRoutes(routes, "/whatever")).toMatchInlineSnapshot(`
      [
        {
          "params": {
            "foo-bar": "whatever",
          },
          "pathname": "/whatever",
          "pathnameBase": "/whatever",
          "route": {
            "path": ":foo-bar",
          },
        },
      ]
    `);
  });
});

describe("path matching with a basename", () => {
  let routes = [
    {
      path: "/users/:userId",
      children: [
        {
          path: "subjects",
          children: [
            {
              path: ":courseId",
            },
          ],
        },
      ],
    },
  ];

  test("top-level route", () => {
    let location = { pathname: "/users/michael" };
    let matches = matchRoutes(routes, location);

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(1);
    expect(matches).toMatchObject([
      {
        params: { userId: "michael" },
        pathname: "/users/michael",
        pathnameBase: "/users/michael",
      },
    ]);
  });

  test("deeply nested route", () => {
    let location = { pathname: "/users/michael/subjects/react" };
    let matches = matchRoutes(routes, location);

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(3);
    expect(matches).toMatchObject([
      {
        params: { userId: "michael", courseId: "react" },
        pathname: "/users/michael",
        pathnameBase: "/users/michael",
      },
      {
        params: { userId: "michael", courseId: "react" },
        pathname: "/users/michael/subjects",
        pathnameBase: "/users/michael/subjects",
      },
      {
        params: { userId: "michael", courseId: "react" },
        pathname: "/users/michael/subjects/react",
        pathnameBase: "/users/michael/subjects/react",
      },
    ]);
  });
});

describe("path matching with splats", () => {
  describe("splat after /", () => {
    let routes = [{ path: "users/:id/files/*" }];

    it("finds the correct match", () => {
      let match = matchRoutes(routes, "/users/mj/files/secrets.txt")!;

      expect(match).not.toBeNull();
      expect(match[0]).toMatchObject({
        params: { id: "mj", "*": "secrets.txt" },
        pathname: "/users/mj/files/secrets.txt",
        pathnameBase: "/users/mj/files",
      });
    });

    describe("when other characters come before the /", () => {
      it("does not find a match", () => {
        let match = matchRoutes(routes, "/users/mj/filesssss/secrets.txt");
        expect(match).toBeNull();
      });
    });
  });

  test("parent route with splat", () => {
    let routes = [
      { path: "users/:id/files/*", children: [{ path: "secrets.txt" }] },
    ];
    let match = matchRoutes(routes, "/users/mj/files/secrets.txt")!;

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { id: "mj", "*": "secrets.txt" },
      pathname: "/users/mj/files/secrets.txt",
      pathnameBase: "/users/mj/files",
    });
    expect(match[1]).toMatchObject({
      params: { id: "mj", "*": "secrets.txt" },
      pathname: "/users/mj/files/secrets.txt",
    });
  });

  test("multiple nested routes", () => {
    let routes = [
      { path: "*", children: [{ path: "*", children: [{ path: "*" }] }] },
    ];
    let match = matchRoutes(routes, "/one/two/three")!;

    expect(match).not.toBeNull();
    expect(match[0]).toMatchObject({
      params: { "*": "one/two/three" },
      pathname: "/one/two/three",
      pathnameBase: "/",
    });
    expect(match[1]).toMatchObject({
      params: { "*": "one/two/three" },
      pathname: "/one/two/three",
      pathnameBase: "/",
    });
    expect(match[2]).toMatchObject({
      params: { "*": "one/two/three" },
      pathname: "/one/two/three",
      pathnameBase: "/",
    });
  });

  test("nested routes with partial matching", () => {
    let routes = [
      { path: "/", children: [{ path: "courses", children: [{ path: "*" }] }] },
    ];
    let match = matchRoutes(routes, "/courses/abc");

    expect(match).not.toBeNull();
    expect(match).toHaveLength(3);
    expect(match![0]).toMatchObject({
      params: { "*": "abc" },
      pathname: "/",
      pathnameBase: "/",
    });
    expect(match![1]).toMatchObject({
      params: { "*": "abc" },
      pathname: "/courses",
      pathnameBase: "/courses",
    });
    expect(match![2]).toMatchObject({
      params: { "*": "abc" },
      pathname: "/courses/abc",
      pathnameBase: "/courses",
    });
  });

  test("does not support partial path matching with named parameters", () => {
    let routes = [{ path: "/prefix:id" }];
    expect(matchRoutes(routes, "/prefix:id")).toMatchInlineSnapshot(`
      [
        {
          "params": {},
          "pathname": "/prefix:id",
          "pathnameBase": "/prefix:id",
          "route": {
            "path": "/prefix:id",
          },
        },
      ]
    `);
    expect(matchRoutes(routes, "/prefixabc")).toEqual(null);
    expect(matchRoutes(routes, "/prefix/abc")).toEqual(null);
  });

  test("does not support partial path matching with splat parameters", () => {
    let consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    let routes = [{ path: "/prefix*" }];
    expect(matchRoutes(routes, "/prefix/abc")).toMatchInlineSnapshot(`
      [
        {
          "params": {
            "*": "abc",
          },
          "pathname": "/prefix/abc",
          "pathnameBase": "/prefix",
          "route": {
            "path": "/prefix*",
          },
        },
      ]
    `);
    expect(matchRoutes(routes, "/prefixabc")).toMatchInlineSnapshot(`null`);

    // Should warn on each invocation of matchRoutes
    expect(consoleWarn.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "Route path "/prefix*" will be treated as if it were "/prefix/*" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "/prefix/*".",
        ],
        [
          "Route path "/prefix*" will be treated as if it were "/prefix/*" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "/prefix/*".",
        ],
      ]
    `);

    consoleWarn.mockRestore();
  });
});

describe("path matching with optional segments", () => {
  test("optional static segment at the start of the path", () => {
    let routes = [
      {
        path: "/en?/abc",
      },
    ];

    expect(pickPathsAndParams(routes, "/")).toEqual(null);
    expect(pickPathsAndParams(routes, "/abc")).toEqual([
      {
        path: "/en?/abc",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/en/abc")).toEqual([
      {
        path: "/en?/abc",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/en/abc/bar")).toEqual(null);
  });

  test("optional static segment at the end of the path", () => {
    let routes = [
      {
        path: "/nested/one?/two?",
      },
    ];

    expect(pickPathsAndParams(routes, "/nested")).toEqual([
      {
        path: "/nested/one?/two?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/one")).toEqual([
      {
        path: "/nested/one?/two?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/one/two")).toEqual([
      {
        path: "/nested/one?/two?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/one/two/baz")).toEqual(null);
  });

  test("intercalated optional static segments", () => {
    let routes = [
      {
        path: "/nested/one?/two/three?",
      },
    ];

    expect(pickPathsAndParams(routes, "/nested")).toEqual(null);
    expect(pickPathsAndParams(routes, "/nested/one")).toEqual(null);
    expect(pickPathsAndParams(routes, "/nested/two")).toEqual([
      {
        path: "/nested/one?/two/three?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/one/two")).toEqual([
      {
        path: "/nested/one?/two/three?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/one/two/three")).toEqual([
      {
        path: "/nested/one?/two/three?",
        params: {},
      },
    ]);
  });

  test("optional static segment in nested routes", () => {
    let nested = [
      {
        path: "/en?",
        children: [
          {
            path: "abc",
          },
        ],
      },
    ];

    expect(pickPathsAndParams(nested, "/en/abc")).toEqual([
      { path: "/en?", params: {} },
      { path: "abc", params: {} },
    ]);
  });
});

describe("path matching with optional dynamic segments", () => {
  test("optional params at the start of the path", () => {
    let routes = [
      {
        path: "/:lang?/abc",
      },
    ];

    expect(pickPathsAndParams(routes, "/")).toEqual(null);
    expect(pickPathsAndParams(routes, "/abc")).toEqual([
      {
        path: "/:lang?/abc",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/en/abc")).toEqual([
      {
        path: "/:lang?/abc",
        params: { lang: "en" },
      },
    ]);
    expect(pickPathsAndParams(routes, "/en/abc/bar")).toEqual(null);
  });

  test("optional params at the end of the path", () => {
    let manualRoutes = [
      {
        path: "/nested",
      },
      {
        path: "/nested/:one",
      },
      {
        path: "/nested/:one/:two",
      },
      {
        path: "/nested/:one/:two/:three",
      },
      {
        path: "/nested/:one/:two/:three/:four",
      },
    ];
    let routes = [
      {
        path: "/nested/:one?/:two?/:three?/:four?",
      },
    ];

    expect(pickPathsAndParams(manualRoutes, "/nested")).toEqual([
      {
        path: "/nested",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested")).toEqual([
      {
        path: "/nested/:one?/:two?/:three?/:four?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(manualRoutes, "/nested/foo")).toEqual([
      {
        path: "/nested/:one",
        params: { one: "foo" },
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/foo")).toEqual([
      {
        path: "/nested/:one?/:two?/:three?/:four?",
        params: { one: "foo" },
      },
    ]);
    expect(pickPathsAndParams(manualRoutes, "/nested/foo/bar")).toEqual([
      {
        path: "/nested/:one/:two",
        params: { one: "foo", two: "bar" },
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/foo/bar")).toEqual([
      {
        path: "/nested/:one?/:two?/:three?/:four?",
        params: { one: "foo", two: "bar" },
      },
    ]);
    expect(pickPathsAndParams(manualRoutes, "/nested/foo/bar/baz")).toEqual([
      {
        path: "/nested/:one/:two/:three",
        params: { one: "foo", two: "bar", three: "baz" },
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/foo/bar/baz")).toEqual([
      {
        path: "/nested/:one?/:two?/:three?/:four?",
        params: { one: "foo", two: "bar", three: "baz" },
      },
    ]);
    expect(pickPathsAndParams(manualRoutes, "/nested/foo/bar/baz/qux")).toEqual(
      [
        {
          path: "/nested/:one/:two/:three/:four",
          params: { one: "foo", two: "bar", three: "baz", four: "qux" },
        },
      ]
    );
    expect(pickPathsAndParams(routes, "/nested/foo/bar/baz/qux")).toEqual([
      {
        path: "/nested/:one?/:two?/:three?/:four?",
        params: { one: "foo", two: "bar", three: "baz", four: "qux" },
      },
    ]);
    expect(
      pickPathsAndParams(manualRoutes, "/nested/foo/bar/baz/qux/zod")
    ).toEqual(null);
    expect(pickPathsAndParams(routes, "/nested/foo/bar/baz/qux/zod")).toEqual(
      null
    );
  });

  test("intercalated optional params", () => {
    let routes = [
      {
        path: "/nested/:one?/two/:three?",
      },
    ];

    expect(pickPathsAndParams(routes, "/nested")).toEqual(null);
    expect(pickPathsAndParams(routes, "/nested/foo")).toEqual(null);
    expect(pickPathsAndParams(routes, "/nested/two")).toEqual([
      {
        path: "/nested/:one?/two/:three?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/foo/two")).toEqual([
      {
        path: "/nested/:one?/two/:three?",
        params: { one: "foo" },
      },
    ]);
    expect(pickPathsAndParams(routes, "/nested/foo/two/bar")).toEqual([
      {
        path: "/nested/:one?/two/:three?",
        params: { one: "foo", three: "bar" },
      },
    ]);
  });

  test("consecutive optional dynamic segments in nested routes", () => {
    let manuallyExploded = [
      {
        path: ":one",
        children: [
          {
            path: ":two",
            children: [
              {
                path: ":three",
              },
              {
                path: "",
              },
            ],
          },
          {
            path: "",
            children: [
              {
                path: ":three",
              },
              {
                path: "",
              },
            ],
          },
        ],
      },
      {
        path: "",
        children: [
          {
            path: ":two",
            children: [
              {
                path: ":three",
              },
              {
                path: "",
              },
            ],
          },
          {
            path: "",
            children: [
              {
                path: ":three",
              },
              {
                path: "",
              },
            ],
          },
        ],
      },
    ];

    let optional = [
      {
        path: ":one?",
        children: [
          {
            path: ":two?",
            children: [
              {
                path: ":three?",
              },
            ],
          },
        ],
      },
    ];

    expect(pickPathsAndParams(manuallyExploded, "/uno")).toEqual([
      {
        path: ":one",
        params: { one: "uno" },
      },
      {
        params: { one: "uno" },
      },
      {
        params: { one: "uno" },
      },
    ]);
    expect(pickPathsAndParams(optional, "/uno")).toEqual([
      {
        path: ":one?",
        params: { one: "uno" },
      },
      {
        params: { one: "uno" },
        path: ":two?",
      },
      {
        params: { one: "uno" },
        path: ":three?",
      },
    ]);

    expect(pickPathsAndParams(manuallyExploded, "/uno/dos")).toEqual([
      {
        path: ":one",
        params: { one: "uno", two: "dos" },
      },
      {
        params: { one: "uno", two: "dos" },
        path: ":two",
      },
      {
        params: { one: "uno", two: "dos" },
      },
    ]);
    expect(pickPathsAndParams(optional, "/uno/dos")).toEqual([
      {
        path: ":one?",
        params: { one: "uno", two: "dos" },
      },
      {
        params: { one: "uno", two: "dos" },
        path: ":two?",
      },
      {
        params: { one: "uno", two: "dos" },
        path: ":three?",
      },
    ]);

    expect(pickPathsAndParams(manuallyExploded, "/uno/dos/tres")).toEqual([
      {
        path: ":one",
        params: { one: "uno", two: "dos", three: "tres" },
      },
      {
        params: { one: "uno", two: "dos", three: "tres" },
        path: ":two",
      },
      {
        params: { one: "uno", two: "dos", three: "tres" },
        path: ":three",
      },
    ]);
    expect(pickPathsAndParams(optional, "/uno/dos/tres")).toEqual([
      {
        path: ":one?",
        params: { one: "uno", two: "dos", three: "tres" },
      },
      {
        params: { one: "uno", two: "dos", three: "tres" },
        path: ":two?",
      },
      {
        params: { one: "uno", two: "dos", three: "tres" },
        path: ":three?",
      },
    ]);

    expect(pickPathsAndParams(manuallyExploded, "/uno/dos/tres/nope")).toEqual(
      null
    );
    expect(pickPathsAndParams(optional, "/uno/dos/tres/nope")).toEqual(null);
  });

  test("consecutive optional static + dynamic segments in nested routes", () => {
    let nested = [
      {
        path: "/one/:two?",
        children: [
          {
            path: "three/:four?",
            children: [
              {
                path: ":five?",
              },
            ],
          },
        ],
      },
    ];
    expect(pickPathsAndParams(nested, "/one/dos/three/cuatro/cinco")).toEqual([
      {
        path: "/one/:two?",
        params: { two: "dos", four: "cuatro", five: "cinco" },
      },
      {
        path: "three/:four?",
        params: { two: "dos", four: "cuatro", five: "cinco" },
      },
      { path: ":five?", params: { two: "dos", four: "cuatro", five: "cinco" } },
    ]);
    expect(pickPathsAndParams(nested, "/one/dos/three/cuatro")).toEqual([
      {
        path: "/one/:two?",
        params: { two: "dos", four: "cuatro" },
      },
      {
        path: "three/:four?",
        params: { two: "dos", four: "cuatro" },
      },
      {
        path: ":five?",
        params: { two: "dos", four: "cuatro" },
      },
    ]);
    expect(pickPathsAndParams(nested, "/one/dos/three")).toEqual([
      {
        path: "/one/:two?",
        params: { two: "dos" },
      },
      {
        path: "three/:four?",
        params: { two: "dos" },
      },
      // Matches into 5 because it's just like if we did path=""
      {
        path: ":five?",
        params: { two: "dos" },
      },
    ]);
    expect(pickPathsAndParams(nested, "/one/dos")).toEqual([
      {
        path: "/one/:two?",
        params: { two: "dos" },
      },
    ]);
    expect(pickPathsAndParams(nested, "/one")).toEqual([
      {
        path: "/one/:two?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(nested, "/one/three/cuatro/cinco")).toEqual([
      {
        path: "/one/:two?",
        params: { four: "cuatro", five: "cinco" },
      },
      {
        path: "three/:four?",
        params: { four: "cuatro", five: "cinco" },
      },
      { path: ":five?", params: { four: "cuatro", five: "cinco" } },
    ]);
    expect(pickPathsAndParams(nested, "/one/three/cuatro")).toEqual([
      {
        path: "/one/:two?",
        params: { four: "cuatro" },
      },
      {
        path: "three/:four?",
        params: { four: "cuatro" },
      },
      {
        path: ":five?",
        params: { four: "cuatro" },
      },
    ]);
    expect(pickPathsAndParams(nested, "/one/three")).toEqual([
      {
        path: "/one/:two?",
        params: {},
      },
      {
        path: "three/:four?",
        params: {},
      },
      // Matches into 5 because it's just like if we did path=""
      {
        path: ":five?",
        params: {},
      },
    ]);
    expect(pickPathsAndParams(nested, "/one")).toEqual([
      {
        path: "/one/:two?",
        params: {},
      },
    ]);
  });

  test("prefers optional static over optional dynamic segments", () => {
    let nested = [
      {
        path: "/one",
        children: [
          {
            path: ":param?",
            children: [
              {
                path: "three",
              },
            ],
          },
          {
            path: "two?",
            children: [
              {
                path: "three",
              },
            ],
          },
        ],
      },
    ];

    // static `two` segment should win
    expect(pickPathsAndParams(nested, "/one/two/three")).toEqual([
      {
        params: {},
        path: "/one",
      },
      {
        params: {},
        path: "two?",
      },
      {
        params: {},
        path: "three",
      },
    ]);

    // fall back to param when no static match
    expect(pickPathsAndParams(nested, "/one/not-two/three")).toEqual([
      {
        params: {
          param: "not-two",
        },
        path: "/one",
      },
      {
        params: {
          param: "not-two",
        },
        path: ":param?",
      },
      {
        params: {
          param: "not-two",
        },
        path: "three",
      },
    ]);

    // No optional segment provided - earlier "dup" route should win
    expect(pickPathsAndParams(nested, "/one/three")).toEqual([
      {
        params: {},
        path: "/one",
      },
      {
        params: {},
        path: ":param?",
      },
      {
        params: {},
        path: "three",
      },
    ]);
  });

  test("prefers index routes over optional static segments", () => {
    let nested = [
      {
        path: "/one",
        children: [
          {
            path: ":param?",
            children: [
              {
                path: "three?",
              },
              {
                index: true,
              },
            ],
          },
        ],
      },
    ];

    expect(pickPathsAndParams(nested, "/one/two")).toEqual([
      {
        params: {
          param: "two",
        },
        path: "/one",
      },
      {
        params: {
          param: "two",
        },
        path: ":param?",
      },
      {
        index: true,
        params: {
          param: "two",
        },
      },
    ]);
    expect(pickPathsAndParams(nested, "/one")).toEqual([
      {
        params: {},
        path: "/one",
      },
      {
        params: {},
        path: ":param?",
      },
      {
        index: true,
        params: {},
      },
    ]);
  });

  test("prefers index routes over optional dynamic segments", () => {
    let nested = [
      {
        path: "/one",
        children: [
          {
            path: ":param?",
            children: [
              {
                path: ":three?",
              },
              {
                index: true,
              },
            ],
          },
        ],
      },
    ];

    expect(pickPathsAndParams(nested, "/one/two")).toEqual([
      {
        params: {
          param: "two",
        },
        path: "/one",
      },
      {
        params: {
          param: "two",
        },
        path: ":param?",
      },
      {
        index: true,
        params: {
          param: "two",
        },
      },
    ]);
    expect(pickPathsAndParams(nested, "/one")).toEqual([
      {
        params: {},
        path: "/one",
      },
      {
        params: {},
        path: ":param?",
      },
      {
        index: true,
        params: {},
      },
    ]);
  });
});
