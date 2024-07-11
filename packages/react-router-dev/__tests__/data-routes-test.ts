import { dataRoutes } from "../config/routes";

describe("dataRoutes", () => {
  it("returns an array of routes", () => {
    let routes = dataRoutes([
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

    expect(routes).toMatchInlineSnapshot(`
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

  it("allows multiple routes with the same route module", () => {
    let routes = dataRoutes([
      { path: "/user/:id", file: "routes/_index.tsx", id: "user-by-id" },
      { path: "/user", file: "routes/_index.tsx", id: "user" },
      { path: "/other", file: "routes/other-route.tsx" },
    ]);

    expect(routes).toMatchInlineSnapshot(`
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
      dataRoutes([
        { path: "/user/:id", file: "routes/user.tsx", id: "user" },
        { path: "/user", file: "routes/user.tsx", id: "user" },
        { path: "/other", file: "routes/other-route.tsx" },
      ]);
    };

    expect(defineNonUniqueRoutes).toThrowErrorMatchingInlineSnapshot(
      `"Unable to define routes with duplicate route id: "user""`
    );

    // Custom id conflicting with a later-defined auto-generated id
    defineNonUniqueRoutes = () => {
      dataRoutes([
        { path: "/user/:id", file: "routes/user.tsx", id: "routes/user" },
        { path: "/user", file: "routes/user.tsx" },
      ]);
    };

    expect(defineNonUniqueRoutes).toThrowErrorMatchingInlineSnapshot(
      `"Unable to define routes with duplicate route id: "routes/user""`
    );

    // Custom id conflicting with an earlier-defined auto-generated id
    defineNonUniqueRoutes = () => {
      dataRoutes([
        { path: "/user", file: "routes/user.tsx" },
        { path: "/user/:id", file: "routes/user.tsx", id: "routes/user" },
      ]);
    };

    expect(defineNonUniqueRoutes).toThrowErrorMatchingInlineSnapshot(
      `"Unable to define routes with duplicate route id: "routes/user""`
    );
  });
});
