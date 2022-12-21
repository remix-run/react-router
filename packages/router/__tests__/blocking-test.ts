/* eslint-disable jest/no-focused-tests */
/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/no-disabled-tests */
import type { Router } from "../index";
import { createMemoryHistory, createRouter } from "../index";

describe("blocking", () => {
  let router: Router;
  it("creates a blocker", () => {
    router = createRouter({
      history: createMemoryHistory({
        initialEntries: ["/"],
        initialIndex: 0,
      }),
      routes: [{ path: "/" }, { path: "/about" }],
    });
    router.initialize();

    let fn = () => ({
      shouldBlock: () => true,
    });
    router.createBlocker("KEY", fn);
    let blocker = router.getBlocker("KEY");
    expect(blocker).toEqual({
      fn,
      state: "unblocked",
      proceed: undefined,
      reset: undefined,
    });
  });

  it("deletes a blocker", () => {
    router = createRouter({
      history: createMemoryHistory({
        initialEntries: ["/"],
        initialIndex: 0,
      }),
      routes: [{ path: "/" }, { path: "/about" }],
    });
    router.initialize();

    router.createBlocker("KEY", () => ({ shouldBlock: () => true }));
    router.deleteBlocker("KEY");
    let blocker = router.getBlocker("KEY");
    expect(blocker).toBeUndefined();
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
        routes: [{ path: "/" }, { path: "/about" }],
      });
      router.initialize();
    });

    describe("blocker returns false", () => {
      it("sets blocker state to 'unblocked'", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => false,
        }));
        await router.navigate("/about");
        expect(blocker.state).toEqual("unblocked");
      });

      it("navigates", async () => {
        router.createBlocker("KEY", () => ({ shouldBlock: () => false }));
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe("/about");
      });
    });

    describe("blocker returns true", () => {
      it("set blocker state to 'blocked'", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about");
        expect(blocker.state).toEqual("blocked");
      });

      it("does not navigate", async () => {
        router.createBlocker("KEY", () => ({ shouldBlock: () => true }));
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );
      });
    });

    describe("proceeds from blocked state", () => {
      it("sets blocker state to 'proceeding'", async (done) => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about");
        expect(blocker.state).toEqual("blocked");

        blocker.proceed?.().then(() => {
          expect(blocker.state).toEqual("unblocked");
          done();
        });
        expect(blocker.state).toEqual("proceeding");
      });

      it("proceeds with blocked navigation", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );

        await blocker.proceed?.();
        expect(router.state.location.pathname).toEqual("/about");
      });
    });

    describe("resets from blocked state", () => {
      it("sets blocker state to 'unblocked'", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about");
        expect(blocker.state).toEqual("blocked");

        blocker.reset?.();
        expect(blocker.state).toEqual("unblocked");
      });

      it("does not navigate", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );

        blocker.reset?.();
        expect(router.state.location.pathname).toEqual("/");
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
        routes: [{ path: "/" }, { path: "/about" }],
      });
      router.initialize();
    });

    describe("blocker returns false", () => {
      it("sets blocker state to 'unblocked'", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => false,
        }));
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("unblocked");
      });

      it("navigates", async () => {
        router.createBlocker("KEY", () => ({ shouldBlock: () => false }));
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe("/about");
      });
    });

    describe("blocker returns true", () => {
      it("set blocker state to 'blocked'", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("blocked");
      });

      it("does not navigate", async () => {
        router.createBlocker("KEY", () => ({ shouldBlock: () => true }));
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );
      });
    });

    describe("proceeds from blocked state", () => {
      it("sets blocker state to 'proceeding'", async (done) => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("blocked");

        blocker.proceed?.().then(() => {
          expect(blocker.state).toEqual("unblocked");
          done();
        });
        expect(blocker.state).toEqual("proceeding");
      });

      it("proceeds with blocked navigation", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );

        await blocker.proceed?.();
        expect(router.state.location.pathname).toEqual("/about");
      });
    });

    describe("resets from blocked state", () => {
      it("sets blocker state to 'unblocked'", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("blocked");

        blocker.reset?.();
        expect(blocker.state).toEqual("unblocked");
      });

      it("does not navigate", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );

        blocker.reset?.();
        expect(router.state.location.pathname).toEqual("/");
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
        routes: [
          { path: "/" },
          { path: "/about" },
          { path: "/contact" },
          { path: "/help" },
        ],
      });
      router.initialize();
    });

    describe("blocker returns false", () => {
      it("set blocker state to unblocked", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => false,
        }));
        await router.navigate(-1);
        expect(blocker.state).toEqual("unblocked");
      });

      it("should navigate", async () => {
        router.createBlocker("KEY", () => ({ shouldBlock: () => false }));
        await router.navigate(-1);
        expect(router.state.location.pathname).toEqual(
          initialEntries[initialIndex - 1]
        );
      });
    });

    describe("blocker returns true", () => {
      it("set blocker state", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate(-1);
        expect(blocker.state).toEqual("blocked");
      });

      it("does not navigate", async () => {
        router.createBlocker("KEY", () => ({ shouldBlock: () => true }));
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );
      });
    });

    describe("proceeds from blocked state", () => {
      it("sets blocker state to 'proceeding'", async (done) => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate(-1);
        expect(blocker.state).toEqual("blocked");

        blocker.proceed?.().then(() => {
          expect(blocker.state).toEqual("unblocked");
          done();
        });
        expect(blocker.state).toEqual("proceeding");
      });

      it("proceeds with blocked navigation", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );

        await blocker.proceed?.();
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex - 1]
        );
      });
    });

    describe("resets from blocked state", () => {
      it.todo("patches the history stack");

      it("sets blocker state to 'unblocked'", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate(-1);
        expect(blocker.state).toEqual("blocked");

        blocker.reset?.();
        expect(blocker.state).toEqual("unblocked");
      });

      it("does not navigate", async () => {
        let blocker = router.createBlocker("KEY", () => ({
          shouldBlock: () => true,
        }));
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );

        blocker.reset?.();
        expect(router.state.location.pathname).toEqual(
          initialEntries[initialIndex]
        );
      });
    });
  });
});
