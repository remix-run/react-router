import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

function initializeTest() {
  return setup({
    routes: [
      {
        path: "",
        id: "root",
        loader: true,
        children: [
          {
            path: "/page",
            id: "page",
            loader: true,
            action: true,
          },
        ],
      },
    ],
    initialEntries: ["/page"],
    hydrationData: {
      loaderData: { root: "ROOT 0", page: "PAGE 0" },
    },
  });
}

describe("a 4xx submission interrupting the revalidation of a successful one", () => {
  afterEach(() => cleanup());

  it("still revalidates (navigation submissions)", async () => {
    let t = initializeTest();

    // A succeeds and its revalidation starts
    let A = await t.navigate("/page", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await A.actions.page.resolve("A ACTION");
    expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
    expect(A.loaders.page.stub).toHaveBeenCalledTimes(1);

    // B interrupts A's revalidation and is refused with a 400
    let B = await t.navigate("/page", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    expect(A.loaders.root.signal.aborted).toBe(true);
    expect(A.loaders.page.signal.aborted).toBe(true);
    await B.actions.page.resolve(new Response("B REFUSED", { status: 400 }));

    // A's mutation happened, so the loaders must still run once more
    await B.loaders.root.resolve("ROOT 1");
    await B.loaders.page.resolve("PAGE 1");

    expect({
      rootLoaderCalls: B.loaders.root.stub.mock.calls.length,
      pageLoaderCalls: B.loaders.page.stub.mock.calls.length,
      navigation: t.router.state.navigation.state,
      actionData: t.router.state.actionData,
      loaderData: t.router.state.loaderData,
    }).toEqual({
      rootLoaderCalls: 1,
      pageLoaderCalls: 1,
      navigation: "idle",
      actionData: { page: "B REFUSED" },
      loaderData: { root: "ROOT 1", page: "PAGE 1" },
    });
  });

  it("still revalidates (fetcher submissions)", async () => {
    let t = initializeTest();

    // A succeeds and its revalidation starts
    let A = await t.fetch("/page", "a", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await A.actions.page.resolve("A ACTION");
    expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
    expect(A.loaders.page.stub).toHaveBeenCalledTimes(1);

    // B is refused with a 400 while A's revalidation is still in flight
    let B = await t.fetch("/page", "b", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await B.actions.page.resolve(new Response("B REFUSED", { status: 400 }));

    // A's revalidation was aborted when B's (empty) revalidation landed
    expect(A.loaders.root.signal.aborted).toBe(true);
    expect(A.loaders.page.signal.aborted).toBe(true);
    await A.loaders.root.resolve("ROOT 1 (A)");
    await A.loaders.page.resolve("PAGE 1 (A)");

    // A's mutation happened, so the loaders must still run once more
    await B.loaders.root.resolve("ROOT 1");
    await B.loaders.page.resolve("PAGE 1");

    expect({
      rootLoaderCalls: B.loaders.root.stub.mock.calls.length,
      pageLoaderCalls: B.loaders.page.stub.mock.calls.length,
      fetcherA: t.fetchers.a.state,
      fetcherB: t.fetchers.b.state,
      fetcherBData: t.fetchers.b.data,
      loaderData: t.router.state.loaderData,
    }).toEqual({
      rootLoaderCalls: 1,
      pageLoaderCalls: 1,
      fetcherA: "idle",
      fetcherB: "idle",
      fetcherBData: "B REFUSED",
      loaderData: { root: "ROOT 1", page: "PAGE 1" },
    });
  });

  it("still revalidates when reusing the same fetcher key", async () => {
    let t = initializeTest();

    // A succeeds with key "shared" and its revalidation starts
    let A = await t.fetch("/page", "shared", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await A.actions.page.resolve("A ACTION");
    expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
    expect(A.loaders.page.stub).toHaveBeenCalledTimes(1);

    // B uses the same key "shared" and is refused with 400
    let B = await t.fetch("/page", "shared", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await B.actions.page.resolve(new Response("B REFUSED", { status: 400 }));

    expect(A.loaders.root.signal.aborted).toBe(true);
    expect(A.loaders.page.signal.aborted).toBe(true);
    await A.loaders.root.resolve("ROOT 1 (A)");
    await A.loaders.page.resolve("PAGE 1 (A)");

    await B.loaders.root.resolve("ROOT 1");
    await B.loaders.page.resolve("PAGE 1");

    expect({
      rootLoaderCalls: B.loaders.root.stub.mock.calls.length,
      pageLoaderCalls: B.loaders.page.stub.mock.calls.length,
      fetcherState: t.fetchers.shared.state,
      fetcherData: t.fetchers.shared.data,
      loaderData: t.router.state.loaderData,
    }).toEqual({
      rootLoaderCalls: 1,
      pageLoaderCalls: 1,
      fetcherState: "idle",
      fetcherData: "B REFUSED",
      loaderData: { root: "ROOT 1", page: "PAGE 1" },
    });
  });

  // Control: the rule the ordering exists for. Not part of the defect.
  it("does not revalidate after a lone 4xx submission (control)", async () => {
    let t = initializeTest();
    let A = await t.navigate("/page", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await A.actions.page.resolve(new Response("A REFUSED", { status: 400 }));
    expect(A.loaders.root.stub).not.toHaveBeenCalled();
    expect(A.loaders.page.stub).not.toHaveBeenCalled();
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.loaderData).toEqual({
      root: "ROOT 0",
      page: "PAGE 0",
    });
  });
});
