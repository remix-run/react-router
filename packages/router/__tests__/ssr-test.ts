/**
 * @jest-environment node
 */

import urlDataStrategy from "./utils/urlDataStrategy";
import type { StaticHandler, StaticHandlerContext } from "../router";
import {
  UNSAFE_DEFERRED_SYMBOL,
  createStaticHandler,
  getStaticContextFromError,
} from "../router";
import {
  ErrorResponseImpl,
  defer,
  isRouteErrorResponse,
  json,
  redirect,
} from "../utils";
import { deferredData, trackedPromise } from "./utils/custom-matchers";
import { createDeferred } from "./utils/data-router-setup";
import {
  createRequest,
  createSubmitRequest,
  invariant,
  sleep,
} from "./utils/utils";

interface CustomMatchers<R = jest.Expect> {
  trackedPromise(data?: any, error?: any, aborted?: boolean): R;
  deferredData(
    done: boolean,
    status?: number,
    headers?: Record<string, string>
  ): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend({
  deferredData,
  trackedPromise,
});

describe("ssr", () => {
  const SSR_ROUTES = [
    {
      id: "index",
      path: "/",
      loader: () => "INDEX LOADER",
    },
    {
      id: "parent",
      path: "/parent",
      loader: () => "PARENT LOADER",
      action: () => "PARENT ACTION",
      children: [
        {
          id: "parentIndex",
          index: true,
          loader: () => "PARENT INDEX LOADER",
          action: () => "PARENT INDEX ACTION",
        },
        {
          id: "child",
          path: "child",
          loader: () => "CHILD LOADER",
          action: () => "CHILD ACTION",
        },
        {
          id: "json",
          path: "json",
          loader: () => json({ type: "loader" }),
          action: () => json({ type: "action" }),
        },
        {
          id: "deferred",
          path: "deferred",
          loader: ({ request }) => {
            if (new URL(request.url).searchParams.has("reject")) {
              return defer({
                critical: "loader",
                lazy: new Promise((_, r) =>
                  setTimeout(() => r(new Error("broken!")), 10)
                ),
              });
            }
            if (new URL(request.url).searchParams.has("undefined")) {
              return defer({
                critical: "loader",
                lazy: new Promise((r) => setTimeout(() => r(undefined), 10)),
              });
            }
            if (new URL(request.url).searchParams.has("status")) {
              return defer(
                {
                  critical: "loader",
                  lazy: new Promise((r) => setTimeout(() => r("lazy"), 10)),
                },
                { status: 201, headers: { "X-Custom": "yes" } }
              );
            }
            return defer({
              critical: "loader",
              lazy: new Promise((r) => setTimeout(() => r("lazy"), 10)),
            });
          },
          action: () =>
            defer({
              critical: "critical",
              lazy: new Promise((r) => setTimeout(() => r("lazy"), 10)),
            }),
        },
        {
          id: "error",
          path: "error",
          loader: () => Promise.reject("ERROR LOADER ERROR"),
          action: () => Promise.reject("ERROR ACTION ERROR"),
        },
        {
          id: "errorBoundary",
          path: "error-boundary",
          hasErrorBoundary: true,
          loader: () => Promise.reject("ERROR BOUNDARY LOADER ERROR"),
          action: () => Promise.reject("ERROR BOUNDARY ACTION ERROR"),
        },
      ],
    },
    {
      id: "redirect",
      path: "/redirect",
      loader: () => redirect("/"),
    },
    {
      id: "custom",
      path: "/custom",
      loader: () =>
        new Response(new URLSearchParams([["foo", "bar"]]).toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }),
    },
  ];

  // Regardless of if the URL is internal or external - all absolute URL
  // responses should return untouched during SSR so the browser can handle
  // them
  let ABSOLUTE_URLS = [
    "http://localhost/",
    "https://localhost/about",
    "http://remix.run/blog",
    "https://remix.run/blog",
    "//remix.run/blog",
    "app://whatever",
    "mailto:hello@remix.run",
    "web+remix:whatever",
  ];

  describe("document requests", () => {
    it("should support document load navigations", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createRequest("/parent/child"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
          child: "CHILD LOADER",
        },
        errors: null,
        location: { pathname: "/parent/child" },
        matches: [{ route: { id: "parent" } }, { route: { id: "child" } }],
      });
    });

    it("should support document load navigations with HEAD requests", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(
        createRequest("/parent/child", { method: "HEAD" })
      );
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
          child: "CHILD LOADER",
        },
        errors: null,
        location: { pathname: "/parent/child" },
        matches: [{ route: { id: "parent" } }, { route: { id: "child" } }],
      });
    });

    it("should support document load navigations with a basename", async () => {
      let { query } = createStaticHandler(SSR_ROUTES, { basename: "/base" });
      let context = await query(createRequest("/base/parent/child"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
          child: "CHILD LOADER",
        },
        errors: null,
        location: { pathname: "/base/parent/child" },
        matches: [{ route: { id: "parent" } }, { route: { id: "child" } }],
      });
    });

    it("should fill in null loaderData values for routes without loaders", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "none",
              path: "none",
            },
            {
              id: "a",
              path: "a",
              loader: () => "A",
              children: [
                {
                  id: "b",
                  path: "b",
                },
              ],
            },
          ],
        },
      ]);

      // No loaders at all
      let context = await query(createRequest("/none"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          root: null,
          none: null,
        },
        errors: null,
        location: { pathname: "/none" },
      });

      // Mix of loaders and no loaders
      context = await query(createRequest("/a/b"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          root: null,
          a: "A",
          b: null,
        },
        errors: null,
        location: { pathname: "/a/b" },
      });
    });

    it("should support document load navigations returning responses", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createRequest("/parent/json"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
          json: { type: "loader" },
        },
        errors: null,
        matches: [{ route: { id: "parent" } }, { route: { id: "json" } }],
      });
    });

    it("should support document load navigations returning deferred", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createRequest("/parent/deferred"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
          deferred: {
            critical: "loader",
            lazy: expect.trackedPromise(),
          },
        },
        activeDeferreds: {
          deferred: expect.deferredData(false),
        },
        errors: null,
        location: { pathname: "/parent/deferred" },
        matches: [{ route: { id: "parent" } }, { route: { id: "deferred" } }],
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(context).toMatchObject({
        loaderData: {
          deferred: {
            lazy: expect.trackedPromise("lazy"),
          },
        },
        activeDeferreds: {
          deferred: expect.deferredData(true),
        },
      });
    });

    it("should support route.lazy", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          async lazy() {
            await sleep(100);
            return {
              async loader() {
                await sleep(100);
                return "ROOT LOADER";
              },
            };
          },
        },
        {
          id: "parent",
          path: "/parent",
          async lazy() {
            await sleep(100);
            return {
              async loader() {
                await sleep(100);
                return "PARENT LOADER";
              },
            };
          },
          children: [
            {
              id: "child",
              path: "child",
              async lazy() {
                await sleep(100);
                return {
                  async loader() {
                    await sleep(100);
                    return "CHILD LOADER";
                  },
                };
              },
            },
          ],
        },
      ]);

      let context = await query(createRequest("/"));
      expect(context).toMatchObject({
        loaderData: {
          root: "ROOT LOADER",
        },
        errors: null,
        location: { pathname: "/" },
        matches: [{ route: { id: "root" } }],
      });

      context = await query(createRequest("/parent/child"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
          child: "CHILD LOADER",
        },
        errors: null,
        location: { pathname: "/parent/child" },
        matches: [{ route: { id: "parent" } }, { route: { id: "child" } }],
      });
    });

    it("should support document submit navigations", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createSubmitRequest("/parent/child"));
      expect(context).toMatchObject({
        actionData: {
          child: "CHILD ACTION",
        },
        loaderData: {
          parent: "PARENT LOADER",
          child: "CHILD LOADER",
        },
        errors: null,
        location: { pathname: "/parent/child" },
        matches: [{ route: { id: "parent" } }, { route: { id: "child" } }],
      });
    });

    it("should support alternative submission methods", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context;

      let expected = {
        actionData: {
          child: "CHILD ACTION",
        },
        loaderData: {
          parent: "PARENT LOADER",
          child: "CHILD LOADER",
        },
        errors: null,
        location: { pathname: "/parent/child" },
        matches: [{ route: { id: "parent" } }, { route: { id: "child" } }],
      };

      context = await query(
        createSubmitRequest("/parent/child", { method: "PUT" })
      );
      expect(context).toMatchObject(expected);

      context = await query(
        createSubmitRequest("/parent/child", { method: "PATCH" })
      );
      expect(context).toMatchObject(expected);

      context = await query(
        createSubmitRequest("/parent/child", { method: "DELETE" })
      );
      expect(context).toMatchObject(expected);
    });

    it("should support document submit navigations returning responses", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createSubmitRequest("/parent/json"));
      expect(context).toMatchObject({
        actionData: {
          json: { type: "action" },
        },
        loaderData: {
          parent: "PARENT LOADER",
          json: { type: "loader" },
        },
        errors: null,
        matches: [{ route: { id: "parent" } }, { route: { id: "json" } }],
      });
    });

    it("should support document submit navigations to layout routes", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createSubmitRequest("/parent"));
      expect(context).toMatchObject({
        actionData: {
          parent: "PARENT ACTION",
        },
        loaderData: {
          parent: "PARENT LOADER",
          parentIndex: "PARENT INDEX LOADER",
        },
        errors: null,
        matches: [
          { route: { id: "parent" } },
          { route: { id: "parentIndex" } },
        ],
      });
    });

    it("should support document submit navigations to index routes", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createSubmitRequest("/parent?index"));
      expect(context).toMatchObject({
        actionData: {
          parentIndex: "PARENT INDEX ACTION",
        },
        loaderData: {
          parent: "PARENT LOADER",
          parentIndex: "PARENT INDEX LOADER",
        },
        errors: null,
        matches: [
          { route: { id: "parent" } },
          { route: { id: "parentIndex" } },
        ],
      });
    });

    it("should handle redirect Responses", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let response = await query(createRequest("/redirect"));
      expect(response instanceof Response).toBe(true);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get("Location")).toBe("/");
    });

    it("should handle relative redirect responses (loader)", async () => {
      let { query } = createStaticHandler([
        {
          path: "/",
          children: [
            {
              path: "parent",
              children: [
                {
                  path: "child",
                  loader: () => redirect(".."),
                },
              ],
            },
          ],
        },
      ]);
      let response = await query(createRequest("/parent/child"));
      expect(response instanceof Response).toBe(true);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get("Location")).toBe("/parent");
    });

    it("should handle relative redirect responses (action)", async () => {
      let { query } = createStaticHandler([
        {
          path: "/",
          children: [
            {
              path: "parent",
              children: [
                {
                  path: "child",
                  action: () => redirect(".."),
                },
              ],
            },
          ],
        },
      ]);
      let response = await query(createSubmitRequest("/parent/child"));
      expect(response instanceof Response).toBe(true);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get("Location")).toBe("/parent");
    });

    it("should handle absolute redirect Responses", async () => {
      for (let url of ABSOLUTE_URLS) {
        let handler = createStaticHandler([
          {
            path: "/",
            loader: () => redirect(url),
          },
        ]);
        let response = await handler.query(createRequest("/"));
        expect(response instanceof Response).toBe(true);
        expect((response as Response).status).toBe(302);
        expect((response as Response).headers.get("Location")).toBe(url);
      }
    });

    it("should handle 404 navigations", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context = await query(createRequest("/not/found"));

      expect(context).toMatchObject({
        loaderData: {},
        actionData: null,
        errors: {
          index: new ErrorResponseImpl(
            404,
            "Not Found",
            new Error('No route matches URL "/not/found"'),
            true
          ),
        },
        matches: [{ route: { id: "index" } }],
      });
    });

    it("should handle load error responses", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context;

      // Error handled by child
      context = await query(createRequest("/parent/error-boundary"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
        },
        errors: {
          errorBoundary: "ERROR BOUNDARY LOADER ERROR",
        },
        matches: [
          { route: { id: "parent" } },
          { route: { id: "errorBoundary" } },
        ],
      });

      // Error propagates to parent
      context = await query(createRequest("/parent/error"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
        },
        errors: {
          parent: "ERROR LOADER ERROR",
        },
        matches: [{ route: { id: "parent" } }, { route: { id: "error" } }],
      });
    });

    it("should handle submit error responses", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let context;

      // Error handled by child
      context = await query(createSubmitRequest("/parent/error-boundary"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {
          parent: "PARENT LOADER",
        },
        errors: {
          errorBoundary: "ERROR BOUNDARY ACTION ERROR",
        },
        matches: [
          { route: { id: "parent" } },
          { route: { id: "errorBoundary" } },
        ],
      });

      // Error propagates to parent
      context = await query(createSubmitRequest("/parent/error"));
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {},
        errors: {
          parent: "ERROR ACTION ERROR",
        },
        matches: [{ route: { id: "parent" } }, { route: { id: "error" } }],
      });
    });

    it("should handle multiple errors at separate boundaries", async () => {
      let routes = [
        {
          id: "root",
          path: "/",
          loader: () => Promise.reject("ROOT"),
          hasErrorBoundary: true,
          children: [
            {
              id: "child",
              path: "child",
              loader: () => Promise.reject("CHILD"),
              hasErrorBoundary: true,
            },
          ],
        },
      ];

      let { query } = createStaticHandler(routes);
      let context;

      context = await query(createRequest("/child"));
      expect(context.errors).toEqual({
        root: "ROOT",
        child: "CHILD",
      });
    });

    it("should handle multiple errors at the same boundary", async () => {
      let routes = [
        {
          id: "root",
          path: "/",
          loader: () => Promise.reject("ROOT"),
          hasErrorBoundary: true,
          children: [
            {
              id: "child",
              path: "child",
              loader: () => Promise.reject("CHILD"),
            },
          ],
        },
      ];

      let { query } = createStaticHandler(routes);
      let context;

      context = await query(createRequest("/child"));
      expect(context.errors).toEqual({
        // higher error value wins
        root: "ROOT",
      });
    });

    it("should skip bubbling loader errors when skipLoaderErrorBubbling is passed", async () => {
      let routes = [
        {
          id: "root",
          path: "/",
          hasErrorBoundary: true,
          children: [
            {
              id: "child",
              path: "child",
              loader: () => Promise.reject("CHILD"),
            },
          ],
        },
      ];

      let { query } = createStaticHandler(routes);
      let context;

      context = await query(createRequest("/child"), {
        skipLoaderErrorBubbling: true,
      });
      expect(context.errors).toEqual({
        child: "CHILD",
      });
    });

    it("should handle aborted load requests", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/path",
          loader: () => dfd.promise,
        },
      ]);
      let request = createRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let contextPromise = query(request);
        controller.abort();
        // This should resolve even though we never resolved the loader
        await contextPromise;
      } catch (_e) {
        e = _e;
      }
      expect(e).toMatchInlineSnapshot(
        `[Error: query() call aborted: GET http://localhost/path?key=value]`
      );
    });

    it("should handle aborted submit requests", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/path",
          action: () => dfd.promise,
        },
      ]);
      let request = createSubmitRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let contextPromise = query(request);
        controller.abort();
        // This should resolve even though we never resolved the loader
        await contextPromise;
      } catch (_e) {
        e = _e;
      }
      expect(e).toMatchInlineSnapshot(
        `[Error: query() call aborted: POST http://localhost/path?key=value]`
      );
    });

    it("should handle aborted load requests (v7_throwAbortReason=true)", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { query } = createStaticHandler(
        [
          {
            id: "root",
            path: "/path",
            loader: () => dfd.promise,
          },
        ],
        { future: { v7_throwAbortReason: true } }
      );
      let request = createRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let contextPromise = query(request);
        controller.abort();
        // This should resolve even though we never resolved the loader
        await contextPromise;
      } catch (_e) {
        e = _e;
      }
      // DOMException added in node 17
      if (process.versions.node.split(".").map(Number)[0] >= 17) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toBeInstanceOf(DOMException);
      }
      expect(e.name).toBe("AbortError");
      expect(e.message).toBe("This operation was aborted");
    });

    it("should handle aborted submit requests (v7_throwAbortReason=true)", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { query } = createStaticHandler(
        [
          {
            id: "root",
            path: "/path",
            action: () => dfd.promise,
          },
        ],
        { future: { v7_throwAbortReason: true } }
      );
      let request = createSubmitRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let contextPromise = query(request);
        controller.abort();
        // This should resolve even though we never resolved the loader
        await contextPromise;
      } catch (_e) {
        e = _e;
      }
      // DOMException added in node 17
      if (process.versions.node.split(".").map(Number)[0] >= 17) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toBeInstanceOf(DOMException);
      }
      expect(e.name).toBe("AbortError");
      expect(e.message).toBe("This operation was aborted");
    });

    it("should handle aborted requests (v7_throwAbortReason=true + custom reason)", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { query } = createStaticHandler(
        [
          {
            id: "root",
            path: "/path",
            loader: () => dfd.promise,
          },
        ],
        { future: { v7_throwAbortReason: true } }
      );
      let request = createRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let contextPromise = query(request);
        // Note this works in Node 18+ - but it does not work if using the
        // `abort-controller` polyfill which doesn't yet support a custom `reason`
        // See: https://github.com/mysticatea/abort-controller/issues/33
        controller.abort(new Error("Oh no!"));
        // This should resolve even though we never resolved the loader
        await contextPromise;
      } catch (_e) {
        e = _e;
      }
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("Oh no!");
    });

    it("should assign signals to requests by default (per the", async () => {
      let { query } = createStaticHandler(SSR_ROUTES);
      let request = createRequest("/", { signal: undefined });
      let context = await query(request);
      expect((context as StaticHandlerContext).loaderData.index).toBe(
        "INDEX LOADER"
      );
    });

    it("should handle not found action submissions with a 405 error", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
        },
      ]);
      let request = createSubmitRequest("/");
      let context = await query(request);
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {},
        errors: {
          root: new ErrorResponseImpl(
            405,
            "Method Not Allowed",
            new Error(
              'You made a POST request to "/" but did not provide an `action` ' +
                'for route "root", so there is no way to handle the request.'
            ),
            true
          ),
        },
        matches: [{ route: { id: "root" } }],
      });
    });

    it("should handle unsupported methods with a 405 error", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
        },
      ]);
      let request = createRequest("/", { method: "OPTIONS" });
      let context = await query(request);
      expect(context).toMatchObject({
        actionData: null,
        loaderData: {},
        errors: {
          root: new ErrorResponseImpl(
            405,
            "Method Not Allowed",
            new Error('Invalid request method "OPTIONS"'),
            true
          ),
        },
        matches: [{ route: { id: "root" } }],
      });
    });

    it("should send proper arguments to loaders", async () => {
      let rootLoaderStub = jest.fn(() => "ROOT");
      let childLoaderStub = jest.fn(() => "CHILD");
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          loader: rootLoaderStub,
          children: [
            {
              id: "child",
              path: "child",
              loader: childLoaderStub,
            },
          ],
        },
      ]);
      await query(createRequest("/child"));

      // @ts-expect-error
      let rootLoaderRequest = rootLoaderStub.mock.calls[0][0]?.request;
      // @ts-expect-error
      let childLoaderRequest = childLoaderStub.mock.calls[0][0]?.request;
      expect(rootLoaderRequest.method).toBe("GET");
      expect(rootLoaderRequest.url).toBe("http://localhost/child");
      expect(childLoaderRequest.method).toBe("GET");
      expect(childLoaderRequest.url).toBe("http://localhost/child");
    });

    it("should send proper arguments to actions", async () => {
      let actionStub = jest.fn(() => "ACTION");
      let rootLoaderStub = jest.fn(() => "ROOT");
      let childLoaderStub = jest.fn(() => "CHILD");
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          loader: rootLoaderStub,
          children: [
            {
              id: "child",
              path: "child",
              action: actionStub,
              loader: childLoaderStub,
            },
          ],
        },
      ]);
      await query(
        createSubmitRequest("/child", {
          headers: {
            test: "value",
          },
        })
      );

      // @ts-expect-error
      let actionRequest = actionStub.mock.calls[0][0]?.request;
      expect(actionRequest.method).toBe("POST");
      expect(actionRequest.url).toBe("http://localhost/child");
      expect(actionRequest.headers.get("Content-Type")).toBe(
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      expect((await actionRequest.formData()).get("key")).toBe("value");

      // @ts-expect-error
      let rootLoaderRequest = rootLoaderStub.mock.calls[0][0]?.request;
      // @ts-expect-error
      let childLoaderRequest = childLoaderStub.mock.calls[0][0]?.request;
      expect(rootLoaderRequest.method).toBe("GET");
      expect(rootLoaderRequest.url).toBe("http://localhost/child");
      expect(rootLoaderRequest.headers.get("test")).toBe("value");
      expect(await rootLoaderRequest.text()).toBe("");
      expect(childLoaderRequest.method).toBe("GET");
      expect(childLoaderRequest.url).toBe("http://localhost/child");
      expect(childLoaderRequest.headers.get("test")).toBe("value");
      // Can't re-read body here since it's the same request as the root
    });

    it("should send proper arguments to loaders after an action errors", async () => {
      let actionStub = jest.fn(() => Promise.reject("ACTION ERROR"));
      let rootLoaderStub = jest.fn(() => "ROOT");
      let childLoaderStub = jest.fn(() => "CHILD");
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          loader: rootLoaderStub,
          children: [
            {
              id: "child",
              path: "child",
              action: actionStub,
              loader: childLoaderStub,
              hasErrorBoundary: true,
            },
          ],
        },
      ]);
      await query(
        createSubmitRequest("/child", {
          headers: {
            test: "value",
          },
        })
      );

      // @ts-expect-error
      let actionRequest = actionStub.mock.calls[0][0]?.request;
      expect(actionRequest.method).toBe("POST");
      expect(actionRequest.url).toBe("http://localhost/child");
      expect(actionRequest.headers.get("Content-Type")).toBe(
        "application/x-www-form-urlencoded;charset=UTF-8"
      );
      expect((await actionRequest.formData()).get("key")).toBe("value");

      // @ts-expect-error
      let rootLoaderRequest = rootLoaderStub.mock.calls[0][0]?.request;
      expect(rootLoaderRequest.method).toBe("GET");
      expect(rootLoaderRequest.url).toBe("http://localhost/child");
      expect(rootLoaderRequest.headers.get("test")).toBe("value");
      expect(await rootLoaderRequest.text()).toBe("");
      expect(childLoaderStub).not.toHaveBeenCalled();
    });

    it("should support a requestContext passed to loaders and actions", async () => {
      let requestContext = { sessionId: "12345" };
      let rootStub = jest.fn(() => "ROOT");
      let childStub = jest.fn(() => "CHILD");
      let actionStub = jest.fn(() => "CHILD ACTION");
      let arg = (s) => s.mock.calls[0][0];
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          loader: rootStub,
          children: [
            {
              id: "child",
              path: "child",
              action: actionStub,
              loader: childStub,
            },
          ],
        },
      ]);

      await query(createRequest("/child"), { requestContext });
      expect(arg(rootStub).context.sessionId).toBe("12345");
      expect(arg(childStub).context.sessionId).toBe("12345");

      actionStub.mockClear();
      rootStub.mockClear();
      childStub.mockClear();

      await query(createSubmitRequest("/child"), { requestContext });
      expect(arg(actionStub).context.sessionId).toBe("12345");
      expect(arg(rootStub).context.sessionId).toBe("12345");
      expect(arg(childStub).context.sessionId).toBe("12345");
    });

    describe("deferred", () => {
      let { query } = createStaticHandler(SSR_ROUTES);

      it("should return DeferredData on symbol", async () => {
        let context = (await query(
          createRequest("/parent/deferred")
        )) as StaticHandlerContext;
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise(),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(false),
          },
        });
        await new Promise((r) => setTimeout(r, 10));
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise("lazy"),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(true),
          },
        });
      });

      it("should return rejected DeferredData on symbol", async () => {
        let context = (await query(
          createRequest("/parent/deferred?reject")
        )) as StaticHandlerContext;
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise(),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(false),
          },
        });
        await new Promise((r) => setTimeout(r, 10));
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise(undefined, new Error("broken!")),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(true),
          },
        });
      });

      it("should return rejected DeferredData on symbol for resolved undefined", async () => {
        let context = (await query(
          createRequest("/parent/deferred?undefined")
        )) as StaticHandlerContext;
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise(),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(false),
          },
        });
        await new Promise((r) => setTimeout(r, 10));
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise(
                null,
                new Error(
                  `Deferred data for key "lazy" resolved/rejected with \`undefined\`, you must resolve/reject with a value or \`null\`.`
                )
              ),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(true),
          },
        });
      });

      it("should return DeferredData on symbol with status + headers", async () => {
        let context = (await query(
          createRequest("/parent/deferred?status")
        )) as StaticHandlerContext;
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise(),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(false, 201, {
              "x-custom": "yes",
            }),
          },
        });
        await new Promise((r) => setTimeout(r, 10));
        expect(context).toMatchObject({
          loaderData: {
            parent: "PARENT LOADER",
            deferred: {
              critical: "loader",
              lazy: expect.trackedPromise("lazy"),
            },
          },
          activeDeferreds: {
            deferred: expect.deferredData(true, 201, {
              "x-custom": "yes",
            }),
          },
          statusCode: 201,
          loaderHeaders: {
            deferred: new Headers({ "x-custom": "yes" }),
          },
        });
      });

      it("does not support deferred on submissions", async () => {
        let context = (await query(
          createSubmitRequest("/parent/deferred")
        )) as StaticHandlerContext;
        expect(context.actionData).toEqual(null);
        expect(context.loaderData).toEqual({
          parent: null,
          deferred: null,
        });
        expect(context.activeDeferreds).toEqual(null);
        expect(context.errors).toEqual({
          parent: new ErrorResponseImpl(
            400,
            "Bad Request",
            new Error("defer() is not supported in actions"),
            true
          ),
        });
      });
    });

    describe("statusCode", () => {
      it("should expose a 200 status code by default", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
          },
        ]);
        let context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(context.statusCode).toBe(200);
      });

      it("should expose a 500 status code on loader errors", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => json({ data: "ROOT" }, { status: 201 }),
            children: [
              {
                id: "child",
                index: true,
                loader: () => {
                  throw new Error("💥");
                },
              },
            ],
          },
        ]);
        let context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(context.statusCode).toBe(500);
      });

      it("should expose a 500 status code on action errors", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => json({ data: "ROOT" }, { status: 201 }),
            children: [
              {
                id: "child",
                index: true,
                loader: () => json({ data: "CHILD" }, { status: 202 }),
                action: () => {
                  throw new Error("💥");
                },
              },
            ],
          },
        ]);
        let context = (await query(
          createSubmitRequest("/?index")
        )) as StaticHandlerContext;
        expect(context.statusCode).toBe(500);
      });

      it("should expose a 4xx status code on thrown loader responses", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => json({ data: "ROOT" }, { status: 201 }),
            children: [
              {
                id: "child",
                index: true,
                loader: () => {
                  throw new Response(null, { status: 400 });
                },
              },
            ],
          },
        ]);
        let context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(context.statusCode).toBe(400);
      });

      it("should expose a 4xx status code on thrown action responses", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => json({ data: "ROOT" }, { status: 201 }),
            children: [
              {
                id: "child",
                index: true,
                loader: () => json({ data: "CHILD" }, { status: 202 }),
                action: () => {
                  throw new Response(null, { status: 400 });
                },
              },
            ],
          },
        ]);
        let context = (await query(
          createSubmitRequest("/?index")
        )) as StaticHandlerContext;
        expect(context.statusCode).toBe(400);
      });

      it("should expose the action status on submissions", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => json({ data: "ROOT" }, { status: 201 }),
            children: [
              {
                id: "child",
                index: true,
                loader: () => json({ data: "ROOT" }, { status: 202 }),
                action: () => json({ data: "ROOT" }, { status: 203 }),
              },
            ],
          },
        ]);
        let context = (await query(
          createSubmitRequest("/?index")
        )) as StaticHandlerContext;
        expect(context.statusCode).toBe(203);
      });

      it("should expose the deepest 2xx status", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => json({ data: "ROOT" }, { status: 201 }),
            children: [
              {
                id: "child",
                index: true,
                loader: () => json({ data: "ROOT" }, { status: 202 }),
              },
            ],
          },
        ]);
        let context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(context.statusCode).toBe(202);
      });

      it("should expose the shallowest 4xx/5xx status", async () => {
        let context;
        let query: StaticHandler["query"];

        query = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => {
              throw new Response(null, { status: 400 });
            },
            children: [
              {
                id: "child",
                index: true,
                loader: () => {
                  throw new Response(null, { status: 401 });
                },
              },
            ],
          },
        ]).query;
        context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(context.statusCode).toBe(400);

        query = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => {
              throw new Response(null, { status: 400 });
            },
            children: [
              {
                id: "child",
                index: true,
                loader: () => {
                  throw new Response(null, { status: 500 });
                },
              },
            ],
          },
        ]).query;
        context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(context.statusCode).toBe(400);

        query = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => {
              throw new Response(null, { status: 400 });
            },
            children: [
              {
                id: "child",
                index: true,
                loader: () => {
                  throw new Error("💥");
                },
              },
            ],
          },
        ]).query;
        context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(context.statusCode).toBe(400);
      });
    });

    describe("headers", () => {
      it("should expose headers from action/loader responses", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => new Response(null, { headers: { two: "2" } }),
            children: [
              {
                id: "child",
                index: true,
                action: () => new Response(null, { headers: { one: "1" } }),
                loader: () => new Response(null, { headers: { three: "3" } }),
              },
            ],
          },
        ]);
        let context = (await query(
          createSubmitRequest("/?index")
        )) as StaticHandlerContext;
        expect(Array.from(context.actionHeaders.child.entries())).toEqual([
          ["one", "1"],
        ]);
        expect(Array.from(context.loaderHeaders.root.entries())).toEqual([
          ["two", "2"],
        ]);
        expect(Array.from(context.loaderHeaders.child.entries())).toEqual([
          ["three", "3"],
        ]);
      });

      it("should expose headers from loader error responses", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => new Response(null, { headers: { one: "1" } }),
            children: [
              {
                id: "child",
                index: true,
                loader: () => {
                  throw new Response(null, { headers: { two: "2" } });
                },
              },
            ],
          },
        ]);
        let context = (await query(createRequest("/"))) as StaticHandlerContext;
        expect(Array.from(context.loaderHeaders.root.entries())).toEqual([
          ["one", "1"],
        ]);
        expect(Array.from(context.loaderHeaders.child.entries())).toEqual([
          ["two", "2"],
        ]);
      });

      it("should expose headers from action error responses", async () => {
        let { query } = createStaticHandler([
          {
            id: "root",
            path: "/",
            children: [
              {
                id: "child",
                index: true,
                action: () => {
                  throw new Response(null, { headers: { one: "1" } });
                },
              },
            ],
          },
        ]);
        let context = (await query(
          createSubmitRequest("/?index")
        )) as StaticHandlerContext;
        expect(Array.from(context.actionHeaders.child.entries())).toEqual([
          ["one", "1"],
        ]);
      });
    });

    describe("getStaticContextFromError", () => {
      it("should provide a context for a second-pass render for a thrown error", async () => {
        let { query } = createStaticHandler(SSR_ROUTES);
        let context = await query(createRequest("/"));
        expect(context).toMatchObject({
          errors: null,
          loaderData: {
            index: "INDEX LOADER",
          },
          statusCode: 200,
        });

        let error = new Error("💥");
        invariant(!(context instanceof Response), "Uh oh");
        context = getStaticContextFromError(SSR_ROUTES, context, error);
        expect(context).toMatchObject({
          errors: {
            index: error,
          },
          loaderData: {
            index: "INDEX LOADER",
          },
          statusCode: 500,
        });
      });

      it("should accept a thrown response from entry.server", async () => {
        let { query } = createStaticHandler(SSR_ROUTES);
        let context = await query(createRequest("/"));
        expect(context).toMatchObject({
          errors: null,
          loaderData: {
            index: "INDEX LOADER",
          },
          statusCode: 200,
        });

        let errorResponse = new ErrorResponseImpl(400, "Bad Request", "Oops!");
        invariant(!(context instanceof Response), "Uh oh");
        context = getStaticContextFromError(SSR_ROUTES, context, errorResponse);
        expect(context).toMatchObject({
          errors: {
            index: errorResponse,
          },
          loaderData: {
            index: "INDEX LOADER",
          },
          statusCode: 400,
        });
      });
    });

    describe("router dataStrategy", () => {
      it("should support document load navigations with custom dataStrategy", async () => {
        let { query } = createStaticHandler(SSR_ROUTES);

        let context = await query(createRequest("/custom"), {
          unstable_dataStrategy: urlDataStrategy,
        });
        expect(context).toMatchObject({
          actionData: null,
          loaderData: {
            custom: expect.any(URLSearchParams),
          },
          errors: null,
          location: { pathname: "/custom" },
          matches: [{ route: { id: "custom" } }],
        });
        expect(
          (context as StaticHandlerContext).loaderData.custom.get("foo")
        ).toEqual("bar");
      });
    });
  });

  describe("singular route requests", () => {
    function setupFlexRouteTest() {
      function queryRoute(
        req: Request,
        routeId: string,
        type: "loader" | "action",
        data: any,
        isError = false
      ) {
        let handler = createStaticHandler([
          {
            id: "flex",
            path: "/flex",
            [type]: () =>
              isError ? Promise.reject(data) : Promise.resolve(data),
          },
        ]);
        return handler.queryRoute(req, { routeId });
      }

      return {
        resolveLoader(data: any) {
          return queryRoute(
            createRequest("/flex"),
            "flex",
            "loader",
            data,
            false
          );
        },
        rejectLoader(data: any) {
          return queryRoute(
            createRequest("/flex"),
            "flex",
            "loader",
            data,
            true
          );
        },
        resolveAction(data: any) {
          return queryRoute(
            createSubmitRequest("/flex"),
            "flex",
            "action",
            data,
            false
          );
        },
        rejectAction(data: any) {
          return queryRoute(
            createSubmitRequest("/flex"),
            "flex",
            "action",
            data,
            true
          );
        },
      };
    }

    it("should match routes automatically if no routeId is provided", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);
      let data;

      data = await queryRoute(createRequest("/parent"));
      expect(data).toBe("PARENT LOADER");

      data = await queryRoute(createRequest("/parent?index"));
      expect(data).toBe("PARENT INDEX LOADER");

      data = await queryRoute(createRequest("/parent/child"), {
        routeId: "child",
      });
      expect(data).toBe("CHILD LOADER");
    });

    it("should support HEAD requests", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);
      let data = await queryRoute(createRequest("/parent", { method: "HEAD" }));
      expect(data).toBe("PARENT LOADER");
    });

    it("should support OPTIONS requests", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);
      let data = await queryRoute(
        createRequest("/parent", { method: "OPTIONS" })
      );
      expect(data).toBe("PARENT LOADER");
    });

    it("should support singular route load navigations (primitives)", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);
      let data;

      // Layout route
      data = await queryRoute(createRequest("/parent"), {
        routeId: "parent",
      });
      expect(data).toBe("PARENT LOADER");

      // Index route
      data = await queryRoute(createRequest("/parent"), {
        routeId: "parentIndex",
      });
      expect(data).toBe("PARENT INDEX LOADER");

      // Parent in nested route
      data = await queryRoute(createRequest("/parent/child"), {
        routeId: "parent",
      });
      expect(data).toBe("PARENT LOADER");

      // Child in nested route
      data = await queryRoute(createRequest("/parent/child"), {
        routeId: "child",
      });
      expect(data).toBe("CHILD LOADER");

      // Non-undefined falsey values should count
      let T = setupFlexRouteTest();
      data = await T.resolveLoader(null);
      expect(data).toBeNull();
      data = await T.resolveLoader(false);
      expect(data).toBe(false);
      data = await T.resolveLoader("");
      expect(data).toBe("");
    });

    it("should support singular route load navigations (Responses)", async () => {
      /* eslint-disable jest/no-conditional-expect */
      let T = setupFlexRouteTest();
      let data;

      // When Responses are returned or thrown, it should always resolve the
      // raw Response from queryRoute

      // Returned Success Response
      data = await T.resolveLoader(new Response("Created!", { status: 201 }));
      expect(data.status).toBe(201);
      expect(await data.text()).toBe("Created!");

      // Thrown Success Response
      try {
        await T.rejectLoader(new Response("Created!", { status: 201 }));
        expect(false).toBe(true);
      } catch (data) {
        expect(data.status).toBe(201);
        expect(await data.text()).toBe("Created!");
      }

      // Returned Redirect Response
      data = await T.resolveLoader(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );
      expect(data.status).toBe(302);
      expect(data.headers.get("Location")).toBe("/");

      // Thrown Redirect Response
      data = await T.rejectLoader(
        new Response(null, {
          status: 301,
          headers: { Location: "/" },
        })
      );
      expect(data.status).toBe(301);
      expect(data.headers.get("Location")).toBe("/");

      // Returned Error Response
      data = await T.resolveLoader(new Response("Why?", { status: 400 }));
      expect(data.status).toBe(400);
      expect(await data.text()).toBe("Why?");

      // Thrown Error Response
      try {
        await T.rejectLoader(new Response("Oh no!", { status: 401 }));
        expect(false).toBe(true);
      } catch (data) {
        expect(data.status).toBe(401);
        expect(await data.text()).toBe("Oh no!");
      }
      /* eslint-enable jest/no-conditional-expect */
    });

    it("should support singular route load navigations (Errors)", async () => {
      let T = setupFlexRouteTest();
      let data;

      // Returned Error instance is treated as data since it was not thrown
      data = await T.resolveLoader(new Error("Why?"));
      expect(data).toEqual(new Error("Why?"));

      // Anything thrown (Error instance or not) will throw from queryRoute
      // so we know to handle it as an errorPath in the server.  Generally
      // though in queryRoute, we would expect responses to be coming back -
      // not

      // Thrown Error
      try {
        await T.rejectLoader(new Error("Oh no!"));
      } catch (e) {
        data = e;
      }
      expect(data).toEqual(new Error("Oh no!"));

      // Thrown non-Error
      try {
        await T.rejectLoader("This is weird?");
      } catch (e) {
        data = e;
      }
      expect(data).toEqual("This is weird?");

      // Non-undefined falsey values should count
      try {
        await T.rejectLoader(null);
      } catch (e) {
        data = e;
      }
      expect(data).toBeNull();
      try {
        await T.rejectLoader(false);
      } catch (e) {
        data = e;
      }
      expect(data).toBe(false);
      try {
        await T.rejectLoader("");
      } catch (e) {
        data = e;
      }
      expect(data).toBe("");
    });

    it("should support singular route load navigations (with a basename)", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES, {
        basename: "/base",
      });
      let data;

      // Layout route
      data = await queryRoute(createRequest("/base/parent"), {
        routeId: "parent",
      });
      expect(data).toBe("PARENT LOADER");

      // Index route
      data = await queryRoute(createRequest("/base/parent"), {
        routeId: "parentIndex",
      });
      expect(data).toBe("PARENT INDEX LOADER");

      // Parent in nested route
      data = await queryRoute(createRequest("/base/parent/child"), {
        routeId: "parent",
      });
      expect(data).toBe("PARENT LOADER");

      // Child in nested route
      data = await queryRoute(createRequest("/base/parent/child"), {
        routeId: "child",
      });
      expect(data).toBe("CHILD LOADER");

      // Non-undefined falsey values should count
      let T = setupFlexRouteTest();
      data = await T.resolveLoader(null);
      expect(data).toBeNull();
      data = await T.resolveLoader(false);
      expect(data).toBe(false);
      data = await T.resolveLoader("");
      expect(data).toBe("");
    });

    it("should support singular route submit navigations (primitives)", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);
      let data;

      // Layout route
      data = await queryRoute(createSubmitRequest("/parent"), {
        routeId: "parent",
      });
      expect(data).toBe("PARENT ACTION");

      // Index route
      data = await queryRoute(createSubmitRequest("/parent"), {
        routeId: "parentIndex",
      });
      expect(data).toBe("PARENT INDEX ACTION");

      // Parent in nested route
      data = await queryRoute(createSubmitRequest("/parent/child"), {
        routeId: "parent",
      });
      expect(data).toBe("PARENT ACTION");

      // Child in nested route
      data = await queryRoute(createSubmitRequest("/parent/child"), {
        routeId: "child",
      });
      expect(data).toBe("CHILD ACTION");

      // Non-undefined falsey values should count
      let T = setupFlexRouteTest();
      data = await T.resolveAction(null);
      expect(data).toBeNull();
      data = await T.resolveAction(false);
      expect(data).toBe(false);
      data = await T.resolveAction("");
      expect(data).toBe("");
    });

    it("should support alternative submission methods", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);
      let data;

      data = await queryRoute(
        createSubmitRequest("/parent", { method: "PUT" }),
        { routeId: "parent" }
      );
      expect(data).toBe("PARENT ACTION");

      data = await queryRoute(
        createSubmitRequest("/parent", { method: "PATCH" }),
        { routeId: "parent" }
      );
      expect(data).toBe("PARENT ACTION");

      data = await queryRoute(
        createSubmitRequest("/parent", { method: "DELETE" }),
        { routeId: "parent" }
      );
      expect(data).toBe("PARENT ACTION");
    });

    it("should support singular route submit navigations (Responses)", async () => {
      /* eslint-disable jest/no-conditional-expect */
      let T = setupFlexRouteTest();
      let data;

      // When Responses are returned or thrown, it should always resolve the
      // raw Response from queryRoute

      // Returned Success Response
      data = await T.resolveAction(new Response("Created!", { status: 201 }));
      expect(data.status).toBe(201);
      expect(await data.text()).toBe("Created!");

      // Thrown Success Response
      try {
        await T.rejectAction(new Response("Created!", { status: 201 }));
        expect(false).toBe(true);
      } catch (data) {
        expect(data.status).toBe(201);
        expect(await data.text()).toBe("Created!");
      }

      // Returned Redirect Response
      data = await T.resolveAction(
        new Response(null, {
          status: 302,
          headers: { Location: "/" },
        })
      );
      expect(data.status).toBe(302);
      expect(data.headers.get("Location")).toBe("/");

      // Thrown Redirect Response
      data = await T.rejectAction(
        new Response(null, {
          status: 301,
          headers: { Location: "/" },
        })
      );
      expect(data.status).toBe(301);
      expect(data.headers.get("Location")).toBe("/");

      // Returned Error Response
      data = await T.resolveAction(new Response("Why?", { status: 400 }));
      expect(data.status).toBe(400);
      expect(await data.text()).toBe("Why?");

      // Thrown Error Response
      try {
        await T.rejectAction(new Response("Oh no!", { status: 401 }));
        expect(false).toBe(true);
      } catch (data) {
        expect(data.status).toBe(401);
        expect(await data.text()).toBe("Oh no!");
      }
      /* eslint-enable jest/no-conditional-expect */
    });

    it("should support singular route submit navigations (Errors)", async () => {
      let T = setupFlexRouteTest();
      let data;

      // Returned Error instance is treated as data since it was not thrown
      data = await T.resolveAction(new Error("Why?"));
      expect(data).toEqual(new Error("Why?"));

      // Anything thrown (Error instance or not) will throw from queryRoute
      // so we know to handle it as an errorPath in the server.  Generally
      // though in queryRoute, we would expect responses to be coming back -
      // not

      // Thrown Error
      try {
        await T.rejectAction(new Error("Oh no!"));
      } catch (e) {
        data = e;
      }
      expect(data).toEqual(new Error("Oh no!"));

      // Thrown non-Error
      try {
        await T.rejectAction("This is weird?");
      } catch (e) {
        data = e;
      }
      expect(data).toEqual("This is weird?");

      // Non-undefined falsey values should count
      try {
        await T.rejectAction(null);
      } catch (e) {
        data = e;
      }
      expect(data).toBeNull();
      try {
        await T.rejectAction(false);
      } catch (e) {
        data = e;
      }
      expect(data).toBe(false);
      try {
        await T.rejectAction("");
      } catch (e) {
        data = e;
      }
      expect(data).toBe("");
    });

    it("should error if an action/loader returns undefined", async () => {
      let T = setupFlexRouteTest();
      let data;

      try {
        data = await T.resolveLoader(undefined);
      } catch (e) {
        data = e;
      }
      expect(data).toEqual(
        new Error(
          'You defined a loader for route "flex" but didn\'t return anything ' +
            "from your `loader` function. Please return a value or `null`."
        )
      );

      try {
        data = await T.resolveAction(undefined);
      } catch (e) {
        data = e;
      }
      expect(data).toEqual(
        new Error(
          'You defined an action for route "flex" but didn\'t return anything ' +
            "from your `action` function. Please return a value or `null`."
        )
      );
    });

    it("should handle relative redirect responses (loader)", async () => {
      let { queryRoute } = createStaticHandler([
        {
          path: "/",
          children: [
            {
              path: "parent",
              children: [
                {
                  id: "child",
                  path: "child",
                  loader: () => redirect(".."),
                },
              ],
            },
          ],
        },
      ]);
      let response = await queryRoute(createRequest("/parent/child"), {
        routeId: "child",
      });
      expect(response instanceof Response).toBe(true);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get("Location")).toBe("/parent");
    });

    it("should handle relative redirect responses (action)", async () => {
      let { queryRoute } = createStaticHandler([
        {
          path: "/",
          children: [
            {
              path: "parent",
              children: [
                {
                  id: "child",
                  path: "child",
                  action: () => redirect(".."),
                },
              ],
            },
          ],
        },
      ]);
      let response = await queryRoute(createSubmitRequest("/parent/child"), {
        routeId: "child",
      });
      expect(response instanceof Response).toBe(true);
      expect((response as Response).status).toBe(302);
      expect((response as Response).headers.get("Location")).toBe("/parent");
    });

    it("should handle absolute redirect Responses", async () => {
      for (let url of ABSOLUTE_URLS) {
        let handler = createStaticHandler([
          {
            id: "root",
            path: "/",
            loader: () => redirect(url),
          },
        ]);
        let response = await handler.queryRoute(createRequest("/"), {
          routeId: "root",
        });
        expect(response instanceof Response).toBe(true);
        expect((response as Response).status).toBe(302);
        expect((response as Response).headers.get("Location")).toBe(url);
      }
    });

    it("should not unwrap responses returned from loaders", async () => {
      let response = json({ key: "value" });
      let { queryRoute } = createStaticHandler([
        {
          id: "root",
          path: "/",
          loader: () => Promise.resolve(response),
        },
      ]);
      let request = createRequest("/");
      let data = await queryRoute(request, { routeId: "root" });
      expect(data instanceof Response).toBe(true);
      expect(await data.json()).toEqual({ key: "value" });
    });

    it("should not unwrap responses returned from actions", async () => {
      let response = json({ key: "value" });
      let { queryRoute } = createStaticHandler([
        {
          id: "root",
          path: "/",
          action: () => Promise.resolve(response),
        },
      ]);
      let request = createSubmitRequest("/");
      let data = await queryRoute(request, { routeId: "root" });
      expect(data instanceof Response).toBe(true);
      expect(await data.json()).toEqual({ key: "value" });
    });

    it("should not unwrap responses thrown from loaders", async () => {
      let response = json({ key: "value" });
      let { queryRoute } = createStaticHandler([
        {
          id: "root",
          path: "/",
          loader: () => Promise.reject(response),
        },
      ]);
      let request = createRequest("/");
      let data;
      try {
        await queryRoute(request, { routeId: "root" });
      } catch (e) {
        data = e;
      }
      expect(data instanceof Response).toBe(true);
      expect(await data.json()).toEqual({ key: "value" });
    });

    it("should not unwrap responses thrown from actions", async () => {
      let response = json({ key: "value" });
      let { queryRoute } = createStaticHandler([
        {
          id: "root",
          path: "/",
          action: () => Promise.reject(response),
        },
      ]);
      let request = createSubmitRequest("/");
      let data;
      try {
        await queryRoute(request, { routeId: "root" });
      } catch (e) {
        data = e;
      }
      expect(data instanceof Response).toBe(true);
      expect(await data.json()).toEqual({ key: "value" });
    });

    it("should handle aborted load requests", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { queryRoute } = createStaticHandler([
        {
          id: "root",
          path: "/path",
          loader: () => dfd.promise,
        },
      ]);
      let request = createRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let statePromise = queryRoute(request, { routeId: "root" });
        controller.abort();
        // This should resolve even though we never resolved the loader
        await statePromise;
      } catch (_e) {
        e = _e;
      }
      expect(e).toMatchInlineSnapshot(
        `[Error: queryRoute() call aborted: GET http://localhost/path?key=value]`
      );
    });

    it("should handle aborted submit requests", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { queryRoute } = createStaticHandler([
        {
          id: "root",
          path: "/path",
          action: () => dfd.promise,
        },
      ]);
      let request = createSubmitRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let statePromise = queryRoute(request, { routeId: "root" });
        controller.abort();
        // This should resolve even though we never resolved the loader
        await statePromise;
      } catch (_e) {
        e = _e;
      }
      expect(e).toMatchInlineSnapshot(
        `[Error: queryRoute() call aborted: POST http://localhost/path?key=value]`
      );
    });

    it("should handle aborted load requests (v7_throwAbortReason=true)", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { queryRoute } = createStaticHandler(
        [
          {
            id: "root",
            path: "/path",
            loader: () => dfd.promise,
          },
        ],
        { future: { v7_throwAbortReason: true } }
      );
      let request = createRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let statePromise = queryRoute(request, { routeId: "root" });
        controller.abort();
        // This should resolve even though we never resolved the loader
        await statePromise;
      } catch (_e) {
        e = _e;
      }
      // DOMException added in node 17
      if (process.versions.node.split(".").map(Number)[0] >= 17) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toBeInstanceOf(DOMException);
      }
      expect(e.name).toBe("AbortError");
      expect(e.message).toBe("This operation was aborted");
    });

    it("should handle aborted submit requests (v7_throwAbortReason=true)", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { queryRoute } = createStaticHandler(
        [
          {
            id: "root",
            path: "/path",
            action: () => dfd.promise,
          },
        ],
        { future: { v7_throwAbortReason: true } }
      );
      let request = createSubmitRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let statePromise = queryRoute(request, { routeId: "root" });
        controller.abort();
        // This should resolve even though we never resolved the loader
        await statePromise;
      } catch (_e) {
        e = _e;
      }
      // DOMException added in node 17
      if (process.versions.node.split(".").map(Number)[0] >= 17) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e).toBeInstanceOf(DOMException);
      }
      expect(e.name).toBe("AbortError");
      expect(e.message).toBe("This operation was aborted");
    });

    it("should handle aborted load requests (v7_throwAbortReason=true + custom reason)", async () => {
      let dfd = createDeferred();
      let controller = new AbortController();
      let { queryRoute } = createStaticHandler(
        [
          {
            id: "root",
            path: "/path",
            loader: () => dfd.promise,
          },
        ],
        { future: { v7_throwAbortReason: true } }
      );
      let request = createRequest("/path?key=value", {
        signal: controller.signal,
      });
      let e;
      try {
        let statePromise = queryRoute(request, { routeId: "root" });
        // Note this works in Node 18+ - but it does not work if using the
        // `abort-controller` polyfill which doesn't yet support a custom `reason`
        // See: https://github.com/mysticatea/abort-controller/issues/33
        controller.abort(new Error("Oh no!"));
        // This should resolve even though we never resolved the loader
        await statePromise;
      } catch (_e) {
        e = _e;
      }
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe("Oh no!");
    });

    it("should assign signals to requests by default (per the spec)", async () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);
      let request = createRequest("/", { signal: undefined });
      let data = await queryRoute(request, { routeId: "index" });
      expect(data).toBe("INDEX LOADER");
    });

    it("should support a requestContext passed to loaders and actions", async () => {
      let requestContext = { sessionId: "12345" };
      let childStub = jest.fn(() => "CHILD");
      let actionStub = jest.fn(() => "CHILD ACTION");
      let arg = (s) => s.mock.calls[0][0];
      let { queryRoute } = createStaticHandler([
        {
          path: "/",
          children: [
            {
              id: "child",
              path: "child",
              action: actionStub,
              loader: childStub,
            },
          ],
        },
      ]);

      await queryRoute(createRequest("/child"), {
        routeId: "child",
        requestContext,
      });
      expect(arg(childStub).context.sessionId).toBe("12345");

      await queryRoute(createSubmitRequest("/child"), {
        routeId: "child",
        requestContext,
      });
      expect(arg(actionStub).context.sessionId).toBe("12345");
    });

    describe("deferred", () => {
      let { queryRoute } = createStaticHandler(SSR_ROUTES);

      it("should return DeferredData on symbol", async () => {
        let result = await queryRoute(createRequest("/parent/deferred"));
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise(),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(false);
        await new Promise((r) => setTimeout(r, 10));
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise("lazy"),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(true);
      });

      it("should return rejected DeferredData on symbol", async () => {
        let result = await queryRoute(createRequest("/parent/deferred?reject"));
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise(),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(false);
        await new Promise((r) => setTimeout(r, 10));
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise(null, new Error("broken!")),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(true);
      });

      it("should return rejected DeferredData on symbol for resolved undefined", async () => {
        let result = await queryRoute(
          createRequest("/parent/deferred?undefined")
        );
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise(),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(false);
        await new Promise((r) => setTimeout(r, 10));
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise(
            null,
            new Error(
              `Deferred data for key "lazy" resolved/rejected with \`undefined\`, you must resolve/reject with a value or \`null\`.`
            )
          ),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(true);
      });

      it("should return DeferredData on symbol with status + headers", async () => {
        let result = await queryRoute(createRequest("/parent/deferred?status"));
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise(),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(false, 201, {
          "x-custom": "yes",
        });
        await new Promise((r) => setTimeout(r, 10));
        expect(result).toMatchObject({
          critical: "loader",
          lazy: expect.trackedPromise("lazy"),
        });
        expect(result[UNSAFE_DEFERRED_SYMBOL]).deferredData(true, 201, {
          "x-custom": "yes",
        });
      });

      it("does not support deferred on submissions", async () => {
        try {
          await queryRoute(createSubmitRequest("/parent/deferred"));
          expect(false).toBe(true);
        } catch (e) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(e).toEqual(
            new ErrorResponseImpl(
              400,
              "Bad Request",
              new Error("defer() is not supported in actions"),
              true
            )
          );
        }
      });
    });

    describe("Errors with Status Codes", () => {
      /* eslint-disable jest/no-conditional-expect */
      let { queryRoute } = createStaticHandler([
        {
          id: "root",
          path: "/",
        },
      ]);

      it("should handle not found paths with a 404 Response", async () => {
        try {
          await queryRoute(createRequest("/junk"));
          expect(false).toBe(true);
        } catch (data) {
          expect(isRouteErrorResponse(data)).toBe(true);
          expect(data.status).toBe(404);
          expect(data.error).toEqual(new Error('No route matches URL "/junk"'));
          expect(data.internal).toBe(true);
        }

        try {
          await queryRoute(createSubmitRequest("/junk"));
          expect(false).toBe(true);
        } catch (data) {
          expect(isRouteErrorResponse(data)).toBe(true);
          expect(data.status).toBe(404);
          expect(data.error).toEqual(new Error('No route matches URL "/junk"'));
          expect(data.internal).toBe(true);
        }
      });

      it("should handle not found routeIds with a 403 Response", async () => {
        try {
          await queryRoute(createRequest("/"), { routeId: "junk" });
          expect(false).toBe(true);
        } catch (data) {
          expect(isRouteErrorResponse(data)).toBe(true);
          expect(data.status).toBe(403);
          expect(data.error).toEqual(
            new Error('Route "junk" does not match URL "/"')
          );
          expect(data.internal).toBe(true);
        }

        try {
          await queryRoute(createSubmitRequest("/"), { routeId: "junk" });
          expect(false).toBe(true);
        } catch (data) {
          expect(isRouteErrorResponse(data)).toBe(true);
          expect(data.status).toBe(403);
          expect(data.error).toEqual(
            new Error('Route "junk" does not match URL "/"')
          );
          expect(data.internal).toBe(true);
        }
      });

      it("should handle missing loaders with a 400 Response", async () => {
        try {
          await queryRoute(createRequest("/"), { routeId: "root" });
          expect(false).toBe(true);
        } catch (data) {
          expect(isRouteErrorResponse(data)).toBe(true);
          expect(data.status).toBe(400);
          expect(data.error).toEqual(
            new Error(
              'You made a GET request to "/" but did not provide a `loader` ' +
                'for route "root", so there is no way to handle the request.'
            )
          );
          expect(data.internal).toBe(true);
        }
      });

      it("should handle missing actions with a 405 Response", async () => {
        try {
          await queryRoute(createSubmitRequest("/"), { routeId: "root" });
          expect(false).toBe(true);
        } catch (data) {
          expect(isRouteErrorResponse(data)).toBe(true);
          expect(data.status).toBe(405);
          expect(data.error).toEqual(
            new Error(
              'You made a POST request to "/" but did not provide an `action` ' +
                'for route "root", so there is no way to handle the request.'
            )
          );
          expect(data.internal).toBe(true);
        }
      });

      it("should handle unsupported methods with a 405 Response", async () => {
        try {
          await queryRoute(createRequest("/", { method: "CHICKEN" }), {
            routeId: "root",
          });
          expect(false).toBe(true);
        } catch (data) {
          expect(isRouteErrorResponse(data)).toBe(true);
          expect(data.status).toBe(405);
          expect(data.error).toEqual(
            new Error('Invalid request method "CHICKEN"')
          );
          expect(data.internal).toBe(true);
        }
      });

      /* eslint-enable jest/no-conditional-expect */
    });

    describe("router dataStrategy", () => {
      it("should apply a custom data strategy", async () => {
        let { queryRoute } = createStaticHandler(SSR_ROUTES);
        let data;

        data = await queryRoute(createRequest("/custom"), {
          unstable_dataStrategy: urlDataStrategy,
        });
        expect(data).toBeInstanceOf(URLSearchParams);
        expect((data as URLSearchParams).get("foo")).toBe("bar");
      });
    });
  });
});
