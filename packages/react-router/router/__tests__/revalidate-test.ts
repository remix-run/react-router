import { IDLE_NAVIGATION } from "../index";
import { cleanup, setup, TASK_ROUTES } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("router.revalidate", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  it("handles uninterrupted revalidation in an idle state (from POP)", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let key = t.router.state.location.key;
    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await R.loaders.root.resolve("ROOT_DATA*");
    await R.loaders.index.resolve("INDEX_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        index: "INDEX_DATA*",
      },
    });
    expect(t.router.state.location.key).toBe(key);
    expect(t.history.push).not.toHaveBeenCalled();
    expect(t.history.replace).not.toHaveBeenCalled();
  });

  it("handles uninterrupted revalidation in an idle state (from PUSH)", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let N = await t.navigate("/");
    await N.loaders.root.resolve("ROOT_DATA");
    await N.loaders.index.resolve("INDEX_DATA");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });
    // @ts-expect-error
    expect(t.history.push.mock.calls.length).toBe(1);

    let key = t.router.state.location.key;
    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await R.loaders.root.resolve("ROOT_DATA*");
    await R.loaders.index.resolve("INDEX_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        index: "INDEX_DATA*",
      },
    });
    expect(t.router.state.location.key).toBe(key);
    // @ts-ignore
    expect(t.history.push.mock.calls.length).toBe(1);
    expect(t.history.replace).not.toHaveBeenCalled();
  });

  it("handles revalidation when a hash is present", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/#hash"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let key = t.router.state.location.key;
    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await R.loaders.root.resolve("ROOT_DATA*");
    await R.loaders.index.resolve("INDEX_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        index: "INDEX_DATA*",
      },
    });
    expect(t.router.state.location.hash).toBe("#hash");
    expect(t.router.state.location.key).toBe(key);
    expect(t.history.push).not.toHaveBeenCalled();
    expect(t.history.replace).not.toHaveBeenCalled();
  });

  it("handles revalidation interrupted by a <Link> navigation", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    let N = await t.navigate("/tasks");
    // Revalidation was aborted
    expect(R.loaders.root.signal.aborted).toBe(true);
    expect(R.loaders.index.signal.aborted).toBe(true);
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "loading",
        location: { pathname: "/tasks" },
      },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    // Land the revalidation calls - should no-op
    await R.loaders.root.resolve("ROOT_DATA interrupted");
    await R.loaders.index.resolve("INDEX_DATA interrupted");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "loading",
        location: { pathname: "/tasks" },
      },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    // Land the navigation calls - should update state and end the revalidation
    await N.loaders.root.resolve("ROOT_DATA*");
    await N.loaders.tasks.resolve("TASKS_DATA");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        tasks: "TASKS_DATA",
      },
    });
    expect(t.history.push).toHaveBeenCalledWith(
      t.router.state.location,
      t.router.state.location.state
    );
  });

  it("handles revalidation interrupted by a <Form method=get> navigation", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    let N = await t.navigate("/tasks", {
      formMethod: "get",
      formData: createFormData({ key: "value" }),
    });
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "loading",
        location: {
          pathname: "/tasks",
          search: "?key=value",
        },
        formMethod: "get",
        formData: createFormData({ key: "value" }),
      },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });
    await R.loaders.root.resolve("ROOT_DATA interrupted");
    await R.loaders.index.resolve("INDEX_DATA interrupted");
    await N.loaders.root.resolve("ROOT_DATA*");
    await N.loaders.tasks.resolve("TASKS_DATA");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        tasks: "TASKS_DATA",
      },
    });
    expect(t.history.push).toHaveBeenCalledWith(
      t.router.state.location,
      t.router.state.location.state
    );
  });

  it("handles revalidation interrupted by a <Form method=post> navigation", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    let N = await t.navigate("/tasks", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "submitting",
        location: { pathname: "/tasks" },
      },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    // Aborted by the navigation, resolving should no-op
    expect(R.loaders.root.signal.aborted).toBe(true);
    expect(R.loaders.index.signal.aborted).toBe(true);
    await R.loaders.root.resolve("ROOT_DATA interrupted");
    await R.loaders.index.resolve("INDEX_DATA interrupted");

    await N.actions.tasks.resolve("TASKS_ACTION");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "loading",
        location: { pathname: "/tasks" },
      },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await N.loaders.root.resolve("ROOT_DATA*");
    await N.loaders.tasks.resolve("TASKS_DATA");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        tasks: "TASKS_DATA",
      },
      actionData: {
        tasks: "TASKS_ACTION",
      },
    });
    expect(t.history.push).toHaveBeenCalledWith(
      t.router.state.location,
      t.router.state.location.state
    );
  });

  it("handles <Link> navigation interrupted by a revalidation", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let N = await t.navigate("/tasks");
    expect(N.loaders.root.stub).not.toHaveBeenCalled();
    expect(N.loaders.tasks.stub).toHaveBeenCalled();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "loading" },
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    let R = await t.revalidate();
    expect(R.loaders.root.stub).toHaveBeenCalled();
    expect(R.loaders.tasks.stub).toHaveBeenCalled();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "loading" },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await N.loaders.tasks.resolve("TASKS_DATA interrupted");
    await R.loaders.root.resolve("ROOT_DATA*");
    await R.loaders.tasks.resolve("TASKS_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        tasks: "TASKS_DATA*",
      },
    });
    expect(t.history.push).toHaveBeenCalledWith(
      t.router.state.location,
      t.router.state.location.state
    );
  });

  it("handles <Form method=get> navigation interrupted by a revalidation", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let N = await t.navigate("/tasks", {
      formMethod: "get",
      formData: createFormData({ key: "value" }),
    });
    // Called due to search param changing
    expect(N.loaders.root.stub).toHaveBeenCalled();
    expect(N.loaders.tasks.stub).toHaveBeenCalled();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "loading",
        location: {
          pathname: "/tasks",
          search: "?key=value",
        },
      },
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    let R = await t.revalidate();
    expect(R.loaders.root.stub).toHaveBeenCalled();
    expect(R.loaders.tasks.stub).toHaveBeenCalled();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "loading",
        location: {
          pathname: "/tasks",
          search: "?key=value",
        },
      },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await N.loaders.root.resolve("ROOT_DATA interrupted");
    await N.loaders.tasks.resolve("TASKS_DATA interrupted");
    await R.loaders.root.resolve("ROOT_DATA*");
    await R.loaders.tasks.resolve("TASKS_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        tasks: "TASKS_DATA*",
      },
    });
    expect(t.history.push).toHaveBeenCalledWith(
      t.router.state.location,
      t.router.state.location.state
    );
  });

  it("handles <Form method=post> navigation interrupted by a revalidation during action phase", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let N = await t.navigate("/tasks", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "submitting" },
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "submitting" },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await N.actions.tasks.resolve("TASKS_ACTION");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "loading" },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
      actionData: {
        tasks: "TASKS_ACTION",
      },
    });

    await N.loaders.root.resolve("ROOT_DATA interrupted");
    await N.loaders.tasks.resolve("TASKS_DATA interrupted");
    await R.loaders.root.resolve("ROOT_DATA*");
    await R.loaders.tasks.resolve("TASKS_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        tasks: "TASKS_DATA*",
      },
    });
    expect(t.history.push).toHaveBeenCalledWith(
      t.router.state.location,
      t.router.state.location.state
    );

    // Action was not resubmitted
    expect(N.actions.tasks.stub.mock.calls.length).toBe(1);
    // This is sort of an implementation detail.  Internally we do not start
    // a new navigation, but our helpers return the new "loaders" from the
    // revalidate.  The key here is that together, loaders only got called once
    expect(N.loaders.root.stub.mock.calls.length).toBe(0);
    expect(N.loaders.tasks.stub.mock.calls.length).toBe(0);
    expect(R.loaders.root.stub.mock.calls.length).toBe(1);
    expect(R.loaders.tasks.stub.mock.calls.length).toBe(1);
  });

  it("handles <Form method=post> navigation interrupted by a revalidation during loading phase", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let N = await t.navigate("/tasks", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "submitting" },
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await N.actions.tasks.resolve("TASKS_ACTION");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "loading" },
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
      actionData: {
        tasks: "TASKS_ACTION",
      },
    });

    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: { state: "loading" },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
      actionData: {
        tasks: "TASKS_ACTION",
      },
    });

    await N.loaders.root.resolve("ROOT_DATA interrupted");
    await N.loaders.tasks.resolve("TASKS_DATA interrupted");
    await R.loaders.root.resolve("ROOT_DATA*");
    await R.loaders.tasks.resolve("TASKS_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        tasks: "TASKS_DATA*",
      },
      actionData: {
        tasks: "TASKS_ACTION",
      },
    });
    expect(t.history.push).toHaveBeenCalledWith(
      t.router.state.location,
      t.router.state.location.state
    );

    // Action was not resubmitted
    expect(N.actions.tasks.stub.mock.calls.length).toBe(1);
    // Because we interrupted during the loading phase, all loaders got re-called
    expect(N.loaders.root.stub.mock.calls.length).toBe(1);
    expect(N.loaders.tasks.stub.mock.calls.length).toBe(1);
    expect(R.loaders.root.stub.mock.calls.length).toBe(1);
    expect(R.loaders.tasks.stub.mock.calls.length).toBe(1);
  });

  it("handles redirects returned from revalidations", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let key = t.router.state.location.key;
    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await R.loaders.root.resolve("ROOT_DATA*");
    let N = await R.loaders.index.redirectReturn("/tasks");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: {
        state: "loading",
      },
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });
    expect(t.router.state.location.key).toBe(key);

    await N.loaders.root.resolve("ROOT_DATA redirect");
    await N.loaders.tasks.resolve("TASKS_DATA");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/tasks" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA redirect",
        tasks: "TASKS_DATA",
      },
    });
    expect(t.router.state.location.key).not.toBe(key);

    let B = await t.navigate(-1);
    await B.loaders.index.resolve("INDEX_DATA 2");
    // PUSH on the revalidation redirect means back button takes us back to
    // the page that triggered the revalidation redirect
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA redirect",
        index: "INDEX_DATA 2",
      },
    });
    expect(t.router.state.location.key).toBe(key);
  });

  it("handles errors from revalidations", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let key = t.router.state.location.key;
    let R = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    await R.loaders.root.reject("ROOT_ERROR");
    await R.loaders.index.resolve("INDEX_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: undefined,
        index: "INDEX_DATA*",
      },
      errors: {
        root: "ROOT_ERROR",
      },
    });
    expect(t.router.state.location.key).toBe(key);
  });

  it("leverages shouldRevalidate on revalidation routes", async () => {
    let shouldRevalidate = jest.fn(({ nextUrl }) => {
      return nextUrl.searchParams.get("reload") === "1";
    });
    let t = setup({
      routes: [
        {
          id: "root",
          loader: true,
          shouldRevalidate: (...args) => shouldRevalidate(...args),
          children: [
            {
              id: "index",
              index: true,
              loader: true,
              shouldRevalidate: (...args) => shouldRevalidate(...args),
            },
          ],
        },
      ],
      initialEntries: ["/?reload=0"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let R = await t.revalidate();
    expect(R.loaders.root.stub).not.toHaveBeenCalled();
    expect(R.loaders.index.stub).not.toHaveBeenCalled();
    expect(t.router.state).toMatchObject({
      historyAction: "POP",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA",
        index: "INDEX_DATA",
      },
    });

    let N = await t.navigate("/?reload=1");
    await N.loaders.root.resolve("ROOT_DATA*");
    await N.loaders.index.resolve("INDEX_DATA*");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA*",
        index: "INDEX_DATA*",
      },
    });

    let R2 = await t.revalidate();
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "loading",
      loaderData: {
        root: "ROOT_DATA*",
        index: "INDEX_DATA*",
      },
    });

    await R2.loaders.root.resolve("ROOT_DATA**");
    await R2.loaders.index.resolve("INDEX_DATA**");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: { pathname: "/" },
      navigation: IDLE_NAVIGATION,
      revalidation: "idle",
      loaderData: {
        root: "ROOT_DATA**",
        index: "INDEX_DATA**",
      },
    });
  });

  it("triggers revalidation on fetcher loads", async () => {
    let t = setup({
      routes: TASK_ROUTES,
      initialEntries: ["/"],
      hydrationData: {
        loaderData: {
          root: "ROOT_DATA",
          index: "INDEX_DATA",
        },
      },
    });

    let key = "key";
    let F = await t.fetch("/", key);
    await F.loaders.root.resolve("ROOT_DATA*");
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "ROOT_DATA*",
    });

    let R = await t.revalidate();
    await R.loaders.root.resolve("ROOT_DATA**");
    await R.loaders.index.resolve("INDEX_DATA");
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "ROOT_DATA**",
    });
  });
});
