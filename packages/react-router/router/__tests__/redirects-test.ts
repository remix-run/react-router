import { IDLE_NAVIGATION } from "../index";
import type { TestRouteObject } from "./utils/data-router-setup";
import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("redirects", () => {
  afterEach(() => cleanup());

  let REDIRECT_ROUTES: TestRouteObject[] = [
    {
      id: "root",
      path: "/",
      children: [
        {
          id: "parent",
          path: "parent",
          action: true,
          loader: true,
          children: [
            {
              id: "child",
              path: "child",
              action: true,
              loader: true,
              children: [
                {
                  id: "index",
                  index: true,
                  action: true,
                  loader: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  it("applies the basename to redirects returned from loaders", async () => {
    let t = setup({
      routes: REDIRECT_ROUTES,
      basename: "/base/name",
      initialEntries: ["/base/name"],
    });

    let nav1 = await t.navigate("/base/name/parent");

    let nav2 = await nav1.loaders.parent.redirectReturn("/parent/child");
    await nav2.loaders.parent.resolve("PARENT");
    await nav2.loaders.child.resolve("CHILD");
    await nav2.loaders.index.resolve("INDEX");
    expect(t.router.state).toMatchObject({
      historyAction: "PUSH",
      location: {
        pathname: "/base/name/parent/child",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
        child: "CHILD",
        index: "INDEX",
      },
      errors: null,
    });
    expect(t.history.action).toEqual("PUSH");
    expect(t.history.location.pathname).toEqual("/base/name/parent/child");
  });

  it("supports relative routing in redirects (from parent navigation loader)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.navigate("/parent/child");

    await nav1.loaders.child.resolve("CHILD");
    await nav1.loaders.index.resolve("INDEX");
    await nav1.loaders.parent.redirectReturn("..");
    // No root loader so redirect lands immediately
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {},
      errors: null,
    });
  });

  it("supports relative routing in redirects (from child navigation loader)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.navigate("/parent/child");

    await nav1.loaders.parent.resolve("PARENT");
    await nav1.loaders.index.resolve("INDEX");
    let nav2 = await nav1.loaders.child.redirectReturn(
      "..",
      undefined,
      undefined,
      ["parent"]
    );
    await nav2.loaders.parent.resolve("PARENT 2");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT 2",
      },
      errors: null,
    });
  });

  it("supports relative routing in redirects (from index navigation loader)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.navigate("/parent/child");

    await nav1.loaders.parent.resolve("PARENT");
    await nav1.loaders.child.resolve("INDEX");
    let nav2 = await nav1.loaders.index.redirectReturn(
      "..",
      undefined,
      undefined,
      ["parent"]
    );
    await nav2.loaders.parent.resolve("PARENT 2");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT 2",
      },
      errors: null,
    });
  });

  it("supports relative routing in redirects (from parent fetch loader)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let fetch = await t.fetch("/parent", "key");

    await fetch.loaders.parent.redirectReturn("..", undefined, undefined, [
      "parent",
    ]);

    // No root loader so redirect lands immediately
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {},
      errors: null,
    });
    expect(t.router.state.fetchers.get("key")).toMatchObject({
      state: "idle",
      data: undefined,
    });
  });

  it("supports relative routing in redirects (from child fetch loader)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let fetch = await t.fetch("/parent/child");
    let nav = await fetch.loaders.child.redirectReturn(
      "..",
      undefined,
      undefined,
      ["parent"]
    );

    await nav.loaders.parent.resolve("PARENT");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
      },
      errors: null,
    });
  });

  it("supports relative routing in redirects (from index fetch loader)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let fetch = await t.fetch("/parent/child?index");
    let nav = await fetch.loaders.index.redirectReturn(
      "..",
      undefined,
      undefined,
      ["parent"]
    );

    await nav.loaders.parent.resolve("PARENT");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
      },
      errors: null,
    });
  });

  it("supports . redirects", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.navigate("/parent");

    let nav2 = await nav1.loaders.parent.redirectReturn(
      "./child",
      undefined,
      undefined,
      ["parent", "child", "index"]
    );
    await nav2.loaders.parent.resolve("PARENT");
    await nav2.loaders.child.resolve("CHILD");
    await nav2.loaders.index.resolve("INDEX");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent/child",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
        child: "CHILD",
        index: "INDEX",
      },
      errors: null,
    });
  });

  it("supports relative routing in navigation action redirects", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.navigate("/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let nav2 = await nav1.actions.child.redirectReturn(
      "..",
      undefined,
      undefined,
      ["parent"]
    );
    await nav2.loaders.parent.resolve("PARENT");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
      },
      errors: null,
    });
  });

  it("supports relative routing in fetch action redirects", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.fetch("/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let nav2 = await nav1.actions.child.redirectReturn(
      "..",
      undefined,
      undefined,
      ["parent"]
    );
    await nav2.loaders.parent.resolve("PARENT");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
      },
      errors: null,
    });
  });

  it("preserves query and hash in redirects", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.navigate("/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let nav2 = await nav1.actions.child.redirectReturn(
      "/parent?key=value#hash"
    );
    await nav2.loaders.parent.resolve("PARENT");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
        search: "?key=value",
        hash: "#hash",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
      },
      errors: null,
    });
  });

  it("preserves query and hash in relative redirects", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let nav1 = await t.navigate("/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let nav2 = await nav1.actions.child.redirectReturn(
      "..?key=value#hash",
      undefined,
      undefined,
      ["parent"]
    );
    await nav2.loaders.parent.resolve("PARENT");
    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/parent",
        search: "?key=value",
        hash: "#hash",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        parent: "PARENT",
      },
      errors: null,
    });
  });

  it("processes external redirects if window is present (push)", async () => {
    let urls = [
      "http://remix.run/blog",
      "https://remix.run/blog",
      "//remix.run/blog",
      "app://whatever",
    ];

    for (let url of urls) {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({}),
      });

      await A.actions.child.redirectReturn(url);
      expect(t.window.location.assign).toHaveBeenCalledWith(url);
      expect(t.window.location.replace).not.toHaveBeenCalled();
    }
  });

  it("processes external redirects if window is present (replace)", async () => {
    let urls = [
      "http://remix.run/blog",
      "https://remix.run/blog",
      "//remix.run/blog",
      "app://whatever",
    ];

    for (let url of urls) {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({}),
        replace: true,
      });

      await A.actions.child.redirectReturn(url);
      expect(t.window.location.replace).toHaveBeenCalledWith(url);
      expect(t.window.location.assign).not.toHaveBeenCalled();
    }
  });

  it("processes redirects with document reload if header is present (assign)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let A = await t.navigate("/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    await A.actions.child.redirectReturn("/redirect", 301, {
      "X-Remix-Reload-Document": "true",
    });
    expect(t.window.location.assign).toHaveBeenCalledWith("/redirect");
    expect(t.window.location.replace).not.toHaveBeenCalled();
  });

  it("processes redirects with document reload if header is present (replace)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let A = await t.navigate("/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
      replace: true,
    });

    await A.actions.child.redirectReturn("/redirect", 301, {
      "X-Remix-Reload-Document": "true",
    });
    expect(t.window.location.replace).toHaveBeenCalledWith("/redirect");
    expect(t.window.location.assign).not.toHaveBeenCalled();
  });

  it("properly handles same-origin absolute URLs", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let A = await t.navigate("/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let B = await A.actions.child.redirectReturn(
      "http://localhost/parent",
      undefined,
      undefined,
      ["parent"]
    );
    await B.loaders.parent.resolve("PARENT");
    expect(t.router.state.location).toMatchObject({
      hash: "",
      pathname: "/parent",
      search: "",
      state: {
        _isRedirect: true,
      },
    });
  });

  it("properly handles same-origin absolute URLs when using a basename", async () => {
    let t = setup({ routes: REDIRECT_ROUTES, basename: "/base" });

    let A = await t.navigate("/base/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let B = await A.actions.child.redirectReturn(
      "http://localhost/base/parent",
      undefined,
      undefined,
      ["parent"]
    );
    await B.loaders.parent.resolve("PARENT");
    expect(t.router.state.location).toMatchObject({
      hash: "",
      pathname: "/base/parent",
      search: "",
      state: {
        _isRedirect: true,
      },
    });
  });

  it("treats same-origin absolute URLs as external if they don't match the basename", async () => {
    let t = setup({ routes: REDIRECT_ROUTES, basename: "/base" });

    let A = await t.navigate("/base/parent/child", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let url = "http://localhost/not/the/same/basename";
    await A.actions.child.redirectReturn(url);
    expect(t.window.location.assign).toHaveBeenCalledWith(url);
    expect(t.window.location.replace).not.toHaveBeenCalled();
  });

  it("automatically replaces in the history stack if you redirect to the same location (root relative)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let A = await t.navigate("/parent");
    await A.loaders.parent.resolve("PARENT");

    let B = await t.navigate("/parent", {
      formMethod: "post",
      formData: createFormData({}),
    });
    let C = await B.actions.parent.redirectReturn("/parent");
    await C.loaders.parent.resolve("PARENT*");

    expect(t.router.state.location).toMatchObject({ pathname: "/parent" });

    // Because we redirected to the current location it defaults to a replace
    await t.router.navigate(-1);
    expect(t.router.state.location).toMatchObject({ pathname: "/" });
  });

  it("automatically replaces in the history stack if you redirect to the same location (absolute)", async () => {
    let t = setup({ routes: REDIRECT_ROUTES });

    let A = await t.navigate("/parent");
    await A.loaders.parent.resolve("PARENT");

    let B = await t.navigate("/parent", {
      formMethod: "post",
      formData: createFormData({}),
    });
    let C = await B.actions.parent.redirectReturn(
      "http://localhost/parent",
      undefined,
      undefined,
      ["parent"]
    );
    await C.loaders.parent.resolve("PARENT*");

    expect(t.router.state.location).toMatchObject({ pathname: "/parent" });

    // Because we redirected to the current location it defaults to a replace
    await t.router.navigate(-1);
    expect(t.router.state.location).toMatchObject({ pathname: "/" });
  });

  it("preserves action revalidation across multiple redirects", async () => {
    let t = setup({
      initialEntries: ["/action"],
      routes: [
        {
          id: "action",
          path: "/action",
          loader: true,
          children: [
            {
              id: "index",
              index: true,
              action: true,
              loader: true,
            },
            {
              id: "one",
              path: "1",
              loader: true,
            },
            {
              path: "2",
            },
          ],
        },
      ],
      hydrationData: {
        loaderData: {
          action: "ACTION 0",
          index: "INDEX",
        },
      },
    });

    let A = await t.navigate("/action?index", {
      formMethod: "post",
      formData: createFormData({}),
    });

    let B = await A.actions.index.redirectReturn("/action/1");
    await B.loaders.action.resolve("ACTION 1");
    let C = await B.loaders.one.redirectReturn("/action/2");
    await C.loaders.action.resolve("ACTION 2");

    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/action/2",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        action: "ACTION 2",
      },
    });
  });

  it("preserves X-Remix-Revalidate revalidation across multiple redirects", async () => {
    let t = setup({
      initialEntries: ["/loader"],
      routes: [
        {
          id: "loader",
          path: "/loader",
          loader: true,
          children: [
            {
              id: "index",
              index: true,
            },
            {
              id: "one",
              path: "1",
              loader: true,
            },
            {
              id: "two",
              path: "2",
              loader: true,
            },
            {
              path: "3",
            },
          ],
        },
      ],
      hydrationData: {
        loaderData: {
          loader: "LOADER 0",
        },
      },
    });

    let A = await t.navigate("/loader/1");
    let B = await A.loaders.one.redirectReturn("/loader/2", undefined, {
      "X-Remix-Revalidate": "true",
    });
    await B.loaders.loader.resolve("LOADER 3");
    let C = await B.loaders.two.redirectReturn("/loader/3");
    await C.loaders.loader.resolve("LOADER 3");

    expect(t.router.state).toMatchObject({
      location: {
        pathname: "/loader/3",
      },
      navigation: IDLE_NAVIGATION,
      loaderData: {
        loader: "LOADER 3",
      },
    });
  });

  describe("redirect status code handling", () => {
    it("should not treat 300 as a redirect", async () => {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent");
      await A.loaders.parent.redirectReturn("/idk", 300);
      expect(t.router.state).toMatchObject({
        loaderData: {},
        location: {
          pathname: "/parent",
        },
        navigation: {
          state: "idle",
        },
      });
    });

    it("should not preserve the method on 301 redirects", async () => {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      // Triggers a GET redirect
      let B = await A.actions.child.redirectReturn("/parent", 301);
      await B.loaders.parent.resolve("PARENT");
      expect(t.router.state).toMatchObject({
        loaderData: {
          parent: "PARENT",
        },
        location: {
          pathname: "/parent",
        },
        navigation: {
          state: "idle",
        },
      });
    });

    it("should not preserve the method on 302 redirects", async () => {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      // Triggers a GET redirect
      let B = await A.actions.child.redirectReturn("/parent", 302);
      await B.loaders.parent.resolve("PARENT");
      expect(t.router.state).toMatchObject({
        loaderData: {
          parent: "PARENT",
        },
        location: {
          pathname: "/parent",
        },
        navigation: {
          state: "idle",
        },
      });
    });

    it("should not preserve the method on 303 redirects", async () => {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      // Triggers a GET redirect
      let B = await A.actions.child.redirectReturn("/parent", 303);
      await B.loaders.parent.resolve("PARENT");
      expect(t.router.state).toMatchObject({
        loaderData: {
          parent: "PARENT",
        },
        location: {
          pathname: "/parent",
        },
        navigation: {
          state: "idle",
        },
      });
    });

    it("should not treat 304 as a redirect", async () => {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent");
      await A.loaders.parent.resolve(new Response(null, { status: 304 }));
      expect(t.router.state).toMatchObject({
        loaderData: {},
        location: {
          pathname: "/parent",
        },
        navigation: {
          state: "idle",
        },
      });
    });

    it("should preserve the method on 307 redirects", async () => {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      // Triggers a POST redirect
      let B = await A.actions.child.redirectReturn("/parent", 307);
      await B.actions.parent.resolve("PARENT ACTION");
      await B.loaders.parent.resolve("PARENT");
      expect(t.router.state).toMatchObject({
        actionData: {
          parent: "PARENT ACTION",
        },
        loaderData: {
          parent: "PARENT",
        },
        location: {
          pathname: "/parent",
        },
        navigation: {
          state: "idle",
        },
      });

      let request = B.actions.parent.stub.mock.calls[0][0].request;
      expect(request.method).toBe("POST");
      let fd = await request.formData();
      expect(Array.from(fd.entries())).toEqual([["key", "value"]]);
    });

    it("should preserve the method on 308 redirects", async () => {
      let t = setup({ routes: REDIRECT_ROUTES });

      let A = await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      // Triggers a POST redirect
      let B = await A.actions.child.redirectReturn("/parent", 308);
      await B.actions.parent.resolve("PARENT ACTION");
      await B.loaders.parent.resolve("PARENT");
      expect(t.router.state).toMatchObject({
        actionData: {
          parent: "PARENT ACTION",
        },
        loaderData: {
          parent: "PARENT",
        },
        location: {
          pathname: "/parent",
        },
        navigation: {
          state: "idle",
        },
      });

      let request = B.actions.parent.stub.mock.calls[0][0].request;
      expect(request.method).toBe("POST");
      let fd = await request.formData();
      expect(Array.from(fd.entries())).toEqual([["key", "value"]]);
    });
  });
});
