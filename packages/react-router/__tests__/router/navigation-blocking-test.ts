import {
  createBrowserHistory,
  createMemoryHistory,
} from "../../lib/router/history";
import type { Router } from "../../lib/router/router";
import { createRouter } from "../../lib/router/router";
import getWindow from "../utils/getWindow";

const LOADER_LATENCY_MS = 100;
const routes = [
  { path: "/" },
  {
    path: "/about",
    loader: () => sleep(LOADER_LATENCY_MS),
  },
  { path: "/contact" },
  { path: "/help" },
];

describe("navigation blocking", () => {
  let router: Router;
  it("initializes an 'unblocked' blocker", () => {
    router = createRouter({
      history: createMemoryHistory({
        initialEntries: ["/"],
        initialIndex: 0,
      }),
      routes,
    });
    router.initialize();

    let fn = () => true;
    router.getBlocker("KEY", fn);
    expect(router.getBlocker("KEY", fn)).toEqual({
      state: "unblocked",
      proceed: undefined,
      reset: undefined,
      location: undefined,
    });
  });

  describe("on history push", () => {
    let initialEntries = ["/", "/about"];
    let initialIndex = 0;
    beforeEach(() => {
      router = createRouter({
        history: createMemoryHistory({
          initialEntries,
          initialIndex,
        }),
        routes,
      });
      router.initialize();
    });

    describe("blocker returns false", () => {
      let fn = () => false;
      it("navigates", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe("/about");
      });

      it("gets an 'unblocked' blocker after navigation starts", async () => {
        router.getBlocker("KEY", fn);
        router.navigate("/about");
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("gets an 'unblocked' blocker after navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });
    });

    describe("blocker returns true", () => {
      let fn = () => true;

      it("does not navigate", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex],
        );
      });

      it("gets a 'blocked' blocker after navigation starts", async () => {
        router.getBlocker("KEY", fn);
        router.navigate("/about");
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });

      it("gets a 'blocked' blocker after navigation promise resolves", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });
    });

    describe("proceeds from blocked state", () => {
      let fn = () => true;
      it("gets a 'proceeding' blocker after proceeding navigation starts", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        router.getBlocker("KEY", fn).proceed?.();
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "proceeding",
          proceed: undefined,
          reset: undefined,
          location: expect.any(Object),
        });
      });

      it("gets an 'unblocked' blocker after proceeding navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        router.getBlocker("KEY", fn).proceed?.();
        await sleep(LOADER_LATENCY_MS);
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("navigates after proceeding navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        router.getBlocker("KEY", fn).proceed?.();
        await sleep(LOADER_LATENCY_MS);
        expect(router.state.location.pathname).toBe("/about");
      });
    });

    describe("resets from blocked state", () => {
      let fn = () => true;
      it("gets an 'unblocked' blocker after resetting navigation", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        router.getBlocker("KEY", fn).reset?.();
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("stays at current location after resetting", async () => {
        router.getBlocker("KEY", fn);
        let pathnameBeforeNavigation = router.state.location.pathname;
        await router.navigate("/about");
        router.getBlocker("KEY", fn).reset?.();

        // wait for '/about' loader so we catch failure if navigation proceeds
        await sleep(LOADER_LATENCY_MS);
        expect(router.state.location.pathname).toBe(pathnameBeforeNavigation);
      });
    });

    describe("revalidation while blocked", () => {
      let fn = () => true;
      it("preserves a 'blocked' blocker through a revalidation", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about");
        expect(router.getBlocker("KEY", fn).state).toBe("blocked");

        // a revalidation is not a navigation, so it must not clear the blocker
        await router.revalidate();
        expect(router.getBlocker("KEY", fn).state).toBe("blocked");
      });
    });
  });

  describe("on history replace", () => {
    let initialEntries = ["/", "/about"];
    let initialIndex = 0;
    beforeEach(() => {
      router = createRouter({
        history: createMemoryHistory({
          initialEntries,
          initialIndex,
        }),
        routes,
      });
      router.initialize();
    });

    describe("blocker returns false", () => {
      let fn = () => false;
      it("navigates", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe("/about");
      });

      it("gets an 'unblocked' blocker after navigation starts", async () => {
        router.getBlocker("KEY", fn);
        router.navigate("/about", { replace: true });
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("gets an 'unblocked' blocker after navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });
    });

    describe("blocker returns true", () => {
      let fn = () => true;

      it("does not navigate", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex],
        );
      });

      it("gets a 'blocked' blocker after navigation starts", async () => {
        router.getBlocker("KEY", fn);
        router.navigate("/about", { replace: true });
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });

      it("gets a 'blocked' blocker after navigation promise resolves", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });
    });

    describe("proceeds from blocked state", () => {
      let fn = () => true;
      it("gets a 'proceeding' blocker after proceeding navigation starts", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        router.getBlocker("KEY", fn).proceed?.();
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "proceeding",
          proceed: undefined,
          reset: undefined,
          location: expect.any(Object),
        });
      });

      it("gets an 'unblocked' blocker after proceeding navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        router.getBlocker("KEY", fn).proceed?.();
        await sleep(LOADER_LATENCY_MS);
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("navigates after proceeding navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        router.getBlocker("KEY", fn).proceed?.();
        await sleep(LOADER_LATENCY_MS);
        expect(router.state.location.pathname).toBe("/about");
      });

      it("replaces the current history entry after proceeding completes", async () => {
        router.getBlocker("KEY", fn);
        let historyLengthBeforeNavigation = window.history.length;
        await router.navigate("/about", { replace: true });
        router.getBlocker("KEY", fn).proceed?.();
        await sleep(LOADER_LATENCY_MS);
        expect(window.history.length).toBe(historyLengthBeforeNavigation);
      });
    });

    describe("resets from blocked state", () => {
      let fn = () => true;
      it("gets an 'unblocked' blocker after resetting navigation", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate("/about", { replace: true });
        router.getBlocker("KEY", fn).reset?.();
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("stays at current location after resetting", async () => {
        router.getBlocker("KEY", fn);
        let pathnameBeforeNavigation = router.state.location.pathname;
        await router.navigate("/about", { replace: true });
        router.getBlocker("KEY", fn).reset?.();

        // wait for '/about' loader so we catch failure if navigation proceeds
        await sleep(LOADER_LATENCY_MS);
        expect(router.state.location.pathname).toBe(pathnameBeforeNavigation);
      });
    });
  });

  describe("on history pop", () => {
    let initialEntries = ["/", "/about", "/contact", "/help"];
    let initialIndex = 1;
    beforeEach(() => {
      router = createRouter({
        history: createMemoryHistory({
          initialEntries,
          initialIndex,
        }),
        routes,
      });
      router.initialize();
    });

    describe("blocker returns false", () => {
      let fn = () => false;
      it("navigates", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex - 1],
        );
      });

      it("gets an 'unblocked' blocker after navigation starts", async () => {
        router.getBlocker("KEY", fn);
        router.navigate(-1);
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("gets an 'unblocked' blocker after navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });
    });

    describe("blocker returns true", () => {
      let fn = () => true;

      it("does not navigate", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex],
        );
      });

      it("gets a 'blocked' blocker after navigation starts", async () => {
        router.getBlocker("KEY", fn);
        router.navigate(-1);
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });

      it("gets a 'blocked' blocker after navigation promise resolves", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "blocked",
          proceed: expect.any(Function),
          reset: expect.any(Function),
          location: expect.any(Object),
        });
      });
    });

    describe("proceeds from blocked state", () => {
      let fn = () => true;

      // we want to navigate so that `/about` is the previous entry in the
      // stack here since it has a loader that won't resolve immediately
      let initialEntries = ["/", "/about", "/contact"];
      let initialIndex = 2;
      beforeEach(() => {
        router = createRouter({
          history: createMemoryHistory({
            initialEntries,
            initialIndex,
          }),
          routes,
        });
        router.initialize();
      });

      it("gets a 'proceeding' blocker after proceeding navigation starts", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        router.getBlocker("KEY", fn).proceed?.();
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "proceeding",
          proceed: undefined,
          reset: undefined,
          location: expect.any(Object),
        });
      });

      it("gets an 'unblocked' blocker after proceeding navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        router.getBlocker("KEY", fn).proceed?.();
        await sleep(LOADER_LATENCY_MS + 10);
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("navigates after proceeding navigation completes", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        router.getBlocker("KEY", fn).proceed?.();
        await sleep(LOADER_LATENCY_MS + 10);
        expect(router.state.location.pathname).toBe("/about");
      });
    });

    describe("resets from blocked state", () => {
      let fn = () => true;
      it("gets an 'unblocked' blocker after resetting navigation", async () => {
        router.getBlocker("KEY", fn);
        await router.navigate(-1);
        router.getBlocker("KEY", fn).reset?.();
        expect(router.getBlocker("KEY", fn)).toEqual({
          state: "unblocked",
          proceed: undefined,
          reset: undefined,
          location: undefined,
        });
      });

      it("stays at current location after resetting", async () => {
        router.getBlocker("KEY", fn);
        let pathnameBeforeNavigation = router.state.location.pathname;
        await router.navigate(-1);
        router.getBlocker("KEY", fn).reset?.();

        // wait for '/about' loader so we catch failure if navigation proceeds
        await sleep(LOADER_LATENCY_MS);
        expect(router.state.location.pathname).toBe(pathnameBeforeNavigation);
      });
    });
  });

  // An entry created outside the router (a `#hash` link, `history.pushState`)
  // carries no index, and a `popstate` the browser didn't cause doesn't change
  // the entry. A blocked POP leaving such an entry used to be undone by a wrong
  // step, and a step of 0 (`0 - null`, or the same index) made the undo
  // `history.go(0)`: a page reload.
  describe("on a history pop whose step the router can't know", () => {
    let testWindow: Window;
    let go: jest.SpyInstance;
    let warn: jest.SpyInstance;

    afterEach(() => warn.mockRestore());

    beforeEach(async () => {
      warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      testWindow = getWindow("/");
      router = createRouter({
        history: createBrowserHistory({ window: testWindow }),
        routes,
      });
      router.initialize();
      await router.navigate("/contact");
      testWindow.history.pushState(null, "", "/contact#section");
      go = jest.spyOn(testWindow.history, "go");
    });

    async function waitFor(done: () => boolean, ms = 2000) {
      let end = Date.now() + ms;
      while (!done()) {
        if (Date.now() > end) throw new Error("timed out");
        await sleep(5);
      }
    }
    const at = () => testWindow.location.pathname + testWindow.location.hash;

    it("never reloads the page: no history.go, back or forward", async () => {
      router.getBlocker("KEY", () => true);
      testWindow.history.back();
      await waitFor(() => at() === "/contact");
      testWindow.history.forward();
      await waitFor(() => at() === "/contact#section");
      testWindow.history.back();
      await waitFor(() => at() === "/contact");
      await sleep(20);
      // It was go(-0) on the first Back (a reload), and go(-1) on the last.
      expect(go).not.toHaveBeenCalled();
      // The blocker can't apply, and says so, as for any entry it didn't create.
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("not created by @remix-run/router"),
      );
    });

    // single-spa fires a popstate of its own after each push (#11621).
    it("never reloads the page on a popstate that doesn't change the entry", async () => {
      testWindow.history.back();
      await waitFor(() => at() === "/contact");
      router.getBlocker("KEY", () => true);
      let { PopStateEvent } = testWindow as Window & typeof globalThis;
      testWindow.dispatchEvent(
        new PopStateEvent("popstate", { state: testWindow.history.state }),
      );
      await sleep(20);
      expect(go).not.toHaveBeenCalled(); // it was go(-0)
      expect(at()).toBe("/contact");
    });

    it("still blocks, and undoes, a POP between entries it created", async () => {
      let fn = () => true;
      router.getBlocker("KEY", fn);
      testWindow.history.back();
      await waitFor(() => at() === "/contact");
      go.mockClear();
      testWindow.history.back(); // to "/", an entry the router created
      await waitFor(() => go.mock.calls.length > 0);
      expect(go).toHaveBeenCalledWith(1);
      expect(router.getBlocker("KEY", fn).state).toBe("blocked");
    });
  });
});

function sleep(n: number = 500) {
  return new Promise<void>((r) => setTimeout(r, n));
}
