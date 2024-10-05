import { route } from "@react-router/dev/routes";

import { routeManifestToRouteConfig } from "../manifest";

const clean = (obj: any) => cleanUndefined(cleanIds(obj));

const cleanUndefined = (obj: any) => JSON.parse(JSON.stringify(obj));

const cleanIds = (obj: any) =>
  JSON.parse(
    JSON.stringify(obj, function replacer(key, value) {
      return key === "id" ? undefined : value;
    })
  );

describe("routeManifestToRouteConfig", () => {
  test("creates route config", () => {
    let routeManifestConfig = routeManifestToRouteConfig({
      "routes/home": {
        id: "routes/home",
        parentId: "root",
        path: "/",
        file: "routes/home.js",
      },
      "routes/inbox": {
        id: "routes/inbox",
        parentId: "root",
        path: "inbox",
        file: "routes/inbox.js",
      },
      "routes/inbox/index": {
        id: "routes/inbox/index",
        parentId: "routes/inbox",
        path: "/",
        file: "routes/inbox/index.js",
        index: true,
      },
      "routes/inbox/$messageId": {
        id: "routes/inbox/$messageId",
        parentId: "routes/inbox",
        path: ":messageId",
        file: "routes/inbox/$messageId.js",
        caseSensitive: true,
      },
    });
    let routeConfig = [
      route("/", "routes/home.js"),
      route("inbox", "routes/inbox.js", [
        route("/", "routes/inbox/index.js", { index: true }),
        route(":messageId", "routes/inbox/$messageId.js", {
          caseSensitive: true,
        }),
      ]),
    ];

    expect(clean(routeManifestConfig)).toEqual(clean(routeConfig));

    expect(cleanUndefined(routeManifestConfig)).toMatchInlineSnapshot(`
      [
        {
          "file": "routes/home.js",
          "id": "routes/home",
          "path": "/",
        },
        {
          "children": [
            {
              "file": "routes/inbox/index.js",
              "id": "routes/inbox/index",
              "index": true,
              "path": "/",
            },
            {
              "caseSensitive": true,
              "file": "routes/inbox/$messageId.js",
              "id": "routes/inbox/$messageId",
              "path": ":messageId",
            },
          ],
          "file": "routes/inbox.js",
          "id": "routes/inbox",
          "path": "inbox",
        },
      ]
    `);
  });

  test("creates route config with IDs", () => {
    let routeConfig = routeManifestToRouteConfig({
      home: {
        path: "/",
        id: "home",
        parentId: "root",
        file: "routes/home.js",
      },
    });

    expect(routeConfig[0].id).toEqual("home");
  });
});
