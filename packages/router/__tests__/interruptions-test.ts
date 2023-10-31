/* eslint-disable jest/valid-title */
import type { HydrationState } from "../index";
import { IDLE_NAVIGATION } from "../index";
import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

function initializeTest(init?: {
  url?: string;
  hydrationData?: HydrationState;
}) {
  return setup({
    routes: [
      {
        path: "",
        id: "root",
        hasErrorBoundary: true,
        loader: true,
        children: [
          {
            path: "/",
            id: "index",
            loader: true,
            action: true,
          },
          {
            path: "/foo",
            id: "foo",
            loader: true,
            action: true,
          },
          {
            path: "/bar",
            id: "bar",
            loader: true,
            action: true,
          },
          {
            path: "/baz",
            id: "baz",
            loader: true,
            action: true,
          },
        ],
      },
    ],
    hydrationData: init?.hydrationData || {
      loaderData: { root: "ROOT", index: "INDEX" },
    },
    ...(init?.url ? { initialEntries: [init.url] } : {}),
  });
}

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

// Detect any failures inside the router navigate code
afterEach(() => {
  cleanup();

  // @ts-ignore
  console.warn.mockReset();
});

describe("interruptions", () => {
  describe(`
      A) GET /foo |---X
      B) GET /bar     |---O
    `, () => {
    it("aborts previous load", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      t.navigate("/bar");
      expect(A.loaders.foo.stub.mock.calls.length).toBe(1);
    });
  });

  describe(`
      A) GET  /foo |---X
      B) POST /bar     |---O
    `, () => {
    it("aborts previous load", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await t.navigate("/bar", {
        formMethod: "post",
        formData: new FormData(),
      });
      expect(A.loaders.foo.signal.aborted).toBe(true);
    });
  });

  describe(`
      A) POST /foo |---X
      B) POST /bar     |---O
    `, () => {
    it("aborts previous action", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: new FormData(),
      });
      await t.navigate("/bar", {
        formMethod: "post",
        formData: new FormData(),
      });
      expect(A.actions.foo.signal.aborted).toBe(true);
    });
  });

  describe(`
      A) POST /foo |--|--X
      B) GET  /bar       |---O
    `, () => {
    it("aborts previous action reload", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: new FormData(),
      });
      await A.actions.foo.resolve("A ACTION");
      await t.navigate("/bar");
      expect(A.loaders.foo.signal.aborted).toBe(true);
    });
  });

  describe(`
      A) POST /foo |--|--X
      B) POST /bar       |---O
    `, () => {
    it("aborts previous action reload", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: new FormData(),
      });
      await A.actions.foo.resolve("A ACTION");
      await t.navigate("/bar", {
        formMethod: "post",
        formData: new FormData(),
      });
      expect(A.loaders.foo.signal.aborted).toBe(true);
    });
  });

  describe(`
      A) GET /foo |--/bar--X
      B) GET /baz          |---O
    `, () => {
    it("aborts previous action redirect load", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      let AR = await A.loaders.foo.redirect("/bar");
      t.navigate("/baz");
      expect(AR.loaders.bar.stub.mock.calls.length).toBe(1);
    });
  });

  describe(`
      A) POST /foo |--/bar--X
      B) GET  /baz          |---O
    `, () => {
    it("aborts previous action redirect load", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: new FormData(),
      });
      let AR = await A.actions.foo.redirect("/bar");
      await t.navigate("/baz");
      expect(AR.loaders.bar.signal.aborted).toBe(true);
    });
  });

  describe(`
      A) GET /foo |---X
      B) GET /bar     |---X
      C) GET /baz         |---O
    `, () => {
    it("aborts multiple subsequent loads", async () => {
      let t = initializeTest();
      // Start A navigation and immediately interrupt
      let A = await t.navigate("/foo");
      let B = await t.navigate("/bar");
      // resolve A then interrupt B - ensure the A resolution doesn't clear
      // the new pendingNavigationController which is now reflecting B's nav
      await A.loaders.foo.resolve("A");
      let C = await t.navigate("/baz");
      await B.loaders.bar.resolve("B");
      await C.loaders.baz.resolve("C");

      expect(A.loaders.foo.stub.mock.calls.length).toBe(1);
      expect(A.loaders.foo.signal.aborted).toBe(true);

      expect(B.loaders.bar.stub.mock.calls.length).toBe(1);
      expect(B.loaders.bar.signal.aborted).toBe(true);

      expect(C.loaders.baz.stub.mock.calls.length).toBe(1);
      expect(C.loaders.baz.signal.aborted).toBe(false);

      expect(t.router.state.loaderData).toEqual({
        root: "ROOT",
        baz: "C",
      });
    });
  });

  describe(`
      A) POST /foo |---X
      B) POST /bar     |---X
      C) POST /baz         |---O
    `, () => {
    it("aborts previous load", async () => {
      let t = initializeTest();
      // Start A navigation and immediately interrupt
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: new FormData(),
      });
      let B = await t.navigate("/bar", {
        formMethod: "post",
        formData: new FormData(),
      });
      // resolve A then interrupt B - ensure the A resolution doesn't clear
      // the new pendingNavigationController which is now reflecting B's nav
      await A.actions.foo.resolve("A");
      let C = await t.navigate("/baz", {
        formMethod: "post",
        formData: new FormData(),
      });
      await B.actions.bar.resolve("B");
      await C.actions.baz.resolve("C");

      expect(A.actions.foo.stub.mock.calls.length).toBe(1);
      expect(A.actions.foo.signal.aborted).toBe(true);

      expect(B.actions.bar.stub.mock.calls.length).toBe(1);
      expect(B.actions.bar.signal.aborted).toBe(true);

      expect(C.actions.baz.stub.mock.calls.length).toBe(1);
      expect(C.actions.baz.signal.aborted).toBe(false);

      expect(t.router.state.actionData).toEqual({
        baz: "C",
      });
    });
  });

  describe(`
      A) POST /foo |--X
      B) GET  /bar    |-----O
    `, () => {
    it("forces all loaders to revalidate on interrupted submission", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      // Interrupting the submission should cause the next load to call all loaders
      let B = await t.navigate("/bar");
      await A.actions.foo.resolve("A ACTION");
      await B.loaders.root.resolve("ROOT*");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state).toMatchObject({
        navigation: IDLE_NAVIGATION,
        location: { pathname: "/bar" },
        actionData: null,
        loaderData: {
          root: "ROOT*",
          bar: "BAR",
        },
      });
    });
  });

  describe(`
      A) POST /foo |--|--X
      B) GET  /bar       |-----O
    `, () => {
    it("forces all loaders to revalidate on interrupted actionReload", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      await A.actions.foo.resolve("A ACTION");
      expect(t.router.state.navigation.state).toBe("loading");
      // Interrupting the actionReload should cause the next load to call all loaders
      let B = await t.navigate("/bar");
      await B.loaders.root.resolve("ROOT*");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state).toMatchObject({
        navigation: IDLE_NAVIGATION,
        location: { pathname: "/bar" },
        actionData: null,
        loaderData: {
          root: "ROOT*",
          bar: "BAR",
        },
      });
    });

    it("forces all loaders to revalidate on interrupted submissionRedirect", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      await A.actions.foo.redirect("/baz");
      expect(t.router.state.navigation.state).toBe("loading");
      // Interrupting the submissionRedirect should cause the next load to call all loaders
      let B = await t.navigate("/bar");
      await B.loaders.root.resolve("ROOT*");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state).toMatchObject({
        navigation: IDLE_NAVIGATION,
        location: { pathname: "/bar" },
        loaderData: {
          root: "ROOT*",
          bar: "BAR",
        },
      });
    });
  });
});
