import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("pending mutation revalidation", () => {
  afterEach(() => cleanup());

  it.each([
    ["navigation", true],
    ["navigation", false],
    ["fetcher", true],
    ["fetcher", false],
  ])(
    "reloads shared data when an older %s completes while the mutation action is pending: %s",
    async (staleLoad, actionPending) => {
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            loader: true,
            action: true,
            children: [
              { id: "b", path: "b" },
              { id: "c", path: "c", loader: true },
              { id: "d", path: "d", loader: true },
            ],
          },
        ],
        hydrationData: { loaderData: { root: "ROOT BEFORE MUTATION" } },
      });

      // A's mutation stays pending while B starts reading the old root data.
      let A = await t.fetch("/", "mutation", {
        formMethod: "post",
        formData: createFormData({}),
      });
      let B =
        staleLoad === "navigation"
          ? await t.navigate("/b")
          : await t.fetch("/", "older-revalidation", {
              formMethod: "post",
              formData: createFormData({}),
            });
      if (staleLoad === "fetcher") {
        await B.actions.root.resolve("ACTION B");
      }
      expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(A.fetcher.state).toBe("submitting");

      // B's older response may land before or after A succeeds. Either way,
      // its completion must not lose A's outstanding mutation invalidation.
      if (actionPending) {
        await B.loaders.root.resolve("ROOT BEFORE MUTATION");
      }
      await A.actions.root.resolve("ACTION A");
      expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(A.fetcher.state).toBe("loading");
      if (!actionPending) {
        await B.loaders.root.resolve("ROOT BEFORE MUTATION");
      }
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData.root).toBe("ROOT BEFORE MUTATION");
      expect(A.loaders.root.signal.aborted).toBe(false);

      // C must reload the shared root before it supersedes A's fresh reload.
      let C = await t.navigate("/c");
      await C.loaders.root.resolve("ROOT AFTER MUTATION");
      await C.loaders.c.resolve("C");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/c" },
        loaderData: { root: "ROOT AFTER MUTATION", c: "C" },
      });
      expect(C.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(A.loaders.root.signal.aborted).toBe(true);
      expect(A.fetcher).toMatchObject({ state: "idle", data: "ACTION A" });

      // A's aborted reload must not overwrite C, and the invalidation can now
      // clear: another sibling navigation should reuse C's fresh root data.
      await A.loaders.root.resolve("ROOT FROM ABORTED REVALIDATION");
      let D = await t.navigate("/d");
      expect(D.loaders.root.stub).not.toHaveBeenCalled();
      await D.loaders.d.resolve("D");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/d" },
        loaderData: { root: "ROOT AFTER MUTATION", d: "D" },
      });
      expect(A.fetcher).toMatchObject({ state: "idle", data: "ACTION A" });
    },
  );

  it.each(["action", "navigation"])(
    "preserves newer fetcher data when an older %s reload cleans up",
    async (cleanupType) => {
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            loader: true,
            action: true,
            children: [
              { id: "b", path: "b", loader: true },
              { id: "c", path: "c", loader: true },
              { id: "resource", path: "resource", loader: true },
            ],
          },
        ],
        hydrationData: { loaderData: { root: "ROOT" } },
      });
      let initial = await t.fetch("/resource", "resource");
      await initial.loaders.resource.resolve("RESOURCE 0");

      let A = await t.fetch("/", "mutation", {
        formMethod: "post",
        formData: createFormData({}),
      });
      t.shimHelper(A.loaders, "fetch", "loader", "b");
      t.shimHelper(A.loaders, "fetch", "loader", "resource");
      let B = await t.navigate("/b", { defaultShouldRevalidate: false });
      await A.actions.root.resolve("ACTION");
      expect(A.loaders.resource.stub).toHaveBeenCalledTimes(1);
      await B.loaders.b.resolve("B");

      // Retained mutation invalidation makes C revalidate the resource while
      // A's older reload is still pending.
      let C = await t.navigate("/c", undefined, ["resource"]);
      expect(C.loaders.resource.stub).toHaveBeenCalledTimes(1);
      await A.loaders.root.resolve("ROOT AFTER MUTATION");
      await A.loaders.b.resolve("B AFTER MUTATION");
      await A.loaders.resource.resolve("RESOURCE FROM A");
      expect(t.fetchers.mutation).toMatchObject({
        state: "idle",
        data: "ACTION",
      });
      expect(t.router.state.navigation.state).toBe("loading");

      // A's cleanup must leave C's controller available so this explicit load
      // can abort C's older resource request.
      let D = await t.fetch("/resource", "resource");
      let superseded = C.loaders.resource;
      if (cleanupType === "action") {
        await D.loaders.resource.resolve("RESOURCE 2");
      }
      await C.loaders.root.resolve("ROOT AFTER MUTATION");
      await C.loaders.c.resolve("C");
      await C.loaders.resource.resolve("RESOURCE 1");

      if (cleanupType === "navigation") {
        // If D is still pending when C completes, C's cleanup must preserve
        // D's controller so a subsequent explicit load can abort it in turn.
        let E = await t.fetch("/resource", "resource");
        await E.loaders.resource.resolve("RESOURCE 3");
        await D.loaders.resource.resolve("RESOURCE 2");
        superseded = D.loaders.resource;
      }

      expect(t.fetchers.resource).toMatchObject({
        state: "idle",
        data: cleanupType === "action" ? "RESOURCE 2" : "RESOURCE 3",
      });
      expect(superseded.signal.aborted).toBe(true);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/c" },
        loaderData: { root: "ROOT AFTER MUTATION", c: "C" },
        errors: null,
      });
      expect(t.router._internalFetchControllers.size).toBe(0);
    },
  );
});
