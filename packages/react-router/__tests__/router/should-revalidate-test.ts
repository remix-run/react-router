import { createMemoryHistory, createRouter, redirect } from "../index";
import type { ShouldRevalidateFunctionArgs } from "../utils";
import { ErrorResponseImpl } from "../utils";
import { urlMatch } from "./utils/custom-matchers";
import { cleanup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

interface CustomMatchers {
  urlMatch(url: string);
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers extends CustomMatchers {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend({
  urlMatch,
});

describe("shouldRevalidate", () => {
  afterEach(() => cleanup());

  it("provides a default implementation", async () => {
    let rootLoader = jest.fn((args) => "ROOT");

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          loader: async (...args) => rootLoader(...args),
          children: [
            {
              path: "/",
              id: "index",
            },
            {
              path: "/child",
              action: async () => null,
            },
            {
              path: "/redirect",
              action: async () =>
                new Response(null, {
                  status: 301,
                  headers: { location: "/" },
                }),
            },
            {
              path: "/cookie",
              loader: async () =>
                new Response(null, {
                  status: 301,
                  headers: {
                    location: "/",
                    "X-Remix-Revalidate": "1",
                  },
                }),
            },
          ],
        },
      ],
    });
    router.initialize();

    // Initial load - no existing data, should always call loader
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should not re-run on normal navigations re-using the loader
    router.navigate("/child");
    await tick();
    router.navigate("/");
    await tick();
    router.navigate("/child");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(0);
    rootLoader.mockClear();

    // Should call on same-path navigations
    router.navigate("/child");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call on query string changes
    router.navigate("/child?key=value");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call after form submission revalidation
    router.navigate("/child", {
      formMethod: "post",
      formData: createFormData({ gosh: "dang" }),
    });
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call after form submission redirect
    router.navigate("/redirect", {
      formMethod: "post",
      formData: createFormData({ gosh: "dang" }),
    });
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call after loader redirect with X-Remix-Revalidate
    router.navigate("/cookie");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    router.dispose();
  });

  it("delegates to the route if it should reload or not", async () => {
    let rootLoader = jest.fn((args) => "ROOT");
    let childLoader = jest.fn((args) => "CHILD");
    let paramsLoader = jest.fn((args) => "PARAMS");
    let shouldRevalidate = jest.fn((args) => false);

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          id: "root",
          loader: async (...args) => rootLoader(...args),
          shouldRevalidate: (args) => shouldRevalidate(args) === true,

          children: [
            {
              path: "/",
              id: "index",
            },
            {
              path: "/child",
              id: "child",
              loader: async (...args) => childLoader(...args),
              action: async () => ({ ok: false }),
            },
            {
              path: "/params/:a/:b",
              id: "params",
              loader: async (...args) => paramsLoader(...args),
            },
          ],
        },
      ],
    });
    router.initialize();

    // Initial load - no existing data, should always call loader and should
    // not give use ability to opt-out
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    expect(shouldRevalidate.mock.calls.length).toBe(0);
    rootLoader.mockClear();
    shouldRevalidate.mockClear();

    // Should not re-run on normal navigations re-using the loader
    router.navigate("/child");
    await tick();
    router.navigate("/");
    await tick();
    router.navigate("/child");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(0);
    expect(shouldRevalidate.mock.calls.length).toBe(3);
    rootLoader.mockClear();
    shouldRevalidate.mockClear();

    // Check that we pass the right args to shouldRevalidate and respect it's answer
    shouldRevalidate.mockImplementation(() => true);
    router.navigate("/params/aValue/bValue");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    let expectedArg: ShouldRevalidateFunctionArgs = {
      currentParams: {},
      currentUrl: expect.urlMatch("http://localhost/child"),
      nextParams: {
        a: "aValue",
        b: "bValue",
      },
      nextUrl: expect.urlMatch("http://localhost/params/aValue/bValue"),
      defaultShouldRevalidate: false,
      actionResult: undefined,
    };
    expect(shouldRevalidate.mock.calls[0][0]).toMatchObject(expectedArg);
    rootLoader.mockClear();
    shouldRevalidate.mockClear();

    // On actions we send along the action result
    shouldRevalidate.mockImplementation(
      ({ actionResult }) => actionResult.ok === true
    );
    router.navigate("/child", {
      formMethod: "post",
      formData: createFormData({}),
    });
    await tick();
    expect(rootLoader.mock.calls.length).toBe(0);

    router.dispose();
  });

  it("includes submissions on actions that return data", async () => {
    let shouldRevalidate = jest.fn(() => true);

    let history = createMemoryHistory({ initialEntries: ["/child"] });
    let router = createRouter({
      history,
      routes: [
        {
          path: "/",
          id: "root",
          loader: () => "ROOT",
          shouldRevalidate,
          children: [
            {
              path: "child",
              id: "child",
              loader: () => "CHILD",
              action: () => "ACTION",
            },
          ],
        },
      ],
    });
    router.initialize();

    // Initial load - no existing data, should always call loader and should
    // not give use ability to opt-out
    await tick();
    router.navigate("/child", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await tick();
    expect(shouldRevalidate.mock.calls.length).toBe(1);
    // @ts-expect-error
    let arg = shouldRevalidate.mock.calls[0][0];
    let expectedArg: ShouldRevalidateFunctionArgs = {
      currentParams: {},
      currentUrl: expect.urlMatch("http://localhost/child"),
      nextParams: {},
      nextUrl: expect.urlMatch("http://localhost/child"),
      defaultShouldRevalidate: true,
      formMethod: "post",
      formAction: "/child",
      formEncType: "application/x-www-form-urlencoded",
      actionResult: "ACTION",
    };
    expect(arg).toMatchObject(expectedArg);
    // @ts-expect-error
    expect(Object.fromEntries(arg.formData)).toEqual({ key: "value" });

    router.dispose();
  });

  it("includes submission on actions that return redirects", async () => {
    let shouldRevalidate = jest.fn(() => true);

    let history = createMemoryHistory({ initialEntries: ["/child"] });
    let router = createRouter({
      history,
      routes: [
        {
          path: "/",
          id: "root",
          loader: () => "ROOT",
          shouldRevalidate,
          children: [
            {
              path: "child",
              id: "child",
              loader: () => "CHILD",
              action: () => redirect("/"),
            },
          ],
        },
      ],
    });
    router.initialize();

    // Initial load - no existing data, should always call loader and should
    // not give use ability to opt-out
    await tick();
    router.navigate("/child", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await tick();
    expect(shouldRevalidate.mock.calls.length).toBe(1);
    // @ts-expect-error
    let arg = shouldRevalidate.mock.calls[0][0];
    let expectedArg: ShouldRevalidateFunctionArgs = {
      currentParams: {},
      currentUrl: expect.urlMatch("http://localhost/child"),
      nextParams: {},
      nextUrl: expect.urlMatch("http://localhost/"),
      defaultShouldRevalidate: true,
      formMethod: "post",
      formAction: "/child",
      formEncType: "application/x-www-form-urlencoded",
      actionResult: undefined,
    };
    expect(arg).toMatchObject(expectedArg);
    // @ts-expect-error
    expect(Object.fromEntries(arg.formData)).toEqual({ key: "value" });

    router.dispose();
  });

  it("includes submissions and acton status on actions that return Responses", async () => {
    let shouldRevalidate = jest.fn(() => true);

    let history = createMemoryHistory({ initialEntries: ["/child"] });
    let router = createRouter({
      history,
      routes: [
        {
          path: "/",
          id: "root",
          loader: () => "ROOT",
          shouldRevalidate,
          children: [
            {
              path: "child",
              id: "child",
              loader: () => "CHILD",
              action: () => new Response("ACTION", { status: 201 }),
            },
          ],
        },
      ],
    });
    router.initialize();

    // Initial load - no existing data, should always call loader and should
    // not give use ability to opt-out
    await tick();
    router.navigate("/child", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await tick();
    expect(shouldRevalidate.mock.calls.length).toBe(1);
    // @ts-expect-error
    let arg = shouldRevalidate.mock.calls[0][0];
    let expectedArg: ShouldRevalidateFunctionArgs = {
      currentParams: {},
      currentUrl: expect.urlMatch("http://localhost/child"),
      nextParams: {},
      nextUrl: expect.urlMatch("http://localhost/child"),
      defaultShouldRevalidate: true,
      formMethod: "post",
      formAction: "/child",
      formEncType: "application/x-www-form-urlencoded",
      actionResult: "ACTION",
      unstable_actionStatus: 201,
    };
    expect(arg).toMatchObject(expectedArg);
    // @ts-expect-error
    expect(Object.fromEntries(arg.formData)).toEqual({ key: "value" });

    router.dispose();
  });

  it("includes json submissions", async () => {
    let shouldRevalidate = jest.fn(() => true);

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "/",
          id: "root",
          loader: () => "ROOT*",
          action: () => "ACTION",
          shouldRevalidate,
        },
      ],
      hydrationData: { loaderData: { root: "ROOT" } },
    }).initialize();

    await tick();
    router.navigate(null, {
      formMethod: "post",
      formEncType: "application/json",
      body: { key: "value" },
    });
    await tick();
    expect(shouldRevalidate.mock.calls.length).toBe(1);
    // @ts-expect-error
    let arg = shouldRevalidate.mock.calls[0][0];
    let expectedArg: Partial<ShouldRevalidateFunctionArgs> = {
      formMethod: "post",
      formAction: "/",
      formEncType: "application/json",
      text: undefined,
      formData: undefined,
      json: { key: "value" },
      actionResult: "ACTION",
    };
    expect(arg).toMatchObject(expectedArg);

    router.dispose();
  });

  it("includes text submissions", async () => {
    let shouldRevalidate = jest.fn(() => true);

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "/",
          id: "root",
          loader: () => "ROOT*",
          action: () => "ACTION",
          shouldRevalidate,
        },
      ],
      hydrationData: { loaderData: { root: "ROOT" } },
    }).initialize();

    await tick();
    router.navigate(null, {
      formMethod: "post",
      formEncType: "text/plain",
      body: "hello world",
    });
    await tick();
    expect(shouldRevalidate.mock.calls.length).toBe(1);
    // @ts-expect-error
    let arg = shouldRevalidate.mock.calls[0][0];
    let expectedArg: Partial<ShouldRevalidateFunctionArgs> = {
      formMethod: "post",
      formAction: "/",
      formEncType: "text/plain",
      text: "hello world",
      formData: undefined,
      json: undefined,
      actionResult: "ACTION",
    };
    expect(arg).toMatchObject(expectedArg);

    router.dispose();
  });

  it("provides the default implementation to the route function", async () => {
    let rootLoader = jest.fn((args) => "ROOT");

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          loader: async (...args) => rootLoader(...args),
          shouldRevalidate: ({ defaultShouldRevalidate }) =>
            defaultShouldRevalidate,
          children: [
            {
              path: "/",
              id: "index",
            },
            {
              path: "/child",
              action: async () => null,
            },
            {
              path: "/redirect",
              action: async () =>
                new Response(null, {
                  status: 301,
                  headers: { location: "/" },
                }),
            },
            {
              path: "/cookie",
              loader: async () =>
                new Response(null, {
                  status: 301,
                  headers: {
                    location: "/",
                    "X-Remix-Revalidate": "1",
                  },
                }),
            },
          ],
        },
      ],
    });
    router.initialize();

    // Initial load - no existing data, should always call loader
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should not re-run on normal navigations re-using the loader
    router.navigate("/child");
    await tick();
    router.navigate("/");
    await tick();
    router.navigate("/child");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(0);
    rootLoader.mockClear();

    // Should call on same-path navigations
    router.navigate("/child");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call on query string changes
    router.navigate("/child?key=value");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call after form submission revalidation
    router.navigate("/child", {
      formMethod: "post",
      formData: createFormData({ gosh: "dang" }),
    });
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call after form submission redirect
    router.navigate("/redirect", {
      formMethod: "post",
      formData: createFormData({ gosh: "dang" }),
    });
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    // Should call after loader redirect with X-Remix-Revalidate
    router.navigate("/cookie");
    await tick();
    expect(rootLoader.mock.calls.length).toBe(1);
    rootLoader.mockClear();

    router.dispose();
  });

  it("applies to fetcher loads", async () => {
    let count = 0;
    let fetchLoader = jest.fn((args) => `FETCH ${++count}`);
    let shouldRevalidate = jest.fn((args) => false);

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          id: "root",

          children: [
            {
              path: "/",
              id: "index",
            },
            {
              path: "/child",
              id: "child",
            },
            {
              path: "/fetch",
              id: "fetch",
              loader: async (...args) => fetchLoader(...args),
              shouldRevalidate: (args) => shouldRevalidate(args) === true,
            },
          ],
        },
      ],
    });
    router.initialize();
    await tick();

    let key = "key";
    router.fetch(key, "root", "/fetch");
    await tick();
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "FETCH 1",
    });
    expect(shouldRevalidate.mock.calls.length).toBe(0);

    // Normal navigations should trigger fetcher shouldRevalidate with
    // defaultShouldRevalidate=false
    router.navigate("/child");
    await tick();
    expect(shouldRevalidate.mock.calls.length).toBe(1);
    expect(shouldRevalidate.mock.calls[0][0]).toMatchObject({
      currentParams: {},
      currentUrl: expect.urlMatch("http://localhost/"),
      nextParams: {},
      nextUrl: expect.urlMatch("http://localhost/child"),
      defaultShouldRevalidate: false,
    });
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "FETCH 1",
    });

    router.navigate("/");
    await tick();
    expect(shouldRevalidate.mock.calls.length).toBe(2);
    expect(shouldRevalidate.mock.calls[1][0]).toMatchObject({
      currentParams: {},
      currentUrl: expect.urlMatch("http://localhost/child"),
      nextParams: {},
      nextUrl: expect.urlMatch("http://localhost/"),
      defaultShouldRevalidate: false,
    });
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "FETCH 1",
    });

    // Submission navigations should trigger fetcher shouldRevalidate with
    // defaultShouldRevalidate=true
    router.navigate("/child", {
      formMethod: "post",
      formData: createFormData({}),
    });
    await tick();
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "FETCH 1",
    });
    expect(shouldRevalidate.mock.calls.length).toBe(3);
    expect(shouldRevalidate.mock.calls[2][0]).toMatchObject({
      currentParams: {},
      currentUrl: expect.urlMatch("http://localhost/"),
      nextParams: {},
      nextUrl: expect.urlMatch("http://localhost/child"),
      formAction: "/child",
      formData: createFormData({}),
      formEncType: "application/x-www-form-urlencoded",
      formMethod: "post",
      defaultShouldRevalidate: true,
    });

    router.dispose();
  });

  it("applies to fetcher submissions and sends fetcher actionResult through", async () => {
    let shouldRevalidate = jest.fn((args) => true);

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          id: "root",

          children: [
            {
              path: "/",
              id: "index",
              loader: () => "INDEX",
              shouldRevalidate,
            },
            {
              path: "/fetch",
              id: "fetch",
              action: () => "FETCH",
            },
          ],
        },
      ],
    });
    router.initialize();
    await tick();

    let key = "key";
    router.fetch(key, "root", "/fetch", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await tick();
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "FETCH",
    });

    let arg = shouldRevalidate.mock.calls[0][0];
    expect(arg).toMatchInlineSnapshot(`
      {
        "actionResult": "FETCH",
        "currentParams": {},
        "currentUrl": "http://localhost/",
        "defaultShouldRevalidate": true,
        "formAction": "/fetch",
        "formData": FormData {},
        "formEncType": "application/x-www-form-urlencoded",
        "formMethod": "post",
        "json": undefined,
        "nextParams": {},
        "nextUrl": "http://localhost/",
        "text": undefined,
        "unstable_actionStatus": undefined,
      }
    `);
    expect(Object.fromEntries(arg.formData)).toEqual({ key: "value" });

    router.dispose();
  });

  it("applies to fetcher submissions when action redirects", async () => {
    let shouldRevalidate = jest.fn((args) => true);

    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          id: "root",

          children: [
            {
              path: "/",
              id: "index",
              loader: () => "INDEX",
              shouldRevalidate,
            },
            {
              path: "/fetch",
              id: "fetch",
              action: () => redirect("/"),
            },
          ],
        },
      ],
    });
    router.initialize();
    await tick();

    let key = "key";
    router.fetch(key, "root", "/fetch", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await tick();
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: undefined,
    });

    let arg = shouldRevalidate.mock.calls[0][0];
    expect(arg).toMatchInlineSnapshot(`
      {
        "actionResult": undefined,
        "currentParams": {},
        "currentUrl": "http://localhost/",
        "defaultShouldRevalidate": true,
        "formAction": "/fetch",
        "formData": FormData {},
        "formEncType": "application/x-www-form-urlencoded",
        "formMethod": "post",
        "json": undefined,
        "nextParams": {},
        "nextUrl": "http://localhost/",
        "text": undefined,
        "unstable_actionStatus": undefined,
      }
    `);

    router.dispose();
  });

  it("preserves non-revalidated loaderData on navigations", async () => {
    let count = 0;
    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          id: "root",
          loader: () => `ROOT ${++count}`,

          children: [
            {
              path: "/",
              id: "index",
              loader: (args) => "SHOULD NOT GET CALLED",
              shouldRevalidate: () => false,
            },
          ],
        },
      ],
      hydrationData: {
        loaderData: {
          root: "ROOT 0",
          index: "INDEX",
        },
      },
    });
    router.initialize();
    await tick();

    // Navigating to the same link would normally cause all loaders to re-run
    router.navigate("/");
    await tick();
    expect(router.state.loaderData).toEqual({
      root: "ROOT 1",
      index: "INDEX",
    });

    router.navigate("/");
    await tick();
    expect(router.state.loaderData).toEqual({
      root: "ROOT 2",
      index: "INDEX",
    });

    router.dispose();
  });

  it("preserves non-revalidated loaderData on fetches", async () => {
    let count = 0;
    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          id: "root",

          children: [
            {
              path: "/",
              id: "index",
              loader: () => "SHOULD NOT GET CALLED",
              shouldRevalidate: () => false,
            },
            {
              path: "/fetch",
              id: "fetch",
              action: () => `FETCH ${++count}`,
            },
          ],
        },
      ],
      hydrationData: {
        loaderData: {
          index: "INDEX",
        },
      },
    });
    router.initialize();
    await tick();

    let key = "key";

    router.fetch(key, "root", "/fetch", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await tick();
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "FETCH 1",
    });
    expect(router.state.loaderData).toMatchObject({
      index: "INDEX",
    });

    router.fetch(key, "root", "/fetch", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await tick();
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "FETCH 2",
    });
    expect(router.state.loaderData).toMatchObject({
      index: "INDEX",
    });

    router.dispose();
  });

  it("requires an explicit false return value to override default true behavior", async () => {
    let count = 0;
    let returnValue = true;
    let history = createMemoryHistory();
    let router = createRouter({
      history,
      routes: [
        {
          path: "",
          id: "root",
          loader: () => ++count,
          shouldRevalidate: () => returnValue,
        },
      ],
      hydrationData: {
        loaderData: {
          root: 0,
        },
      },
    });
    router.initialize();

    await tick();
    expect(router.state.loaderData).toEqual({
      root: 0,
    });

    router.revalidate();
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 1,
    });

    // @ts-expect-error
    returnValue = undefined;
    router.revalidate();
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 2,
    });

    // @ts-expect-error
    returnValue = null;
    router.revalidate();
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 3,
    });

    // @ts-expect-error
    returnValue = "";
    router.revalidate();
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 4,
    });

    returnValue = false;
    router.revalidate();
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 4, // No revalidation
    });

    router.dispose();
  });

  it("requires an explicit true return value to override default false behavior", async () => {
    let count = 0;
    let returnValue = false;
    let history = createMemoryHistory({ initialEntries: ["/a"] });
    let router = createRouter({
      history,
      routes: [
        {
          path: "/",
          id: "root",
          loader: () => ++count,
          shouldRevalidate: () => returnValue,

          children: [
            {
              path: "a",
              id: "a",
            },
            {
              path: "b",
              id: "b",
            },
          ],
        },
      ],
      hydrationData: {
        loaderData: {
          root: 0,
        },
      },
    });
    router.initialize();

    await tick();
    expect(router.state.loaderData).toEqual({
      root: 0,
    });

    router.navigate("/b");
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 0,
    });

    // @ts-expect-error
    returnValue = undefined;
    router.navigate("/a");
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 0,
    });

    // @ts-expect-error
    returnValue = null;
    router.navigate("/b");
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 0,
    });

    // @ts-expect-error
    returnValue = "truthy";
    router.navigate("/a");
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 0,
    });

    returnValue = true;
    router.navigate("/b");
    await tick();
    expect(router.state.loaderData).toEqual({
      root: 1,
    });

    router.dispose();
  });

  describe("skipActionRevalidation", () => {
    it("revalidates after actions returning 4xx/5xx responses by default", async () => {
      let count = -1;
      let responses = [
        new Response("DATA 400", { status: 400 }),
        new Response("DATA 500", { status: 500 }),
      ];
      let rootLoader = jest.fn(() => "ROOT " + count);

      let history = createMemoryHistory();
      let router = createRouter({
        history,
        routes: [
          {
            id: "root",
            path: "/",
            loader: async () => rootLoader(),
            children: [
              {
                id: "index",
                index: true,
                hasErrorBoundary: true,
                action: () => responses[++count],
              },
            ],
          },
        ],
        hydrationData: {
          loaderData: {
            root: "ROOT",
          },
        },
      });
      router.initialize();

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT 0" },
        actionData: { index: "DATA 400" },
        errors: null,
      });

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(2);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT 1" },
        actionData: { index: "DATA 500" },
        errors: null,
      });

      router.dispose();
    });

    it("revalidates after actions throwing 4xx/5xx responses by default", async () => {
      let count = -1;
      let responses = [
        new Response("ERROR 400", { status: 400 }),
        new Response("ERROR 500", { status: 500 }),
      ];
      let rootLoader = jest.fn(() => "ROOT " + count);

      let history = createMemoryHistory();
      let router = createRouter({
        history,
        routes: [
          {
            id: "root",
            path: "/",
            loader: async () => rootLoader(),
            children: [
              {
                id: "index",
                index: true,
                hasErrorBoundary: true,
                action: () => {
                  throw responses[++count];
                },
              },
            ],
          },
        ],
        hydrationData: {
          loaderData: {
            root: "ROOT",
          },
        },
      });
      router.initialize();

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(1);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT 0" },
        actionData: null,
        errors: { index: new ErrorResponseImpl(400, "", "ERROR 400") },
      });

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(2);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT 1" },
        actionData: null,
        errors: { index: new ErrorResponseImpl(500, "", "ERROR 500") },
      });

      router.dispose();
    });

    it("does not revalidates after actions returning 4xx/5xx responses with flag", async () => {
      let count = -1;
      let responses = [
        new Response("DATA 400", { status: 400 }),
        new Response("DATA 500", { status: 500 }),
      ];
      let rootLoader = jest.fn(() => "ROOT " + count);

      let history = createMemoryHistory();
      let router = createRouter({
        history,
        routes: [
          {
            id: "root",
            path: "/",
            loader: async () => rootLoader(),
            children: [
              {
                id: "index",
                index: true,
                hasErrorBoundary: true,
                action: () => responses[++count],
              },
            ],
          },
        ],
        hydrationData: {
          loaderData: {
            root: "ROOT",
          },
        },
        future: { unstable_skipActionErrorRevalidation: true },
      });
      router.initialize();

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT" },
        actionData: { index: "DATA 400" },
        errors: null,
      });

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT" },
        actionData: { index: "DATA 500" },
        errors: null,
      });

      router.dispose();
    });

    it("does not revalidate after actions throwing 4xx/5xx responses with flag", async () => {
      let count = -1;
      let responses = [
        new Response("ERROR 400", { status: 400 }),
        new Response("ERROR 500", { status: 500 }),
      ];
      let rootLoader = jest.fn(() => "ROOT " + count);

      let history = createMemoryHistory();
      let router = createRouter({
        history,
        routes: [
          {
            id: "root",
            path: "/",
            loader: async () => rootLoader(),
            children: [
              {
                id: "index",
                index: true,
                hasErrorBoundary: true,
                action: () => {
                  throw responses[++count];
                },
              },
            ],
          },
        ],
        hydrationData: {
          loaderData: {
            root: "ROOT",
          },
        },
        future: { unstable_skipActionErrorRevalidation: true },
      });
      router.initialize();

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT" },
        actionData: null,
        errors: { index: new ErrorResponseImpl(400, "", "ERROR 400") },
      });

      router.navigate("/?index", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      await tick();
      expect(rootLoader.mock.calls.length).toBe(0);
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        navigation: { state: "idle" },
        loaderData: { root: "ROOT" },
        actionData: null,
        errors: { index: new ErrorResponseImpl(500, "", "ERROR 500") },
      });

      router.dispose();
    });
  });
});
