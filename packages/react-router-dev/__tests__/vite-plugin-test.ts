import {
  getServerEnvironmentKeys,
  isReactRouterServerEnvironmentName,
} from "../vite/plugin";

describe("React Router Vite server environment detection", () => {
  it("only treats ssr as a React Router server environment without server bundles", () => {
    let ctx = {
      buildManifest: {
        routes: {},
      },
    } as any;

    expect(isReactRouterServerEnvironmentName(ctx, "ssr")).toBe(true);
    expect(isReactRouterServerEnvironmentName(ctx, "client")).toBe(false);
    expect(isReactRouterServerEnvironmentName(ctx, "nitro")).toBe(false);

    expect(
      getServerEnvironmentKeys(ctx, {
        client: {},
        ssr: {},
        nitro: {},
      }),
    ).toEqual(["ssr"]);
  });

  it("ignores external server environments when server bundles are enabled", () => {
    let ctx = {
      buildManifest: {
        routes: {},
        routeIdToServerBundleId: {},
        serverBundles: {
          admin: {
            id: "admin",
            file: "build/server/admin/index.js",
          },
        },
      },
    } as any;

    expect(isReactRouterServerEnvironmentName(ctx, "ssrBundle_admin")).toBe(
      true,
    );
    expect(isReactRouterServerEnvironmentName(ctx, "ssr")).toBe(false);
    expect(isReactRouterServerEnvironmentName(ctx, "nitro")).toBe(false);

    expect(
      getServerEnvironmentKeys(ctx, {
        client: {},
        ssr: {},
        ssrBundle_admin: {},
        nitro: {},
      }),
    ).toEqual(["ssrBundle_admin"]);
  });
});
