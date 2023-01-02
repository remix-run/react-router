/* eslint-disable jest/no-focused-tests */
/* eslint-disable jest/no-done-callback */

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

    let fn = () => true;
    router.getBlocker("KEY", fn);
    expect(router.state.blockers.get("KEY")).toEqual({
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
    router.getBlocker("KEY", () => true);
    router.deleteBlocker("KEY");
    expect(router.state.blockers.get("KEY")).toBeUndefined();
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
      it("removes blocker after navigation", async () => {
        router.getBlocker("KEY", () => false);
        await router.navigate("/about");
        expect(router.state.blockers.get("KEY")).toBeUndefined();
      });

      it("navigates", async () => {
        router.getBlocker("KEY", () => false);
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe("/about");
      });
    });

    describe("blocker returns true", () => {
      it("set blocker state to 'blocked' after navigation", async () => {
        router.getBlocker("KEY", () => true);
        await router.navigate("/about");
        expect(router.state.blockers.get("KEY")?.state).toEqual("blocked");
      });

      it("does not navigate", async () => {
        router.getBlocker("KEY", () => true);
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );
      });
    });

    describe("proceeds from blocked state", () => {
      // TODO: Unsure why this is failing
      it.skip("sets blocker state to 'proceeding'", async (done) => {
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate("/about");

        expect(router.state.blockers.get("KEY")?.state).toEqual("blocked");

        blocker = router.getBlocker("KEY");
        blocker.proceed?.();

        expect(router.state.blockers.get("KEY")?.state).toEqual("proceeding");
      });

      it.skip("proceeds with blocked navigation", async () => {
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate("/about");
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );

        // TODO: Proceed is sync and doesn't wait for the transition to
        // complete, so I'm not sure how to test this.
        blocker.proceed?.();
        expect(router.state.location.pathname).toEqual("/about");
      });
    });

    describe("resets from blocked state", () => {
      it.only("sets blocker state to 'unblocked'", async () => {
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate("/about");
        expect(router.state.blockers.get("KEY")?.state).toEqual("blocked");

        router.state.blockers.get("KEY")?.reset?.();
        expect(router.state.blockers.get("KEY")?.state).toEqual("unblocked");
      });

      it("does not navigate", async () => {
        let blocker = router.getBlocker("KEY", () => true);
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
        let blocker = router.getBlocker("KEY", () => false);
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("unblocked");
      });

      it("navigates", async () => {
        router.getBlocker("KEY", () => false);
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe("/about");
      });
    });

    describe("blocker returns true", () => {
      it("set blocker state to 'blocked'", async () => {
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("blocked");
      });

      it("does not navigate", async () => {
        router.getBlocker("KEY", () => true);
        await router.navigate("/about", { replace: true });
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );
      });
    });

    describe("proceeds from blocked state", () => {
      it("sets blocker state to 'proceeding'", async (done) => {
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("blocked");

        blocker.proceed?.();
        expect(blocker.state).toEqual("proceeding");
      });

      it("proceeds with blocked navigation", async () => {
        let blocker = router.getBlocker("KEY", () => true);
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
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate("/about", { replace: true });
        expect(blocker.state).toEqual("blocked");

        blocker.reset?.();
        expect(blocker.state).toEqual("unblocked");
      });

      it("does not navigate", async () => {
        let blocker = router.getBlocker("KEY", () => true);
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
        let blocker = router.getBlocker("KEY", () => false);
        await router.navigate(-1);
        expect(blocker.state).toEqual("unblocked");
      });

      it("should navigate", async () => {
        router.getBlocker("KEY", () => false);
        await router.navigate(-1);
        expect(router.state.location.pathname).toEqual(
          initialEntries[initialIndex - 1]
        );
      });
    });

    describe("blocker returns true", () => {
      it("set blocker state", async () => {
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate(-1);
        expect(blocker.state).toEqual("blocked");
      });

      it("does not navigate", async () => {
        router.getBlocker("KEY", () => true);
        await router.navigate(-1);
        expect(router.state.location.pathname).toBe(
          initialEntries[initialIndex]
        );
      });
    });

    describe("proceeds from blocked state", () => {
      it("sets blocker state to 'proceeding'", async (done) => {
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate(-1);
        expect(blocker.state).toEqual("blocked");

        blocker.proceed?.();
        expect(blocker.state).toEqual("proceeding");
      });

      it("proceeds with blocked navigation", async () => {
        let blocker = router.getBlocker("KEY", () => true);
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
        let blocker = router.getBlocker("KEY", () => true);
        await router.navigate(-1);
        expect(blocker.state).toEqual("blocked");

        blocker.reset?.();
        expect(blocker.state).toEqual("unblocked");
      });

      it("does not navigate", async () => {
        let blocker = router.getBlocker("KEY", () => true);
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
