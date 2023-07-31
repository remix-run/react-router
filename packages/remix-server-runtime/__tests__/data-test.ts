import type { ServerBuild } from "../build";
import { defer } from "../responses";
import { createRequestHandler } from "../server";

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
            loader,
          },
        },
      },
      entry: { module: {} },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let res = await handler(request);
    expect(await res.json()).toMatchInlineSnapshot(`"?foo=bar"`);
  });

  it("sets X-Remix-Response header for returned 2xx response", async () => {
    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            async loader() {
              return new Response("text", {
                status: 200,
                headers: { "Content-Type": "text/plain" },
              });
            },
          },
        },
      },
      entry: {
        module: {
          handleError() {},
        },
      },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let res = await handler(request);
    expect(res.headers.get("X-Remix-Response")).toBeTruthy();
    expect(res.headers.get("X-Remix-Error")).toBeNull();
    expect(res.headers.get("X-Remix-Catch")).toBeNull();
    expect(res.headers.get("X-Remix-Redirect")).toBeNull();
  });

  it("sets X-Remix-Response header for returned 2xx defer response", async () => {
    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            async loader() {
              return defer({ lazy: Promise.resolve("hey!") });
            },
          },
        },
      },
      entry: {
        module: {
          handleError() {},
        },
      },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let res = await handler(request);
    expect(res.headers.get("X-Remix-Response")).toBeTruthy();
    expect(res.headers.get("X-Remix-Error")).toBeNull();
    expect(res.headers.get("X-Remix-Catch")).toBeNull();
    expect(res.headers.get("X-Remix-Redirect")).toBeNull();
  });

  it("sets X-Remix-Redirect header for returned 3xx redirect", async () => {
    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            async loader() {
              return new Response("text", {
                status: 302,
                headers: { Location: "https://remix.run" },
              });
            },
          },
        },
      },
      entry: {
        module: {
          handleError() {},
        },
      },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let res = await handler(request);
    expect(res.headers.get("X-Remix-Redirect")).toBeTruthy();
    expect(res.headers.get("X-Remix-Error")).toBeNull();
    expect(res.headers.get("X-Remix-Catch")).toBeNull();
    expect(res.headers.get("X-Remix-Response")).toBeNull();
  });

  it("sets X-Remix-Catch header for throw responses", async () => {
    let loader = async ({ request }) => {
      throw new Response("null", {
        headers: {
          "Content-type": "application/json",
        },
      });
    };

    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            loader,
          },
        },
      },
      entry: { module: {} },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let res = await handler(request);
    expect(res.headers.get("X-Remix-Catch")).toBeTruthy();
    expect(res.headers.get("X-Remix-Error")).toBeNull();
    expect(res.headers.get("X-Remix-Redirect")).toBeNull();
    expect(res.headers.get("X-Remix-Response")).toBeNull();
  });

  it("sets X-Remix-Error header for throw error", async () => {
    let routeId = "routes/random";
    let build = {
      routes: {
        [routeId]: {
          id: routeId,
          path: "/random",
          module: {
            async loader() {
              throw new Error("broke!");
            },
          },
        },
      },
      entry: {
        module: {
          handleError() {},
        },
      },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&foo=bar",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let res = await handler(request);
    expect(res.headers.get("X-Remix-Error")).toBeTruthy();
    expect(res.headers.get("X-Remix-Catch")).toBeNull();
    expect(res.headers.get("X-Remix-Redirect")).toBeNull();
    expect(res.headers.get("X-Remix-Response")).toBeNull();
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
            loader,
          },
        },
      },
      entry: { module: {} },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&index&foo=bar",
      {
        headers: {
          "Content-Type": "application/json",
        },
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
            loader,
          },
        },
      },
      entry: { module: {} },
    } as unknown as ServerBuild;

    let handler = createRequestHandler(build);

    let request = new Request(
      "http://example.com/random?_data=routes/random&index&foo=bar&index=test",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let res = await handler(request);
    expect(await res.json()).toMatchInlineSnapshot(`"?foo=bar&index=test"`);
  });
});
