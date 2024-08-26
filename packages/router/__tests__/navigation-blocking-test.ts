import type { Router } from "../index";
import { createMemoryHistory, createRouter } from "../index";

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
          initialEntries[initialIndex]
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
          initialEntries[initialIndex]
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
          initialEntries[initialIndex - 1]
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
          initialEntries[initialIndex]
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
});

function sleep(n: number = 500) {
  return new Promise<void>((r) => setTimeout(r, n));
}
