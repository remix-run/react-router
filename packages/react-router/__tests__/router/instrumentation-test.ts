import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

// Detect any failures inside the router navigate code
afterEach(() => {
  cleanup();
});

describe("instrumentation", () => {
  it("allows instrumentation of loaders", async () => {
    let spy = jest.fn();
    let t = setup({
      routes: [
        {
          index: true,
        },
        {
          id: "page",
          path: "/page",
          loader: true,
        },
      ],
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async loader(loader) {
            spy("start");
            await loader();
            spy("end");
          },
        });
      },
    });

    let A = await t.navigate("/page");
    expect(spy).toHaveBeenNthCalledWith(1, "start");
    await A.loaders.page.resolve("PAGE");
    expect(spy).toHaveBeenNthCalledWith(2, "end");
    expect(t.router.state).toMatchObject({
      navigation: { state: "idle" },
      location: { pathname: "/page" },
      loaderData: { page: "PAGE" },
    });
  });

  it("allows instrumentation of actions", async () => {
    let spy = jest.fn();
    let t = setup({
      routes: [
        {
          index: true,
        },
        {
          id: "page",
          path: "/page",
          action: true,
        },
      ],
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async action(action) {
            spy("start");
            await action();
            spy("end");
          },
        });
      },
    });

    let A = await t.navigate("/page", {
      formMethod: "POST",
      formData: createFormData({}),
    });
    expect(spy).toHaveBeenNthCalledWith(1, "start");
    await A.actions.page.resolve("PAGE");
    expect(spy).toHaveBeenNthCalledWith(2, "end");
    expect(t.router.state).toMatchObject({
      navigation: { state: "idle" },
      location: { pathname: "/page" },
      actionData: { page: "PAGE" },
    });
  });

  it("provides read-only information to instrumentation wrappers", async () => {
    let spy = jest.fn();
    let t = setup({
      routes: [
        {
          index: true,
        },
        {
          id: "slug",
          path: "/:slug",
          loader: true,
        },
      ],
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async loader(loader, info) {
            spy(info);
            Object.assign(info.params, { extra: "extra" });
            await loader();
          },
        });
      },
    });

    let A = await t.navigate("/a");
    await A.loaders.slug.resolve("A");
    let args = spy.mock.calls[0][0];
    expect(args.request.method).toBe("GET");
    expect(args.request.url).toBe("http://localhost/a");
    expect(args.request.url).toBe("http://localhost/a");
    expect(args.request.headers.get).toBeDefined();
    expect(args.request.headers.set).not.toBeDefined();
    expect(args.params).toEqual({ slug: "a", extra: "extra" });
    expect(args.pattern).toBe("/:slug");
    expect(args.context.get).toBeDefined();
    expect(args.context.set).not.toBeDefined();
    expect(t.router.state.matches[0].params).toEqual({ slug: "a" });
  });

  it("allows composition of multiple instrumentations", async () => {
    let spy = jest.fn();
    let t = setup({
      routes: [
        {
          index: true,
        },
        {
          id: "page",
          path: "/page",
          loader: true,
        },
      ],
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async loader(loader) {
            spy("start inner");
            await loader();
            spy("end inner");
          },
        });
        route.instrument({
          async loader(loader) {
            spy("start outer");
            await loader();
            spy("end outer");
          },
        });
      },
    });

    let A = await t.navigate("/page");
    await A.loaders.page.resolve("PAGE");
    expect(spy.mock.calls).toEqual([
      ["start outer"],
      ["start inner"],
      ["end inner"],
      ["end outer"],
    ]);
    expect(t.router.state).toMatchObject({
      navigation: { state: "idle" },
      location: { pathname: "/page" },
      loaderData: { page: "PAGE" },
    });
  });
});
