import type { ServerBuild } from "../build";
import { createRequestHandler } from "../server";
import { callRouteAction, callRouteLoader } from "../data";
import type { RouteMatch } from "../routeMatching";
import type { ServerRoute } from "../routes";

describe("loaders", () => {
  // so that HTML/Fetch requests are the same, and so redirects don't hang on to
  // this param for no reason
  it("removes _data from request.url", async () => {
    let loader = async ({ request }) => {
      return new URL(request.url).search;
    };

    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            loader
          }
        }
      },
      entry: { module: {} }
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build, {});

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let res = await handler(request);
    expect(await res.json()).toMatchInlineSnapshot(`"?foo=bar"`);
  });

  it("sets header for throw responses", async () => {
    let loader = async ({ request }) => {
      throw new Response("null", {
        headers: {
          "Content-type": "application/json"
        }
      });
    };

    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            loader
          }
        }
      },
      entry: { module: {} }
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build, {});

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let res = await handler(request);
    expect(await res.headers.get("X-Remix-Catch")).toBeTruthy();
  });

  it("removes index from request.url", async () => {
    let loader = async ({ request }) => {
      return new URL(request.url).search;
    };

    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            loader
          }
        }
      },
      entry: { module: {} }
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build, {});

    let request = new Request(
      "http://example.com/random?_data=routes/random&index&foo=bar",
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let res = await handler(request);
    expect(await res.json()).toMatchInlineSnapshot(`"?foo=bar"`);
  });

  it("removes index from request.url and keeps other values", async () => {
    let loader = async ({ request }) => {
      return new URL(request.url).search;
    };

    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            loader
          }
        }
      },
      entry: { module: {} }
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build, {});

    let request = new Request(
      "http://example.com/random?_data=routes/random&index&foo=bar&index=test",
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let res = await handler(request);
    expect(await res.json()).toMatchInlineSnapshot(`"?foo=bar&index=test"`);
  });

  it("throws the right error message when `loader` returns undefined", async () => {
    let loader = async () => {};

    let routeId = "routes/random";

    let request = new Request("http://example.com/random?_data=routes/random");

    let match = {
      params: {},
      pathname: "random",
      route: {
        id: routeId,
        module: {
          loader
        }
      }
    } as unknown as RouteMatch<ServerRoute>;

    try {
      await callRouteLoader({ request, match, loadContext: {} });
    } catch (error) {
      expect(error.message).toMatchInlineSnapshot(
        '"You defined a loader for route \\"routes/random\\" but didn\'t return anything from your `loader` function. Please return a value or `null`."'
      );
    }
  });
});

describe("actions", () => {
  it("throws the right error message when `action` returns undefined", async () => {
    let action = async () => {};

    let routeId = "routes/random";

    let request = new Request("http://example.com/random?_data=routes/random");

    let match = {
      params: {},
      pathname: "random",
      route: {
        id: routeId,
        module: {
          action
        }
      }
    } as unknown as RouteMatch<ServerRoute>;

    try {
      await callRouteAction({ request, match, loadContext: {} });
    } catch (error) {
      expect(error.message).toMatchInlineSnapshot(
        '"You defined an action for route \\"routes/random\\" but didn\'t return anything from your `action` function. Please return a value or `null`."'
      );
    }
  });
});
