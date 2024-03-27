import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("flushSync", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  it("supports GET navigations with flushSync", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "a", path: "/a", loader: true },
        { id: "b", path: "/b", loader: true },
      ],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    let A = await t.navigate("/a");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );
    await A.loaders.a.resolve("A");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );

    let B = await t.navigate("/b", { unstable_flushSync: true });
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: true })
    );
    await B.loaders.b.resolve("B");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );

    unsubscribe();
    t.router.dispose();
  });

  it("supports POST navigations with flushSync", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "a", path: "/a", action: true },
        { id: "b", path: "/b", action: true },
      ],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    let A = await t.navigate("/a", {
      formMethod: "post",
      formData: createFormData({}),
    });
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );
    await A.actions.a.resolve("A");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );

    let B = await t.navigate("/b", {
      formMethod: "post",
      formData: createFormData({}),
      unstable_flushSync: true,
    });
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: true })
    );
    await B.actions.b.resolve("B");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );

    unsubscribe();
    t.router.dispose();
  });

  it("supports fetch loads with flushSync", async () => {
    let t = setup({
      routes: [{ id: "root", path: "/", loader: true }],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    let key = "key";
    let A = await t.fetch("/", key);
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );
    expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

    await A.loaders.root.resolve("ROOT");
    expect(t.router.state.fetchers.get(key)?.data).toBe("ROOT");

    let B = await t.fetch("/", key, { unstable_flushSync: true });
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: true })
    );
    expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

    await B.loaders.root.resolve("ROOT2");
    expect(t.router.state.fetchers.get(key)?.data).toBe("ROOT2");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );

    unsubscribe();
    t.router.dispose();
  });

  it("supports fetch submissions with flushSync", async () => {
    let t = setup({
      routes: [{ id: "root", path: "/", action: true }],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    let key = "key";
    let A = await t.fetch("/", key, {
      formMethod: "post",
      formData: createFormData({}),
    });
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );
    expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

    await A.actions.root.resolve("ROOT");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );
    expect(t.router.state.fetchers.get(key)?.data).toBe("ROOT");

    let B = await t.fetch("/", key, {
      formMethod: "post",
      formData: createFormData({}),
      unstable_flushSync: true,
    });
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: true })
    );
    expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

    await B.actions.root.resolve("ROOT2");
    expect(t.router.state.fetchers.get(key)?.data).toBe("ROOT2");
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ unstable_flushSync: false })
    );

    unsubscribe();
    t.router.dispose();
  });
});
