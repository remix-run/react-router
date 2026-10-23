import { IDLE_NAVIGATION } from "../../lib/router/router";
import type { DataStrategyResult } from "../../lib/router/utils";

import {
  cleanup,
  createDeferred,
  setup,
  TASK_ROUTES,
} from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

afterEach(() => cleanup());

it("preserves mutation revalidation across overlapping navigations", async () => {
  let t = setup({
    routes: TASK_ROUTES,
    initialEntries: ["/"],
    hydrationData: { loaderData: { root: "ROOT", index: "INDEX" } },
  });

  // A is still mutating when B reads the root loader's old data.
  let A = await t.fetch("/tasks", "mutation", {
    formMethod: "post",
    formData: createFormData({}),
  });
  t.shimHelper(A.loaders, "fetch", "loader", "tasks");
  let B = await t.navigate("/tasks");
  expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);

  // A finishes and revalidates B's destination, but those fresh reads are slower
  // than the reads B started before A completed.
  await A.actions.tasks.resolve("ACTION");
  expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
  await B.loaders.root.resolve("ROOT");
  await B.loaders.tasks.resolve("TASKS");
  expect(t.router.state).toMatchObject({
    navigation: IDLE_NAVIGATION,
    location: { pathname: "/tasks" },
    loaderData: { root: "ROOT", tasks: "TASKS" },
  });

  // C must still obtain fresh root data if its completion cancels A's pending
  // revalidation. Resolving every deferred also verifies the final idle state.
  let C = await t.navigate("/tasks/1");
  await C.loaders.root.resolve("ROOT*");
  await C.loaders.tasksId.resolve("TASK 1");
  await A.loaders.root.resolve("ROOT MUTATION");
  await A.loaders.tasks.resolve("TASKS*");
  expect(t.router.state).toMatchObject({
    navigation: IDLE_NAVIGATION,
    location: { pathname: "/tasks/1" },
    loaderData: { root: "ROOT*", tasksId: "TASK 1" },
    errors: null,
  });
  expect(t.fetchers.mutation).toMatchObject({ state: "idle", data: "ACTION" });
  expect(C.loaders.root.stub).toHaveBeenCalledTimes(1);

  // Once the latest navigation covers the mutation, ordinary child navigations
  // can reuse the root data again.
  let D = await t.navigate("/tasks/2");
  await D.loaders.root.resolve("UNEXPECTED ROOT");
  await D.loaders.tasksId.resolve("TASK 2");
  expect(t.router.state).toMatchObject({
    navigation: IDLE_NAVIGATION,
    location: { pathname: "/tasks/2" },
    loaderData: { root: "ROOT*", tasksId: "TASK 2" },
  });
  expect(D.loaders.root.stub).not.toHaveBeenCalled();
});

it("preserves newer mutation revalidation when an older fetcher reload commits", async () => {
  let t = setup({
    routes: TASK_ROUTES,
    initialEntries: ["/"],
    hydrationData: { loaderData: { root: "ROOT", index: "INDEX" } },
  });

  let B = await t.fetch("/tasks", "older", {
    formMethod: "post",
    formData: createFormData({}),
  });
  await B.actions.tasks.resolve("OLDER ACTION");
  let A = await t.fetch("/tasks", "newer", {
    formMethod: "post",
    formData: createFormData({}),
  });
  await A.actions.tasks.resolve("NEWER ACTION");

  // B's data predates A's mutation. Its commit must not clear A's outstanding
  // requirement to revalidate shared route data.
  await B.loaders.root.resolve("ROOT OLDER");
  await B.loaders.index.resolve("INDEX OLDER");
  expect(t.router.state.loaderData.root).toBe("ROOT OLDER");
  expect(t.fetchers.newer.state).toBe("loading");

  let C = await t.navigate("/tasks");
  await C.loaders.root.resolve("ROOT NEWEST");
  await C.loaders.tasks.resolve("TASKS NEWEST");
  await A.loaders.root.resolve("ROOT NEWER");
  await A.loaders.index.resolve("INDEX NEWER");
  expect(t.router.state).toMatchObject({
    navigation: IDLE_NAVIGATION,
    location: { pathname: "/tasks" },
    loaderData: { root: "ROOT NEWEST", tasks: "TASKS NEWEST" },
    errors: null,
  });
  expect(t.fetchers.older).toMatchObject({
    state: "idle",
    data: "OLDER ACTION",
  });
  expect(t.fetchers.newer).toMatchObject({
    state: "idle",
    data: "NEWER ACTION",
  });
  expect(C.loaders.root.stub).toHaveBeenCalledTimes(1);
});

it("revalidates shared data when the mutation finishes after an older navigation", async () => {
  let t = setup({
    routes: TASK_ROUTES,
    initialEntries: ["/"],
    hydrationData: { loaderData: { root: "ROOT", index: "INDEX" } },
  });

  let A = await t.fetch("/tasks", "mutation", {
    formMethod: "post",
    formData: createFormData({}),
  });
  t.shimHelper(A.loaders, "fetch", "loader", "tasksId");
  let B = await t.navigate("/tasks");
  await B.loaders.root.resolve("ROOT");
  await B.loaders.tasks.resolve("TASKS");

  // C begins before the mutation has finished. Even though B committed while A
  // was still submitting, A must reload the shared root after its action ends.
  let C = await t.navigate("/tasks/1");
  await A.actions.tasks.resolve("ACTION");
  await C.loaders.root.resolve("ROOT BEFORE MUTATION");
  await C.loaders.tasksId.resolve("TASK 1");
  await A.loaders.root.resolve("ROOT*");
  await A.loaders.tasksId.resolve("TASK 1*");
  expect(t.router.state).toMatchObject({
    navigation: IDLE_NAVIGATION,
    location: { pathname: "/tasks/1" },
    loaderData: { root: "ROOT*", tasksId: "TASK 1*" },
    errors: null,
  });
  expect(t.fetchers.mutation).toMatchObject({ state: "idle", data: "ACTION" });
  expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
});

it.each(["shouldRevalidate", "defaultShouldRevalidate"])(
  "honors %s opt-outs during overlapping mutation revalidation",
  async (optOut) => {
    let t = setup({
      routes: [
        {
          ...TASK_ROUTES[0],
          shouldRevalidate:
            optOut === "shouldRevalidate" ? () => false : undefined,
        },
      ],
      initialEntries: ["/"],
      hydrationData: { loaderData: { root: "ROOT", index: "INDEX" } },
    });
    let opts =
      optOut === "defaultShouldRevalidate"
        ? { defaultShouldRevalidate: false }
        : {};

    let A = await t.fetch("/tasks", "mutation", {
      ...opts,
      formMethod: "post",
      formData: createFormData({}),
    });
    t.shimHelper(A.loaders, "fetch", "loader", "tasks");
    let B = await t.navigate("/tasks", opts);
    await A.actions.tasks.resolve("ACTION");
    await B.loaders.root.resolve("UNEXPECTED ROOT B");
    await B.loaders.tasks.resolve("TASKS");
    let C = await t.navigate("/tasks/1", opts);
    await C.loaders.root.resolve("UNEXPECTED ROOT C");
    await C.loaders.tasksId.resolve("TASK 1");
    await A.loaders.root.resolve("UNEXPECTED ROOT A");
    await A.loaders.tasks.resolve("TASKS*");

    expect(t.router.state).toMatchObject({
      navigation: IDLE_NAVIGATION,
      location: { pathname: "/tasks/1" },
      loaderData: { root: "ROOT", tasksId: "TASK 1" },
      errors: null,
    });
    expect(t.fetchers.mutation).toMatchObject({
      state: "idle",
      data: "ACTION",
    });
    expect(A.loaders.root.stub).not.toHaveBeenCalled();
    expect(B.loaders.root.stub).not.toHaveBeenCalled();
    expect(C.loaders.root.stub).not.toHaveBeenCalled();
  },
);

describe.each(["default strategy", "strategy resolving every match"])(
  "with a %s",
  (strategy) => {
    it.each([400, 500])(
      "does not retain invalidation for a returned %i action",
      async (status) => {
        let t = setup({
          routes: TASK_ROUTES,
          dataStrategy:
            strategy === "strategy resolving every match"
              ? async ({ matches }) => {
                  // Framework Mode resolves every match before deciding whether
                  // its loader should actually run.
                  let results: Record<string, DataStrategyResult> = {};
                  await Promise.all(
                    matches.map((m) =>
                      m.resolve(async (handler) => {
                        if (m.shouldCallHandler()) {
                          results[m.route.id] = {
                            type: "data",
                            result: await handler(),
                          };
                        }
                      }),
                    ),
                  );
                  return results;
                }
              : undefined,
          initialEntries: ["/"],
          hydrationData: { loaderData: { root: "ROOT", index: "INDEX" } },
        });
        let A = await t.fetch("/tasks", "mutation", {
          formMethod: "post",
          formData: createFormData({}),
        });
        t.shimHelper(A.loaders, "fetch", "loader", "tasks");
        let B = await t.navigate("/tasks");
        await A.actions.tasks.resolve(new Response("BAD", { status }));
        expect(A.loaders.root.stub).not.toHaveBeenCalled();
        await B.loaders.root.resolve("ROOT");
        await B.loaders.tasks.resolve("TASKS");
        expect(t.router.state.navigation.state).toBe("idle");

        let C = await t.navigate("/tasks/1");
        await C.loaders.tasksId.resolve("TASK 1");
        let stateAfterChild = t.router.state.navigation.state;
        await C.loaders.root.resolve("UNEXPECTED ROOT RELOAD");
        await A.loaders.tasks.resolve("TASKS UNUSED");
        expect(t.router.state.navigation.state).toBe("idle");
        expect(t.fetchers.mutation).toMatchObject({
          state: "idle",
          data: "BAD",
        });
        expect(stateAfterChild).toBe("idle");
        expect(C.loaders.root.stub).not.toHaveBeenCalled();
      },
    );
  },
);

describe.each([
  "call site",
  "route",
  "route with call-site opt-out",
  "data strategy",
  "data strategy without resolve",
  "route with legacy strategy without resolve",
])("with a %s revalidation opt-in", (optIn) => {
  it.each([400, 500])(
    "preserves revalidation after a returned %i action",
    async (status) => {
      let freshRoot = createDeferred();
      let rootOptIns = 0;
      let t = setup({
        routes: [
          {
            ...TASK_ROUTES[0],
            shouldRevalidate: optIn.startsWith("route")
              ? ({ actionStatus, defaultShouldRevalidate }) =>
                  actionStatus != null && actionStatus >= 400
                    ? true
                    : defaultShouldRevalidate
              : undefined,
          },
        ],
        dataStrategy: optIn.includes("strategy")
          ? async ({ matches }) => {
              let selected = matches.filter((m) =>
                optIn === "route with legacy strategy without resolve"
                  ? m.shouldLoad
                  : m.shouldCallHandler(
                      (m.shouldRevalidateArgs?.actionStatus ?? 0) >= 400
                        ? true
                        : undefined,
                    ),
              );
              return Object.fromEntries(
                await Promise.all(
                  selected.map(async (m) => {
                    if (
                      optIn.includes("without resolve") &&
                      m.route.id === "root" &&
                      (m.shouldRevalidateArgs?.actionStatus ?? 0) >= 400
                    ) {
                      rootOptIns++;
                      return [
                        m.route.id,
                        { type: "data", result: await freshRoot.promise },
                      ];
                    }
                    return [m.route.id, await m.resolve()];
                  }),
                ),
              );
            }
          : undefined,
        initialEntries: ["/"],
        hydrationData: { loaderData: { root: "ROOT", index: "INDEX" } },
      });
      let A = await t.fetch("/tasks", "mutation", {
        formMethod: "post",
        formData: createFormData({}),
        defaultShouldRevalidate:
          optIn === "call site"
            ? true
            : optIn === "route with call-site opt-out"
              ? false
              : undefined,
      });
      t.shimHelper(A.loaders, "fetch", "loader", "tasks");
      let B = await t.navigate("/tasks");
      await A.actions.tasks.resolve(new Response("BAD", { status }));
      let returnsDataDirectly = optIn.includes("without resolve");
      expect(rootOptIns).toBe(returnsDataDirectly ? 1 : 0);
      expect(A.loaders.root.stub).toHaveBeenCalledTimes(
        returnsDataDirectly ? 0 : 1,
      );
      await B.loaders.root.resolve("ROOT");
      await B.loaders.tasks.resolve("TASKS");

      let C = await t.navigate("/tasks/1");
      await C.loaders.tasksId.resolve("TASK 1");
      expect(C.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(t.router.state.navigation.state).toBe("loading");
      await C.loaders.root.resolve("ROOT*");
      await freshRoot.resolve("ROOT FROM STRATEGY");
      await A.loaders.root.resolve("ROOT FROM A");
      await A.loaders.tasks.resolve("TASKS FROM A");
      expect(t.router.state).toMatchObject({
        navigation: IDLE_NAVIGATION,
        location: { pathname: "/tasks/1" },
        loaderData: { root: "ROOT*", tasksId: "TASK 1" },
      });
      expect(t.fetchers.mutation).toMatchObject({ state: "idle", data: "BAD" });
    },
  );
});
