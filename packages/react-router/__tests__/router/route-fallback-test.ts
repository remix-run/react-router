import type { LoaderFunction, Router } from "../../lib/router";
import {
  IDLE_NAVIGATION,
  createMemoryHistory,
  createRouter,
} from "../../lib/router";

import {
  deferredData,
  trackedPromise,
  urlMatch,
} from "./utils/custom-matchers";
import { createDeferred } from "./utils/data-router-setup";
import { tick } from "./utils/utils";

interface CustomMatchers<R = jest.Expect> {
  urlMatch(url: string);
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
  urlMatch,
});

let router: Router;

// Detect any failures inside the router navigate code
afterEach(() => {
  router.dispose();
});

describe("route HydrateFallback", () => {
  it("starts with initialized=false, runs unhydrated loaders with partial hydrationData", async () => {
    let spy = jest.fn();
    let shouldRevalidateSpy = jest.fn((args) => args.defaultShouldRevalidate);
    let dfd = createDeferred();
    router = createRouter({
      routes: [
        {
          id: "root",
          path: "/",
          loader: spy,
          shouldRevalidate: shouldRevalidateSpy,
          children: [
            {
              id: "index",
              index: true,
              loader: () => dfd.promise,
            },
          ],
        },
      ],
      history: createMemoryHistory(),
      hydrationData: {
        loaderData: {
          root: "LOADER DATA",
          // No loaderData provided for index route
        },
      },
    });

    let subscriberSpy = jest.fn();
    router.subscribe(subscriberSpy);

    // Start with initialized:false
    expect(router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      loaderData: { root: "LOADER DATA" },
      initialized: false,
      navigation: { state: "idle" },
    });

    // Initialize/kick off data loads due to partial hydrationData
    router.initialize();
    await dfd.resolve("INDEX DATA");
    expect(router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      loaderData: { root: "LOADER DATA", index: "INDEX DATA" },
      initialized: true,
      navigation: { state: "idle" },
    });

    // Root was not re-called
    expect(shouldRevalidateSpy).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();

    // Ensure we don't go into a navigating state during initial calls of
    // the loaders
    expect(subscriberSpy).toHaveBeenCalledTimes(1);
    expect(subscriberSpy.mock.calls[0][0]).toMatchObject({
      loaderData: {
        index: "INDEX DATA",
        root: "LOADER DATA",
      },
      navigation: IDLE_NAVIGATION,
    });
  });

  it("starts with initialized=false, runs hydrated loaders when loader.hydrate=true", async () => {
    let spy = jest.fn();
    let shouldRevalidateSpy = jest.fn((args) => args.defaultShouldRevalidate);
    let dfd = createDeferred();
    let indexLoader: LoaderFunction = () => dfd.promise;
    indexLoader.hydrate = true;
    router = createRouter({
      routes: [
        {
          id: "root",
          path: "/",
          loader: spy,
          shouldRevalidate: shouldRevalidateSpy,
          children: [
            {
              id: "index",
              index: true,
              loader: indexLoader,
            },
          ],
        },
      ],
      history: createMemoryHistory(),
      hydrationData: {
        loaderData: {
          root: "LOADER DATA",
          index: "INDEX INITIAL",
        },
      },
    });

    let subscriberSpy = jest.fn();
    router.subscribe(subscriberSpy);

    // Start with initialized:false
    expect(router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      loaderData: {
        root: "LOADER DATA",
        index: "INDEX INITIAL",
      },
      initialized: false,
      navigation: { state: "idle" },
    });

    // Initialize/kick off data loads due to partial hydrationData
    router.initialize();
    await dfd.resolve("INDEX UPDATED");
    expect(router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      loaderData: {
        root: "LOADER DATA",
        index: "INDEX UPDATED",
      },
      initialized: true,
      navigation: { state: "idle" },
    });

    // Root was not re-called
    expect(shouldRevalidateSpy).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();

    // Ensure we don't go into a navigating state during initial calls of
    // the loaders
    expect(subscriberSpy).toHaveBeenCalledTimes(1);
    expect(subscriberSpy.mock.calls[0][0]).toMatchObject({
      loaderData: {
        index: "INDEX UPDATED",
        root: "LOADER DATA",
      },
      navigation: IDLE_NAVIGATION,
    });
  });

  it("does not kick off initial data load if errors exist (parent error)", async () => {
    let consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    let parentDfd = createDeferred();
    let parentSpy = jest.fn(() => parentDfd.promise);
    let childDfd = createDeferred();
    let childSpy = jest.fn(() => childDfd.promise);
    let router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/child"] }),
      routes: [
        {
          path: "/",
          loader: parentSpy,
          children: [
            {
              path: "child",
              loader: childSpy,
            },
          ],
        },
      ],
      hydrationData: {
        errors: {
          "0": "PARENT ERROR",
        },
        loaderData: {
          "0-0": "CHILD_DATA",
        },
      },
    });
    router.initialize();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(parentSpy).not.toHaveBeenCalled();
    expect(childSpy).not.toHaveBeenCalled();
    expect(router.state).toMatchObject({
      historyAction: "POP",
      location: expect.objectContaining({ pathname: "/child" }),
      matches: [{ route: { path: "/" } }, { route: { path: "child" } }],
      initialized: true,
      navigation: IDLE_NAVIGATION,
      errors: {
        "0": "PARENT ERROR",
      },
      loaderData: {
        "0-0": "CHILD_DATA",
      },
    });

    router.dispose();
    consoleWarnSpy.mockReset();
  });

  it("does not kick off initial data load if errors exist (bubbled child error)", async () => {
    let consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    let parentDfd = createDeferred();
    let parentSpy = jest.fn(() => parentDfd.promise);
    let childDfd = createDeferred();
    let childSpy = jest.fn(() => childDfd.promise);
    let router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/child"] }),
      routes: [
        {
          path: "/",
          loader: parentSpy,
          children: [
            {
              path: "child",
              loader: childSpy,
            },
          ],
        },
      ],
      hydrationData: {
        errors: {
          "0": "CHILD ERROR",
        },
        loaderData: {
          "0": "PARENT DATA",
        },
      },
    });
    router.initialize();

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(parentSpy).not.toHaveBeenCalled();
    expect(childSpy).not.toHaveBeenCalled();
    expect(router.state).toMatchObject({
      historyAction: "POP",
      location: expect.objectContaining({ pathname: "/child" }),
      matches: [{ route: { path: "/" } }, { route: { path: "child" } }],
      initialized: true,
      navigation: IDLE_NAVIGATION,
      errors: {
        "0": "CHILD ERROR",
      },
      loaderData: {
        "0": "PARENT DATA",
      },
    });

    router.dispose();
    consoleWarnSpy.mockReset();
  });

  it("does not kick off initial data load for routes that don't have loaders", async () => {
    let consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    let parentDfd = createDeferred();
    let parentSpy = jest.fn(() => parentDfd.promise);
    let router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/child"] }),
      routes: [
        {
          path: "/",
          loader: parentSpy,
          children: [
            {
              path: "child",
            },
          ],
        },
      ],
      hydrationData: {
        loaderData: {
          "0": "PARENT DATA",
        },
      },
    });
    expect(router.state).toMatchObject({
      // already initialized so calling initialize() won't kick off loaders
      initialized: true,
      navigation: IDLE_NAVIGATION,
      loaderData: {
        "0": "PARENT DATA",
      },
    });

    router.dispose();
    consoleWarnSpy.mockReset();
  });
});
