/**
 * @jest-environment node
 */

import { createMemoryHistory, createRouter } from "../index";

// This suite of tests specifically runs in the node jest environment to catch
// issues when window is not present
describe("a memory router", () => {
  it("initializes properly", async () => {
    let router = createRouter({
      routes: [
        {
          path: "/",
        },
      ],
      history: createMemoryHistory(),
    });
    expect(router.state).toEqual({
      historyAction: "POP",
      loaderData: {},
      actionData: null,
      errors: null,
      location: {
        hash: "",
        key: expect.any(String),
        pathname: "/",
        search: "",
        state: null,
      },
      matches: [
        {
          params: {},
          pathname: "/",
          pathnameBase: "/",
          route: {
            id: "0",
            hasErrorBoundary: false,
            path: "/",
          },
        },
      ],
      initialized: true,
      navigation: {
        location: undefined,
        state: "idle",
      },
      preventScrollReset: false,
      restoreScrollPosition: null,
      revalidation: "idle",
      fetchers: new Map(),
      blockers: new Map(),
    });
    router.dispose();
  });

  it("can create Requests without window", async () => {
    let loaderSpy = jest.fn();
    let router = createRouter({
      routes: [
        {
          path: "/",
        },
        {
          path: "/a",
          loader: loaderSpy,
        },
      ],
      history: createMemoryHistory(),
    });

    router.navigate("/a");
    expect(loaderSpy.mock.calls[0][0].request.url).toBe("http://localhost/a");
    router.dispose();
  });

  it("can create URLs without window", async () => {
    let shouldRevalidateSpy = jest.fn();

    let router = createRouter({
      routes: [
        {
          path: "/",
          loader: () => "ROOT",
          shouldRevalidate: shouldRevalidateSpy,
          children: [
            {
              index: true,
            },
            {
              path: "a",
            },
          ],
        },
      ],
      history: createMemoryHistory(),
      hydrationData: { loaderData: { "0": "ROOT" } },
    });

    router.navigate("/a");
    expect(shouldRevalidateSpy.mock.calls[0][0].currentUrl.toString()).toBe(
      "http://localhost/"
    );
    expect(shouldRevalidateSpy.mock.calls[0][0].nextUrl.toString()).toBe(
      "http://localhost/a"
    );
    router.dispose();
  });

  it("properly handles same-origin absolute URLs", async () => {
    let router = createRouter({
      routes: [
        {
          path: "/",
          children: [
            {
              index: true,
            },
            {
              path: "a",
              loader: () =>
                new Response(null, {
                  status: 302,
                  headers: {
                    Location: "http://localhost/b",
                  },
                }),
            },
            {
              path: "b",
            },
          ],
        },
      ],
      history: createMemoryHistory(),
    });

    await router.navigate("/a");
    expect(router.state.location).toMatchObject({
      hash: "",
      pathname: "/b",
      search: "",
    });
  });

  it("properly handles protocol-less same-origin absolute URLs", async () => {
    let router = createRouter({
      routes: [
        {
          path: "/",
          children: [
            {
              index: true,
            },
            {
              path: "a",
              loader: () =>
                new Response(null, {
                  status: 302,
                  headers: {
                    Location: "//localhost/b",
                  },
                }),
            },
            {
              path: "b",
            },
          ],
        },
      ],
      history: createMemoryHistory(),
    });

    await router.navigate("/a");
    expect(router.state.location).toMatchObject({
      hash: "",
      pathname: "/b",
      search: "",
    });
  });
});
