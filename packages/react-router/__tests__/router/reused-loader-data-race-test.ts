/**
 * https://github.com/remix-run/react-router/issues/15549
 *
 * A navigation skips the layout loader (`shouldRevalidate: false`) and reuses
 * its current data. While the destination's child loader is pending, a
 * background fetcher revalidation fails at an ancestor boundary, which removes
 * the layout data from `state.loaderData`. The navigation must not commit an
 * idle destination with the reused layout data missing.
 */
import { createMemoryHistory } from "../../lib/router/history";
import { type Router, createRouter } from "../../lib/router/router";
import { redirect } from "../../lib/router/utils";
import { createDeferred, createFormData, tick } from "./utils/utils";

let router: Router;

afterEach(() => {
  router.dispose();
  // @ts-expect-error
  router = null;
});

function setup() {
  let mutateDfd = createDeferred();
  let saveDfd = createDeferred();
  let staleRootDfd = createDeferred();
  let childDfd = createDeferred();
  let layoutLoader = jest.fn(() => "LAYOUT");

  router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/layout/start"] }),
    routes: [
      {
        id: "root",
        path: "/",
        hasErrorBoundary: true,
        loader: ({ request }) =>
          new URL(request.url).pathname === "/save"
            ? staleRootDfd.promise
            : "ROOT",
        children: [
          {
            id: "layout",
            path: "layout",
            loader: layoutLoader,
            shouldRevalidate: () => false,
            children: [
              {
                id: "child",
                path: ":id",
                loader: () => childDfd.promise,
              },
            ],
          },
          {
            id: "save",
            path: "save",
            action: async () => {
              await saveDfd.promise;
              return redirect("/layout/next");
            },
          },
          {
            id: "mutate",
            path: "mutate",
            action: () => mutateDfd.promise,
          },
        ],
      },
    ],
    hydrationData: {
      loaderData: { root: "ROOT", layout: "LAYOUT", child: "START" },
    },
  });
  router.initialize();

  return { mutateDfd, saveDfd, staleRootDfd, childDfd, layoutLoader };
}

describe("reused loader data during concurrent fetcher revalidation", () => {
  it("does not lose reused layout data when a background revalidation errors at an ancestor", async () => {
    let t = setup();
    let incompleteIdleStates: unknown[] = [];
    router.subscribe((state) => {
      if (
        state.navigation.state === "idle" &&
        state.location.pathname === "/layout/next" &&
        state.errors == null &&
        state.loaderData.layout === undefined
      ) {
        incompleteIdleStates.push(state.loaderData);
      }
    });

    // Background fetcher submission is pending...
    let fetcherPromise = router.fetch("bg", "layout", "/mutate", {
      formMethod: "post",
      formData: createFormData({}),
    });
    // ...while a navigation submission starts
    let navPromise = router.navigate("/save", {
      formMethod: "post",
      formData: createFormData({}),
    });

    // The fetcher action completes and revalidates against the /save matches
    await t.mutateDfd.resolve({ ok: true });
    // The navigation action redirects to /layout/next, which reuses layout
    // data (shouldRevalidate: false) and waits on the child loader
    await t.saveDfd.resolve();
    await tick();
    expect(router.state.navigation.state).toBe("loading");
    expect(router.state.navigation.location?.pathname).toBe("/layout/next");

    // The stale background revalidation fails at the root boundary, which
    // drops data for routes below it (including the reused layout data)
    await t.staleRootDfd.reject(new Error("background root failed"));
    await fetcherPromise;
    expect(router.state.errors?.root).toEqual(
      new Error("background root failed"),
    );

    // The navigation completes
    await t.childDfd.resolve("NEXT");
    await navPromise;

    expect(incompleteIdleStates).toEqual([]);
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.location.pathname).toBe("/layout/next");
    expect(router.state.errors).toBe(null);
    expect(t.layoutLoader).not.toHaveBeenCalled();
    expect(router.state.loaderData).toEqual({
      root: "ROOT",
      layout: "LAYOUT",
      child: "NEXT",
    });
  });

  it("does not restore reused data below a navigation error boundary", async () => {
    let t = setup();
    let fetcherPromise = router.fetch("bg", "layout", "/mutate", {
      formMethod: "post",
      formData: createFormData({}),
    });
    let navPromise = router.navigate("/save", {
      formMethod: "post",
      formData: createFormData({}),
    });
    await t.mutateDfd.resolve({ ok: true });
    await t.saveDfd.resolve();
    await tick();
    await t.staleRootDfd.reject(new Error("background root failed"));
    await fetcherPromise;

    // The destination child loader fails and bubbles to the root boundary
    await t.childDfd.reject(new Error("child failed"));
    await navPromise;

    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.location.pathname).toBe("/layout/next");
    expect(router.state.errors).toEqual({ root: new Error("child failed") });
    expect(router.state.loaderData).toEqual({ root: "ROOT" });
  });
});
