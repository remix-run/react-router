import { redirect } from "../../lib/router/utils";
import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

for (let unstable_customRouteDiscovery of [false, true]) {
  describe(`fetcher reload of an abandoned navigation (custom discovery: ${unstable_customRouteDiscovery})`, () => {
    afterEach(() => cleanup());

    async function startRace(withResource = false, removeResource = false) {
      let t = setup({
        future: { unstable_customRouteDiscovery },
        routes: [
          {
            id: "group",
            ErrorBoundary: () => null,
            children: [
              { id: "current", path: "/current", loader: true, action: true },
              { id: "previous", path: "/previous", loader: true },
              { id: "resource", path: "/resource", loader: true },
            ],
          },
          {
            id: "next",
            path: "/next",
            loader: true,
            ErrorBoundary: () => null,
          },
          { id: "redirect", path: "/redirect", loader: true },
        ],
        initialEntries: ["/current"],
        hydrationData: { loaderData: { current: "CURRENT" } },
      });
      if (withResource) {
        let initial = await t.fetch("/resource", "resource", "group");
        await initial.loaders.resource.resolve("RESOURCE 0");
      }
      if (removeResource) {
        t._internalSetRoutes(
          t.router.routes.map((route) =>
            route.id === "group"
              ? {
                  ...route,
                  children: route.children?.filter((r) => r.id !== "resource"),
                }
              : route,
          ),
        );
      }
      let mutation = await t.fetch("/current", "mutation", "current", {
        formMethod: "post",
        formData: createFormData({}),
      });
      t.shimHelper(mutation.loaders, "fetch", "loader", "previous");
      if (withResource) {
        t.shimHelper(mutation.loaders, "fetch", "loader", "resource");
      }
      let previous = await t.navigate(
        "/previous",
        undefined,
        withResource ? ["resource"] : undefined,
      );
      await mutation.actions.current.resolve("ACTION");
      expect(mutation.loaders.previous.stub).toHaveBeenCalledTimes(1);

      // The mutation is reloading /previous when /next abandons that navigation.
      let next = await t.navigate("/next");
      expect(previous.loaders.previous.signal.aborted).toBe(true);
      expect(mutation.loaders.previous.signal.aborted).toBe(false);
      return { t, mutation, next };
    }

    it.each(["data", "error", "redirect"])(
      "ignores an abandoned loader's %s without disturbing the current page or newer navigation",
      async (outcome) => {
        let { t, mutation, next } = await startRace();
        if (outcome === "error") {
          await mutation.loaders.previous.reject(
            new Response("ABANDONED ERROR", { status: 403 }),
          );
        } else {
          await mutation.loaders.previous.resolve(
            outcome === "redirect" ? redirect("/redirect") : "ABANDONED DATA",
          );
        }

        expect(t.router.state.loaderData).toEqual({ current: "CURRENT" });
        expect(t.router.state.errors).toBeNull();
        expect(t.router.state.location.pathname).toBe("/current");
        expect(t.router.state.matches.map((m) => m.route.id)).toEqual([
          "group",
          "current",
        ]);
        expect(t.router.state.navigation).toMatchObject({
          state: "loading",
          location: { pathname: "/next" },
        });
        expect(next.loaders.next.signal.aborted).toBe(false);
        expect(mutation.fetcher).toMatchObject({
          state: "idle",
          data: "ACTION",
        });

        await next.loaders.next.resolve("NEXT");
        expect(t.router.state).toMatchObject({
          location: { pathname: "/next" },
          navigation: { state: "idle" },
          loaderData: { next: "NEXT" },
          errors: null,
        });
        expect(t.router._internalFetchControllers.size).toBe(0);
      },
    );

    it("still applies the newer navigation's error", async () => {
      let { t, mutation, next } = await startRace();
      await mutation.loaders.previous.resolve("ABANDONED DATA");
      await next.loaders.next.reject(new Response("DENIED", { status: 403 }));
      expect(t.router.state.location.pathname).toBe("/next");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toMatchObject({
        next: { status: 403, data: "DENIED" },
      });
      expect(t.router.state.loaderData).not.toHaveProperty("current");
      expect(t.router.state.loaderData).not.toHaveProperty("previous");
      expect(mutation.fetcher).toMatchObject({ state: "idle", data: "ACTION" });
    });

    it("does not restore an unmounted mutation when its abandoned reload finishes", async () => {
      let { t, mutation, next } = await startRace();
      t.router.deleteFetcher("mutation");
      await mutation.loaders.previous.resolve("ABANDONED DATA");
      expect(t.router.state.fetchers.has("mutation")).toBe(false);
      expect(t.router._internalFetchControllers.has("mutation")).toBe(false);
      expect(t.router.state.loaderData).toEqual({ current: "CURRENT" });
      await next.loaders.next.resolve("NEXT");
      expect(t.router._internalFetchControllers.size).toBe(0);
    });

    it.each([
      ["data", "POP"],
      ["error", "POP"],
      ["redirect", "POP"],
      ["data", "revalidation"],
      ["error", "revalidation"],
      ["redirect", "revalidation"],
    ])(
      "ignores an abandoned %s when %s reuses the same location key",
      async (outcome, interruption) => {
        let t = setup({
          future: { unstable_customRouteDiscovery },
          routes: [
            { id: "current", path: "/current", loader: true, action: true },
            { id: "previous", path: "/previous", loader: true },
            { id: "redirect", path: "/redirect", loader: true },
          ],
          initialEntries: [
            { pathname: "/previous", key: "previous-entry" },
            { pathname: "/current", key: "current-entry" },
          ],
          initialIndex: 1,
          hydrationData: { loaderData: { current: "CURRENT" } },
        });
        let mutation = await t.fetch("/current", "mutation", {
          formMethod: "post",
          formData: createFormData({}),
        });
        t.shimHelper(mutation.loaders, "fetch", "loader", "previous");
        await t.navigate(-1);
        await mutation.actions.current.resolve("ACTION");
        if (interruption === "POP") {
          await t.navigate(1);
        }
        let latest =
          interruption === "POP" ? await t.navigate(-1) : await t.revalidate();
        expect(t.router.state.navigation.location?.key).toBe("previous-entry");

        if (outcome === "error") {
          await mutation.loaders.previous.reject(new Error("ABANDONED ERROR"));
        } else {
          await mutation.loaders.previous.resolve(
            outcome === "redirect" ? redirect("/redirect") : "ABANDONED DATA",
          );
        }
        expect(t.router.state.loaderData).toEqual({ current: "CURRENT" });
        expect(t.router.state.errors).toBeNull();
        expect(t.router.state.location.pathname).toBe("/current");
        expect(t.router.state.navigation).toMatchObject({
          state: "loading",
          location: { pathname: "/previous", key: "previous-entry" },
        });
        expect(latest.loaders.previous.signal.aborted).toBe(false);
        expect(mutation.fetcher).toMatchObject({
          state: "idle",
          data: "ACTION",
        });
        await latest.loaders.previous.resolve("LATEST PREVIOUS");
        expect(t.router.state.loaderData).toEqual({
          previous: "LATEST PREVIOUS",
        });
        expect(t.router.state.navigation.state).toBe("idle");
      },
    );

    it.each(["error", "redirect"])(
      "ignores a secondary fetcher's %s from the abandoned reload",
      async (outcome) => {
        let { t, mutation, next } = await startRace(true);
        await mutation.loaders.previous.resolve("ABANDONED DATA");
        if (outcome === "error") {
          await mutation.loaders.resource.reject(new Error("ABANDONED ERROR"));
        } else {
          await mutation.loaders.resource.resolve(redirect("/redirect"));
        }
        expect(t.router.state.loaderData).toEqual({ current: "CURRENT" });
        expect(t.router.state.errors).toBeNull();
        expect(t.router.state.location.pathname).toBe("/current");
        expect(next.loaders.next.signal.aborted).toBe(false);
        expect(t.fetchers.resource).toMatchObject({
          state: "idle",
          data: "RESOURCE 0",
        });
        await next.loaders.next.resolve("NEXT");
        expect(t.router.state.loaderData).toEqual({ next: "NEXT" });
        expect(t.router.state.errors).toBeNull();
      },
    );

    it.each([
      ["pending", "RESOURCE 0", "loading"],
      ["complete", "RESOURCE NEW", "idle"],
      ["reset", null, "idle"],
      ["none", "RESOURCE 0", "idle"],
    ])(
      "preserves a secondary fetcher's ownership when its replacement is %s",
      async (replacement, expectedData, expectedState) => {
        let { t, mutation, next } = await startRace(true);
        let newer =
          replacement === "reset" || replacement === "none"
            ? undefined
            : await t.fetch("/resource?new", "resource", "group");
        if (replacement === "complete") {
          await newer!.loaders.resource.resolve("RESOURCE NEW");
        }
        if (replacement === "reset") {
          t.router.resetFetcher("resource");
        }
        await mutation.loaders.previous.resolve("ABANDONED DATA");
        await mutation.loaders.resource.resolve("RESOURCE OLD");
        expect(t.router.state.loaderData).toEqual({ current: "CURRENT" });
        expect(mutation.fetcher).toMatchObject({
          state: "idle",
          data: "ACTION",
        });
        expect(t.fetchers.resource).toMatchObject({
          state: expectedState,
          data: expectedData,
        });
        expect(newer?.loaders.resource.signal.aborted).not.toBe(true);
        if (replacement === "pending") {
          await newer!.loaders.resource.resolve("RESOURCE NEW");
        }
        expect(t.fetchers.resource).toMatchObject({
          state: "idle",
          data: newer ? "RESOURCE NEW" : expectedData,
        });
        await next.loaders.next.resolve("NEXT");
        expect(t.router.state.errors).toBeNull();
        expect(t.router._internalFetchControllers.size).toBe(0);
      },
    );

    it.each(["/item/2", "/item/1?new"])(
      "does not apply an abandoned reload of %s to the same route with different params or search",
      async (destination) => {
        let t = setup({
          future: { unstable_customRouteDiscovery },
          routes: [
            { id: "item", path: "/item/:id", loader: true, action: true },
            { id: "next", path: "/next", loader: true },
          ],
          initialEntries: ["/item/1"],
          hydrationData: { loaderData: { item: "ITEM 1" } },
        });
        let mutation = await t.fetch("/item/1", "mutation", {
          formMethod: "post",
          formData: createFormData({}),
        });
        await t.navigate(destination);
        await mutation.actions.item.resolve("ACTION");
        let next = await t.navigate("/next");
        await mutation.loaders.item.resolve("ABANDONED ITEM");
        expect(t.router.state.loaderData).toEqual({ item: "ITEM 1" });
        await next.loaders.next.resolve("NEXT");
        expect(t.router.state.loaderData).toEqual({ next: "NEXT" });
      },
    );

    it("settles a removed resource's controller-free reload without applying its obsolete 404", async () => {
      let { t, mutation, next } = await startRace(true, true);
      expect(mutation.loaders.resource.stub).not.toHaveBeenCalled();
      await mutation.loaders.previous.resolve("ABANDONED DATA");
      expect(t.router.state.loaderData).toEqual({ current: "CURRENT" });
      expect(t.router.state.errors).toBeNull();
      expect(t.fetchers.resource).toMatchObject({
        state: "idle",
        data: "RESOURCE 0",
      });
      await next.loaders.next.resolve("NEXT");
      expect(t.router.state.errors).toBeNull();
      expect(t.router._internalFetchControllers.size).toBe(0);
    });

    it("still commits a reload of the current page before a newer navigation completes", async () => {
      let t = setup({
        future: { unstable_customRouteDiscovery },
        routes: [
          { id: "current", path: "/", loader: true, action: true },
          { id: "next", path: "/next", loader: true },
        ],
        hydrationData: { loaderData: { current: "CURRENT" } },
      });
      let mutation = await t.fetch("/", "mutation", {
        formMethod: "post",
        formData: createFormData({}),
      });
      await mutation.actions.current.resolve("ACTION");
      let next = await t.navigate("/next");
      await mutation.loaders.current.resolve("CURRENT UPDATED");
      expect(t.router.state.loaderData).toEqual({ current: "CURRENT UPDATED" });
      expect(t.router.state.navigation.state).toBe("loading");
      await next.loaders.next.resolve("NEXT");
      expect(t.router.state.loaderData).toEqual({ next: "NEXT" });
    });
  });
}
