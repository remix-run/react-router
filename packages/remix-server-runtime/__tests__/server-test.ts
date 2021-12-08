import { createRequestHandler } from "..";
import { ServerMode } from "../mode";
import type { ServerBuild } from "../build";
import { mockServerBuild } from "./utils";

function spyConsole() {
  // https://github.com/facebook/react/issues/7047
  let spy: any = {};

  beforeAll(() => {
    spy.console = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    spy.console.mockRestore();
  });

  return spy;
}

describe("server", () => {
  let spy = spyConsole();

  let routeId = "root";
  let build: ServerBuild = {
    entry: {
      module: {
        default: async request => {
          return new Response(`${request.method}, ${request.url}`);
        }
      }
    },
    routes: {
      [routeId]: {
        id: routeId,
        path: "",
        module: {
          action: () => "ACTION",
          loader: () => "LOADER",
          default: () => "COMPONENT"
        }
      }
    },
    assets: {
      routes: {
        [routeId]: {
          hasAction: true,
          hasErrorBoundary: false,
          hasLoader: true,
          id: routeId,
          module: routeId,
          path: ""
        }
      }
    }
  } as unknown as ServerBuild;

  describe("createRequestHandler", () => {
    let allowThrough = [
      ["GET", "/"],
      ["GET", "/_data=root"],
      ["POST", "/"],
      ["POST", "/_data=root"],
      ["PUT", "/"],
      ["PUT", "/_data=root"],
      ["DELETE", "/"],
      ["DELETE", "/_data=root"],
      ["PATCH", "/"],
      ["PATCH", "/_data=root"]
    ];
    for (let [method, to] of allowThrough) {
      it(`allows through ${method} request to ${to}`, async () => {
        let handler = createRequestHandler(build, {});
        let response = await handler(
          new Request(`http://localhost:3000${to}`, {
            method
          })
        );

        expect(await response.text()).toContain(method);
      });
    }

    it("strips body for HEAD requests", async () => {
      let handler = createRequestHandler(build, {});
      let response = await handler(
        new Request("http://localhost:3000/", {
          method: "HEAD"
        })
      );

      expect(await response.text()).toBe("");
    });
  });
});

describe("shared server runtime", () => {
  const spy = spyConsole();

  beforeEach(() => {
    spy.console.mockClear();
  });

  let baseUrl = "http://test.com";

  describe("resource routes", () => {
    test("calls resource route loader", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let resourceLoader = jest.fn(() => {
        return "resource";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/resource": {
          loader: resourceLoader,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("resource");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(resourceLoader.mock.calls.length).toBe(1);
    });

    test("calls sub resource route loader", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let resourceLoader = jest.fn(() => {
        return "resource";
      });
      let subResourceLoader = jest.fn(() => {
        return "sub";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/resource": {
          loader: resourceLoader,
          path: "resource"
        },
        "routes/resource.sub": {
          loader: subResourceLoader,
          path: "resource/sub"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource/sub`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("sub");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(resourceLoader.mock.calls.length).toBe(0);
      expect(subResourceLoader.mock.calls.length).toBe(1);
    });

    test("resource route loader allows thrown responses", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let resourceLoader = jest.fn(() => {
        throw new Response("resource");
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/resource": {
          loader: resourceLoader,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.text()).toBe("resource");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(resourceLoader.mock.calls.length).toBe(1);
    });

    test("resource route loader responds with generic error when thrown", async () => {
      let error = new Error("should be logged when resource loader throws");
      let loader = jest.fn(() => {
        throw error;
      });
      let build = mockServerBuild({
        "routes/resource": {
          loader,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource`, { method: "get" });

      let result = await handler(request);
      expect(await result.text()).toBe("Unexpected Server Error");
    });

    test("resource route loader responds with detailed error when thrown in development", async () => {
      let error = new Error("should be logged when resource loader throws");
      let loader = jest.fn(() => {
        throw error;
      });
      let build = mockServerBuild({
        "routes/resource": {
          loader,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Development);

      let request = new Request(`${baseUrl}/resource`, { method: "get" });

      let result = await handler(request);
      expect((await result.text()).includes(error.message)).toBe(true);
      expect(spy.console.mock.calls.length).toBe(1);
    });

    test("calls resource route action", async () => {
      let rootAction = jest.fn(() => {
        return "root";
      });
      let resourceAction = jest.fn(() => {
        return "resource";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          action: rootAction
        },
        "routes/resource": {
          action: resourceAction,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("resource");
      expect(rootAction.mock.calls.length).toBe(0);
      expect(resourceAction.mock.calls.length).toBe(1);
    });

    test("calls sub resource route action", async () => {
      let rootAction = jest.fn(() => {
        return "root";
      });
      let resourceAction = jest.fn(() => {
        return "resource";
      });
      let subResourceAction = jest.fn(() => {
        return "sub";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          action: rootAction
        },
        "routes/resource": {
          action: resourceAction,
          path: "resource"
        },
        "routes/resource.sub": {
          action: subResourceAction,
          path: "resource/sub"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource/sub`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("sub");
      expect(rootAction.mock.calls.length).toBe(0);
      expect(resourceAction.mock.calls.length).toBe(0);
      expect(subResourceAction.mock.calls.length).toBe(1);
    });

    test("resource route action allows thrown responses", async () => {
      let rootAction = jest.fn(() => {
        return "root";
      });
      let resourceAction = jest.fn(() => {
        throw new Response("resource");
      });
      let build = mockServerBuild({
        root: {
          default: {},
          action: rootAction
        },
        "routes/resource": {
          action: resourceAction,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.text()).toBe("resource");
      expect(rootAction.mock.calls.length).toBe(0);
      expect(resourceAction.mock.calls.length).toBe(1);
    });

    test("resource route action responds with generic error when thrown", async () => {
      let error = new Error("should be logged when resource loader throws");
      let action = jest.fn(() => {
        throw error;
      });
      let build = mockServerBuild({
        "routes/resource": {
          action,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/resource`, { method: "post" });

      let result = await handler(request);
      expect(await result.text()).toBe("Unexpected Server Error");
    });

    test("resource route action responds with detailed error when thrown in development", async () => {
      let message = "should be logged when resource loader throws";
      let action = jest.fn(() => {
        throw new Error(message);
      });
      let build = mockServerBuild({
        "routes/resource": {
          action,
          path: "resource"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Development);

      let request = new Request(`${baseUrl}/resource`, { method: "post" });

      let result = await handler(request);
      expect((await result.text()).includes(message)).toBe(true);
      expect(spy.console.mock.calls.length).toBe(1);
    });
  });

  describe("data requests", () => {
    test("data request that does not match loader surfaces error for boundary", async () => {
      let build = mockServerBuild({
        root: {
          default: {}
        },
        "routes/index": {
          parentId: "root",
          index: true
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?_data=routes/index`, {
        method: "get"
      });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(result.headers.get("X-Remix-Error")).toBe("yes");
      expect((await result.json()).message).toBeTruthy();
    });

    test("data request calls loader", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/index": {
          parentId: "root",
          loader: indexLoader,
          index: true
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?_data=routes/index`, {
        method: "get"
      });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("index");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(indexLoader.mock.calls.length).toBe(1);
    });

    test("data request calls loader and responds with generic message and error header", async () => {
      let rootLoader = jest.fn(() => {
        throw new Error("test");
      });
      let testAction = jest.fn(() => {
        return "root";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/test": {
          parentId: "root",
          action: testAction,
          path: "test"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test?_data=root`, {
        method: "get"
      });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect((await result.json()).message).toBe("Unexpected Server Error");
      expect(result.headers.get("X-Remix-Error")).toBe("yes");
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testAction.mock.calls.length).toBe(0);
    });

    test("data request calls loader and responds with detailed info and error header in development mode", async () => {
      let message =
        "data request loader error logged to console once in dev mode";
      let rootLoader = jest.fn(() => {
        throw new Error(message);
      });
      let testAction = jest.fn(() => {
        return "root";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/test": {
          parentId: "root",
          action: testAction,
          path: "test"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Development);

      let request = new Request(`${baseUrl}/test?_data=root`, {
        method: "get"
      });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect((await result.json()).message).toBe(message);
      expect(result.headers.get("X-Remix-Error")).toBe("yes");
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testAction.mock.calls.length).toBe(0);
      expect(spy.console.mock.calls.length).toBe(1);
    });

    test("data request calls loader and responds with catch header", async () => {
      let rootLoader = jest.fn(() => {
        throw new Response("test", { status: 400 });
      });
      let testAction = jest.fn(() => {
        return "root";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/test": {
          parentId: "root",
          action: testAction,
          path: "test"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test?_data=root`, {
        method: "get"
      });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(await result.text()).toBe("test");
      expect(result.headers.get("X-Remix-Catch")).toBe("yes");
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testAction.mock.calls.length).toBe(0);
    });

    test("data request that does not match action surfaces error for boundary", async () => {
      let build = mockServerBuild({
        root: {
          default: {}
        },
        "routes/index": {
          parentId: "root",
          index: true
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index&_data=routes/index`, {
        method: "post"
      });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(result.headers.get("X-Remix-Error")).toBe("yes");
      expect((await result.json()).message).toBeTruthy();
    });

    test("data request calls action", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        return "test";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/test": {
          parentId: "root",
          action: testAction,
          path: "test"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test?_data=routes/test`, {
        method: "post"
      });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("test");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(testAction.mock.calls.length).toBe(1);
    });

    test("data request calls action and responds with generic message and error header", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        throw new Error("test");
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/test": {
          parentId: "root",
          action: testAction,
          path: "test"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test?_data=routes/test`, {
        method: "post"
      });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect((await result.json()).message).toBe("Unexpected Server Error");
      expect(result.headers.get("X-Remix-Error")).toBe("yes");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(testAction.mock.calls.length).toBe(1);
    });

    test("data request calls action and responds with detailed info and error header in development mode", async () => {
      let message =
        "data request action error logged to console once in dev mode";
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        throw new Error(message);
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/test": {
          parentId: "root",
          action: testAction,
          path: "test"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Development);

      let request = new Request(`${baseUrl}/test?_data=routes/test`, {
        method: "post"
      });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect((await result.json()).message).toBe(message);
      expect(result.headers.get("X-Remix-Error")).toBe("yes");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(testAction.mock.calls.length).toBe(1);
      expect(spy.console.mock.calls.length).toBe(1);
    });

    test("data request calls action and responds with catch header", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        throw new Response("test", { status: 400 });
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/test": {
          parentId: "root",
          action: testAction,
          path: "test"
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test?_data=routes/test`, {
        method: "post"
      });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(await result.text()).toBe("test");
      expect(result.headers.get("X-Remix-Catch")).toBe("yes");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(testAction.mock.calls.length).toBe(1);
    });

    test("data request calls layout action", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let rootAction = jest.fn(() => {
        return "root";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          action: rootAction
        },
        "routes/index": {
          parentId: "root",
          index: true
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?_data=root`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("root");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(rootAction.mock.calls.length).toBe(1);
    });

    test("data request calls index action", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexAction = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        },
        "routes/index": {
          parentId: "root",
          action: indexAction,
          index: true
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index&_data=routes/index`, {
        method: "post"
      });

      let result = await handler(request);
      expect(result.status).toBe(200);
      expect(await result.json()).toBe("index");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(indexAction.mock.calls.length).toBe(1);
    });
  });

  describe("document requests", () => {
    test("not found document request for no matches and no CatchBoundary", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(404);
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(404);
      expect(entryContext.appState.catchBoundaryRouteId).toBe(null);
    });

    test("sets root as catch boundary for not found document request", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(404);
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(404);
      expect(entryContext.appState.catchBoundaryRouteId).toBe("root");
      expect(entryContext.routeData).toEqual({});
    });

    test("thrown loader responses bubble up", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        throw new Response(null, { status: 400 });
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(1);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(400);
      expect(entryContext.appState.catchBoundaryRouteId).toBe("root");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("thrown loader responses catch deep", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        throw new Response(null, { status: 400 });
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader,
          CatchBoundary: {}
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(1);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(400);
      expect(entryContext.appState.catchBoundaryRouteId).toBe("routes/index");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("thrown action responses bubble up", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        throw new Response(null, { status: 400 });
      });
      let testLoader = jest.fn(() => {
        return "test";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/test": {
          parentId: "root",
          path: "test",
          default: {},
          loader: testLoader,
          action: testAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(testAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(400);
      expect(entryContext.appState.catchBoundaryRouteId).toBe("root");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("thrown action responses bubble up for index routes", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexAction = jest.fn(() => {
        throw new Response(null, { status: 400 });
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader,
          action: indexAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(indexAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(400);
      expect(entryContext.appState.catchBoundaryRouteId).toBe("root");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("thrown action responses catch deep", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        throw new Response(null, { status: 400 });
      });
      let testLoader = jest.fn(() => {
        return "test";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/test": {
          parentId: "root",
          path: "test",
          default: {},
          loader: testLoader,
          action: testAction,
          CatchBoundary: {}
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(testAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(400);
      expect(entryContext.appState.catchBoundaryRouteId).toBe("routes/test");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("thrown action responses catch deep for index routes", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexAction = jest.fn(() => {
        throw new Response(null, { status: 400 });
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader,
          action: indexAction,
          CatchBoundary: {}
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(indexAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch!.status).toBe(400);
      expect(entryContext.appState.catchBoundaryRouteId).toBe("routes/index");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("thrown loader response after thrown action response bubble up action throw to deepest loader boundary", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let layoutLoader = jest.fn(() => {
        throw new Response("layout", { status: 401 });
      });
      let testAction = jest.fn(() => {
        throw new Response("action", { status: 400 });
      });
      let testLoader = jest.fn(() => {
        return "test";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/__layout": {
          parentId: "root",
          default: {},
          loader: layoutLoader,
          CatchBoundary: {}
        },
        "routes/__layout/test": {
          parentId: "routes/__layout",
          path: "test",
          default: {},
          loader: testLoader,
          action: testAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(testAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch.data).toBe("action");
      expect(entryContext.appState.catchBoundaryRouteId).toBe(
        "routes/__layout"
      );
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("thrown loader response after thrown index action response bubble up action throw to deepest loader boundary", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let layoutLoader = jest.fn(() => {
        throw new Response("layout", { status: 401 });
      });
      let indexAction = jest.fn(() => {
        throw new Response("action", { status: 400 });
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          CatchBoundary: {}
        },
        "routes/__layout": {
          parentId: "root",
          default: {},
          loader: layoutLoader,
          CatchBoundary: {}
        },
        "routes/__layout/index": {
          parentId: "routes/__layout",
          index: true,
          default: {},
          loader: indexLoader,
          action: indexAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(400);
      expect(indexAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.catch).toBeTruthy();
      expect(entryContext.appState.catch.data).toBe("action");
      expect(entryContext.appState.catchBoundaryRouteId).toBe(
        "routes/__layout"
      );
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("loader errors bubble up", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        throw new Error("index");
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(1);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("index");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe("root");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("loader errors catch deep", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        throw new Error("index");
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader,
          ErrorBoundary: {}
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(1);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("index");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe("routes/index");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("action errors bubble up", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        throw new Error("test");
      });
      let testLoader = jest.fn(() => {
        return "test";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/test": {
          parentId: "root",
          path: "test",
          default: {},
          loader: testLoader,
          action: testAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(testAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("test");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe("root");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("action errors bubble up for index routes", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexAction = jest.fn(() => {
        throw new Error("index");
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader,
          action: indexAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(indexAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("index");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe("root");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("action errors catch deep", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let testAction = jest.fn(() => {
        throw new Error("test");
      });
      let testLoader = jest.fn(() => {
        return "test";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/test": {
          parentId: "root",
          path: "test",
          default: {},
          loader: testLoader,
          action: testAction,
          ErrorBoundary: {}
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(testAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("test");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe("routes/test");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("action errors catch deep for index routes", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexAction = jest.fn(() => {
        throw new Error("index");
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          index: true,
          default: {},
          loader: indexLoader,
          action: indexAction,
          ErrorBoundary: {}
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(indexAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("index");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe("routes/index");
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("loader errors after action error bubble up action error to deepest loader boundary", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let layoutLoader = jest.fn(() => {
        throw new Error("layout");
      });
      let testAction = jest.fn(() => {
        throw new Error("action");
      });
      let testLoader = jest.fn(() => {
        return "test";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/__layout": {
          parentId: "root",
          default: {},
          loader: layoutLoader,
          ErrorBoundary: {}
        },
        "routes/__layout/test": {
          parentId: "routes/__layout",
          path: "test",
          default: {},
          loader: testLoader,
          action: testAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/test`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(testAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(testLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("action");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe(
        "routes/__layout"
      );
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("loader errors after index action error bubble up action error to deepest loader boundary", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let layoutLoader = jest.fn(() => {
        throw new Error("layout");
      });
      let indexAction = jest.fn(() => {
        throw new Error("action");
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/__layout": {
          parentId: "root",
          default: {},
          loader: layoutLoader,
          ErrorBoundary: {}
        },
        "routes/__layout/index": {
          parentId: "routes/__layout",
          index: true,
          default: {},
          loader: indexLoader,
          action: indexAction
        }
      });
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/?index`, { method: "post" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(indexAction.mock.calls.length).toBe(1);
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(indexLoader.mock.calls.length).toBe(0);
      expect(build.entry.module.default.mock.calls.length).toBe(1);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(1);
      let entryContext = calls[0][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("action");
      expect(entryContext.appState.loaderBoundaryRouteId).toBe(
        "routes/__layout"
      );
      expect(entryContext.routeData).toEqual({
        root: "root"
      });
    });

    test("calls handleDocumentRequest again with new error when handleDocumentRequest throws", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          default: {},
          loader: indexLoader
        }
      });
      let calledBefore = false;
      let ogHandleDocumentRequest = build.entry.module.default;
      build.entry.module.default = jest.fn(function () {
        if (!calledBefore) {
          throw new Error("thrown");
        }
        calledBefore = true;
        return ogHandleDocumentRequest.call(null, arguments);
      }) as any;
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(indexLoader.mock.calls.length).toBe(0);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(2);
      let entryContext = calls[1][3];
      expect(entryContext.appState.error).toBeTruthy();
      expect(entryContext.appState.error.message).toBe("thrown");
      expect(entryContext.appState.trackBoundaries).toBe(false);
      expect(entryContext.routeData).toEqual({});
    });

    test("returns generic message if handleDocumentRequest throws a second time", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          default: {},
          loader: indexLoader
        }
      });
      let lastThrownError;
      build.entry.module.default = jest.fn(function () {
        lastThrownError = new Error("rofl");
        throw lastThrownError;
      }) as any;
      let handler = createRequestHandler(build, {}, ServerMode.Test);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect(await result.text()).toBe("Unexpected Server Error");
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(indexLoader.mock.calls.length).toBe(0);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(2);
    });

    test("returns more detailed message if handleDocumentRequest throws a second time in development mode", async () => {
      let rootLoader = jest.fn(() => {
        return "root";
      });
      let indexLoader = jest.fn(() => {
        return "index";
      });
      let build = mockServerBuild({
        root: {
          default: {},
          loader: rootLoader,
          ErrorBoundary: {}
        },
        "routes/index": {
          parentId: "root",
          default: {},
          loader: indexLoader
        }
      });
      let errorMessage =
        "thrown from handleDocumentRequest and expected to be logged in console only once";
      let lastThrownError;
      build.entry.module.default = jest.fn(function () {
        lastThrownError = new Error(errorMessage);
        throw lastThrownError;
      }) as any;
      let handler = createRequestHandler(build, {}, ServerMode.Development);

      let request = new Request(`${baseUrl}/`, { method: "get" });

      let result = await handler(request);
      expect(result.status).toBe(500);
      expect((await result.text()).includes(errorMessage)).toBe(true);
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(indexLoader.mock.calls.length).toBe(0);

      let calls = build.entry.module.default.mock.calls;
      expect(calls.length).toBe(2);
      expect(spy.console.mock.calls.length).toBe(1);
    });
  });
});
