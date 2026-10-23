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
});
