import type { HydrationState } from "../index";
import { json } from "../index";
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
            path: "/foo/bar",
            id: "foobar",
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
          {
            path: "/p/:param",
            id: "param",
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

describe("navigations", () => {
  afterEach(() => cleanup());

  describe("normal navigation", () => {
    it("fetches data on navigation", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.loaderData).toMatchInlineSnapshot(`
        {
          "foo": "FOO",
          "root": "ROOT",
        }
      `);
    });

    it("allows `null` as a valid data value", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(null);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        foo: null,
      });
    });

    it("unwraps non-redirect json Responses", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(
        new Response(JSON.stringify({ key: "value" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        foo: { key: "value" },
      });
    });

    it("unwraps non-redirect json Responses (json helper)", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(json({ key: "value" }, 200));
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        foo: { key: "value" },
      });
    });

    // See: https://github.com/remix-run/react-router/issues/11145
    it("does not attempt to deserialize empty json responses", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(
        new Response(null, {
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(t.router.state.errors).toBeNull();
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        foo: null,
      });
    });

    it("unwraps non-redirect text Responses", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(new Response("FOO", { status: 200 }));
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        foo: "FOO",
      });
    });

    it("handles errors when unwrapping Responses", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
            children: [
              {
                id: "foo",
                path: "foo",
                hasErrorBoundary: true,
                loader: true,
              },
            ],
          },
        ],
      });
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(
        // Invalid JSON
        new Response('{"key":"value"}}}}}', {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(t.router.state.loaderData).toEqual({});

      // Node 16/18 versus 20 output different errors here :/
      let expected =
        process.version.startsWith("v16") || process.version.startsWith("v18")
          ? "Unexpected token } in JSON at position 15"
          : "Unexpected non-whitespace character after JSON at position 15";
      expect(t.router.state.errors?.foo).toEqual(new SyntaxError(expected));
    });

    it("bubbles errors when unwrapping Responses", async () => {
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            hasErrorBoundary: true,
            children: [
              {
                id: "foo",
                path: "foo",
                loader: true,
              },
            ],
          },
        ],
      });
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(
        // Invalid JSON
        new Response('{"key":"value"}}}}}', {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(t.router.state.loaderData).toEqual({});

      // Node 16/18 versus 20 output different errors here :/
      let expected =
        process.version.startsWith("v16") || process.version.startsWith("v18")
          ? "Unexpected token } in JSON at position 15"
          : "Unexpected non-whitespace character after JSON at position 15";
      expect(t.router.state.errors?.root).toEqual(new SyntaxError(expected));
    });

    it("does not fetch unchanging layout data", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData.root).toBe("ROOT");
    });

    it("reloads all routes on search changes", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo?q=1");
      await A.loaders.root.resolve("ROOT1");
      await A.loaders.foo.resolve("1");
      expect(A.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT1",
        foo: "1",
      });

      let B = await t.navigate("/foo?q=2");
      await B.loaders.root.resolve("ROOT2");
      await B.loaders.foo.resolve("2");
      expect(B.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT2",
        foo: "2",
      });
    });

    it("does not reload all routes when search does not change", async () => {
      let t = initializeTest();
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      let A = await t.navigate("/foo?q=1");
      await A.loaders.root.resolve("ROOT1");
      await A.loaders.foo.resolve("1");
      expect(A.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT1",
        foo: "1",
      });

      let B = await t.navigate("/foo/bar?q=1");
      await B.loaders.foobar.resolve("2");
      expect(B.loaders.root.stub.mock.calls.length).toBe(0);

      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT1",
        foobar: "2",
      });
    });

    it("reloads only routes with changed params", async () => {
      let t = initializeTest();

      let A = await t.navigate("/p/one");
      await A.loaders.param.resolve("one");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        param: "one",
      });

      let B = await t.navigate("/p/two");
      await B.loaders.param.resolve("two");
      expect(B.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        param: "two",
      });
    });

    it("reloads all routes on refresh", async () => {
      let t = initializeTest();
      let url = "/p/same";

      let A = await t.navigate(url);
      await A.loaders.param.resolve("1");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        param: "1",
      });

      let B = await t.navigate(url);
      await B.loaders.root.resolve("ROOT2");
      await B.loaders.param.resolve("2");
      expect(B.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT2",
        param: "2",
      });
    });

    it("does not run loaders on hash change only navigations (no hash -> hash)", async () => {
      let t = initializeTest();
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/#bar");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
    });

    it("does not run loaders on hash change only navigations (hash -> new hash)", async () => {
      let t = initializeTest({ url: "/#foo" });
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/#bar");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
    });

    it("does not run loaders on same-hash navigations", async () => {
      let t = initializeTest({ url: "/#bar" });
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/#bar");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(A.loaders.index.stub.mock.calls.length).toBe(0);
    });

    it("runs loaders on same-hash navigations to new paths", async () => {
      let t = initializeTest({ url: "/#bar" });
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/foo#bar");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(A.loaders.foo.stub.mock.calls.length).toBe(1);
    });

    it("runs loaders on hash removal navigations (same path)", async () => {
      let t = initializeTest({ url: "/#bar" });
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/");
      expect(A.loaders.root.stub.mock.calls.length).toBe(1);
      expect(A.loaders.index.stub.mock.calls.length).toBe(1);
    });

    it("runs loaders on hash removal navigations (nested path)", async () => {
      let t = initializeTest({ url: "/#bar" });
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/foo");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(A.loaders.foo.stub.mock.calls.length).toBe(1);
    });

    it('does not load anything on hash change only empty <Form method="get"> navigations', async () => {
      let t = initializeTest();
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/#bar", {
        formData: createFormData({}),
      });
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
    });

    it('runs loaders on hash change only non-empty <Form method="get"> navigations', async () => {
      let t = initializeTest();
      expect(t.router.state.loaderData).toMatchObject({ root: "ROOT" });
      let A = await t.navigate("/#bar", {
        formData: createFormData({ key: "value" }),
      });
      await A.loaders.root.resolve("ROOT 2");
      await A.loaders.index.resolve("INDEX 2");
      expect(t.router.state.location.search).toBe("?key=value");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT 2",
        index: "INDEX 2",
      });
    });

    it('runs action/loaders on hash change only <Form method="post"> navigations', async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo#bar");
      expect(t.router.state.navigation.state).toBe("loading");
      await A.loaders.foo.resolve("A");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        foo: "A",
      });

      // Submit while we have an active hash causing us to lose it
      let B = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.navigation.state).toBe("submitting");
      await B.actions.foo.resolve("ACTION");
      await B.loaders.root.resolve("ROOT 2");
      await B.loaders.foo.resolve("B");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toMatchObject({
        foo: "ACTION",
      });
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT 2",
        foo: "B",
      });
    });

    it("sets all right states on hash change only", async () => {
      let t = initializeTest();
      let key = t.router.state.location.key;
      t.navigate("/#bar");
      // hash changes are synchronous but force a key change
      expect(t.router.state.location.key).not.toBe(key);
      expect(t.router.state.location.hash).toBe("#bar");
      expect(t.router.state.navigation.state).toBe("idle");
    });

    it("loads new data on new routes even if there's also a hash change", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo#bar");
      expect(t.router.state.navigation.state).toBe("loading");
      await A.loaders.foo.resolve("A");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        foo: "A",
      });
    });

    it("redirects from loaders (throw)", async () => {
      let t = initializeTest();

      let A = await t.navigate("/bar");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.navigation.location?.pathname).toBe("/bar");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      let B = await A.loaders.bar.redirect("/baz");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.navigation.location?.pathname).toBe("/baz");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      await B.loaders.baz.resolve("B");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.location.pathname).toBe("/baz");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        baz: "B",
      });
    });

    it("redirects from loaders (return)", async () => {
      let t = initializeTest();

      let A = await t.navigate("/bar");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.navigation.location?.pathname).toBe("/bar");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      let B = await A.loaders.bar.redirectReturn("/baz");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.navigation.location?.pathname).toBe("/baz");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      await B.loaders.baz.resolve("B");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.location.pathname).toBe("/baz");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        baz: "B",
      });
    });

    it("reloads all routes if X-Remix-Revalidate was set in a loader redirect header", async () => {
      let t = initializeTest();

      let A = await t.navigate("/foo");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.navigation.location?.pathname).toBe("/foo");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      let B = await A.loaders.foo.redirectReturn("/bar", undefined, {
        "X-Remix-Revalidate": "yes",
      });
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.navigation.location?.pathname).toBe("/bar");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      await B.loaders.root.resolve("ROOT*");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.location.pathname).toBe("/bar");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT*",
        bar: "BAR",
      });
    });

    it("reloads all routes if X-Remix-Revalidate was set in a loader redirect header (chained redirects)", async () => {
      let t = initializeTest();

      let A = await t.navigate("/foo");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0); // Reused on navigation

      let B = await A.loaders.foo.redirectReturn("/bar", undefined, {
        "X-Remix-Revalidate": "yes",
      });
      await B.loaders.root.resolve("ROOT*");
      expect(B.loaders.root.stub.mock.calls.length).toBe(1);

      // No cookie on second redirect
      let C = await B.loaders.bar.redirectReturn("/baz");
      expect(C.loaders.root.stub.mock.calls.length).toBe(1);
      await C.loaders.root.resolve("ROOT**");
      await C.loaders.baz.resolve("BAZ");

      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.location.pathname).toBe("/baz");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT**",
        baz: "BAZ",
      });
    });
  });

  describe("errors on navigation", () => {
    describe("with an error boundary in the throwing route", () => {
      it("uses the throwing route's error boundary", async () => {
        let t = setup({
          routes: [
            {
              path: "/",
              id: "parent",
              children: [
                {
                  path: "/child",
                  id: "child",
                  hasErrorBoundary: true,
                  loader: true,
                },
              ],
            },
          ],
        });
        let nav = await t.navigate("/child");
        await nav.loaders.child.reject(new Error("Kaboom!"));
        expect(t.router.state.errors).toEqual({
          child: new Error("Kaboom!"),
        });
      });

      it("clears previous loaderData at that route", async () => {
        let t = setup({
          routes: [
            {
              path: "/",
              id: "parent",
              loader: true,
              children: [
                {
                  path: "/child",
                  id: "child",
                  hasErrorBoundary: true,
                  loader: true,
                },
              ],
            },
          ],
        });
        let nav = await t.navigate("/child");
        await nav.loaders.parent.resolve("PARENT");
        await nav.loaders.child.resolve("CHILD");
        expect(t.router.state.loaderData).toEqual({
          parent: "PARENT",
          child: "CHILD",
        });
        expect(t.router.state.errors).toEqual(null);

        let nav2 = await t.navigate("/child");
        await nav2.loaders.parent.resolve("PARENT2");
        await nav2.loaders.child.reject(new Error("Kaboom!"));
        expect(t.router.state.loaderData).toEqual({
          parent: "PARENT2",
        });
        expect(t.router.state.errors).toEqual({
          child: new Error("Kaboom!"),
        });
      });
    });

    describe("with an error boundary above the throwing route", () => {
      it("uses the nearest error boundary", async () => {
        let t = setup({
          routes: [
            {
              path: "/",
              id: "parent",
              hasErrorBoundary: true,
              children: [
                {
                  path: "/child",
                  id: "child",
                  loader: true,
                },
              ],
            },
          ],
          hydrationData: { loaderData: { parent: "stuff" } },
        });
        let nav = await t.navigate("/child");
        await nav.loaders.child.reject(new Error("Kaboom!"));
        expect(t.router.state.errors).toEqual({
          parent: new Error("Kaboom!"),
        });
      });

      it("clears out the error on new locations", async () => {
        let t = setup({
          routes: [
            {
              path: "",
              id: "root",
              loader: true,
              children: [
                {
                  path: "/",
                  id: "parent",
                  children: [
                    {
                      path: "/child",
                      id: "child",
                      hasErrorBoundary: true,
                      loader: true,
                    },
                  ],
                },
              ],
            },
          ],
          hydrationData: { loaderData: { root: "ROOT" } },
        });

        let nav = await t.navigate("/child");
        await nav.loaders.child.reject("Kaboom!");
        expect(t.router.state.loaderData).toEqual({ root: "ROOT" });
        expect(t.router.state.errors).toEqual({ child: "Kaboom!" });

        await t.navigate("/");
        expect(t.router.state.loaderData).toEqual({ root: "ROOT" });
        expect(t.router.state.errors).toBe(null);
      });
    });

    it("loads data above error boundary route", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
            id: "a",
            loader: true,
            children: [
              {
                path: "/b",
                id: "b",
                loader: true,
                hasErrorBoundary: true,
                children: [
                  {
                    path: "/b/c",
                    id: "c",
                    loader: true,
                  },
                ],
              },
            ],
          },
        ],
        hydrationData: { loaderData: { a: "LOADER A" } },
      });
      let nav = await t.navigate("/b/c");
      await nav.loaders.b.resolve("LOADER B");
      await nav.loaders.c.reject("Kaboom!");
      expect(t.router.state.loaderData).toEqual({
        a: "LOADER A",
        b: "LOADER B",
      });
      expect(t.router.state.errors).toEqual({
        b: "Kaboom!",
      });
    });
  });

  describe("POP navigations", () => {
    it("does a normal load when backing into an action redirect", async () => {
      // start at / (history stack: [/])
      let t = initializeTest();

      // POST /foo, redirect /bar (history stack: [/, /bar])
      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      let B = await A.actions.foo.redirect("/bar");
      await B.loaders.root.resolve("ROOT DATA");
      await B.loaders.bar.resolve("B LOADER");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/bar");
      expect(B.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT DATA",
        bar: "B LOADER",
      });

      // Link to /baz (history stack: [/, /bar, /baz])
      let C = await t.navigate("/baz");
      await C.loaders.baz.resolve("C LOADER");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/baz");
      expect(C.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT DATA",
        baz: "C LOADER",
      });

      // POP /bar (history stack: [/, /bar])
      let D = await t.navigate(-1);
      await D.loaders.bar.resolve("D LOADER");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/bar");
      expect(D.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT DATA",
        bar: "D LOADER",
      });

      // POP / (history stack: [/])
      let E = await t.navigate(-1);
      await E.loaders.index.resolve("E LOADER");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/");
      expect(E.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT DATA",
        index: "E LOADER",
      });
    });

    it("navigates correctly using POP navigations", async () => {
      let t = initializeTest();

      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");

      let B = await t.navigate("/bar");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");

      let C = await t.navigate(-1);
      await C.loaders.foo.resolve("FOO*");
      expect(t.router.state.location.pathname).toEqual("/foo");

      let D = await t.navigate("/baz", { replace: true });
      await D.loaders.baz.resolve("BAZ");
      expect(t.router.state.location.pathname).toEqual("/baz");

      // POP to /
      let E = await t.navigate(-1);
      await E.loaders.index.resolve("INDEX*");
      expect(t.router.state.location.pathname).toEqual("/");
    });

    it("navigates correctly using POP navigations across actions", async () => {
      let t = initializeTest();

      // Navigate to /foo
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // Navigate to /bar
      let B = await t.navigate("/bar");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // Post to /bar (should replace)
      let C = await t.navigate("/bar", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      await C.actions.bar.resolve("BAR ACTION");
      await C.loaders.root.resolve("ROOT");
      await C.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // POP to /foo
      let D = await t.navigate(-1);
      await D.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");
    });

    it("navigates correctly using POP navigations across actions to new locations", async () => {
      let t = initializeTest();

      // Navigate to /foo
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // Navigate to /bar
      let B = await t.navigate("/bar");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // Post to /baz (should not replace)
      let C = await t.navigate("/baz", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      await C.actions.baz.resolve("BAZ ACTION");
      await C.loaders.root.resolve("ROOT");
      await C.loaders.baz.resolve("BAZ");
      expect(t.router.state.location.pathname).toEqual("/baz");

      // POP to /bar
      let D = await t.navigate(-1);
      await D.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");
    });

    it("navigates correctly using POP navigations across action errors", async () => {
      let t = initializeTest();

      // Navigate to /foo
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // Navigate to /bar
      let B = await t.navigate("/bar");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // Post to /bar (should push due to our error)
      let C = await t.navigate("/bar", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      await C.actions.bar.reject("BAR ERROR");
      await C.loaders.root.resolve("ROOT");
      await C.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // POP to /bar
      let D = await t.navigate(-1);
      await D.loaders.bar.resolve("BAR");
      expect(t.router.state.location.pathname).toEqual("/bar");
    });

    it("navigates correctly using POP navigations across loader redirects", async () => {
      // Start at / (history stack: [/])
      let t = initializeTest();

      // Navigate to /foo (history stack: [/, /foo])
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");
      let fooKey = t.router.state.location?.key;

      // Navigate to /bar, redirect to /baz (history stack: [/, /foo, /baz])
      let B = await t.navigate("/bar");
      let C = await B.loaders.bar.redirect("/baz");
      await C.loaders.root.resolve("ROOT");
      await C.loaders.baz.resolve("BAZ");
      expect(t.router.state.location.pathname).toEqual("/baz");

      // POP to /foo (history stack: [/, /foo])
      let E = await t.navigate(-1);
      await E.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");
      expect(t.router.state.location.key).toBe(fooKey);
    });

    it("navigates correctly using POP navigations across loader redirects with replace:true", async () => {
      // Start at / (history stack: [/])
      let t = initializeTest();
      let indexKey = t.router.state.location?.key;

      // Navigate to /foo (history stack: [/, /foo])
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // Navigate to /bar, redirect to /baz (history stack: [/, /baz])
      let B = await t.navigate("/bar", { replace: true });
      let C = await B.loaders.bar.redirect("/baz");
      await C.loaders.root.resolve("ROOT");
      await C.loaders.baz.resolve("BAZ");
      expect(t.router.state.historyAction).toEqual("REPLACE");
      expect(t.router.state.location.pathname).toEqual("/baz");

      // POP to / (history stack: [/])
      let E = await t.navigate(-1);
      await E.loaders.index.resolve("INDEX");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/");
      expect(t.router.state.location.key).toBe(indexKey);
    });

    it("navigates correctly using POP navigations across action redirects", async () => {
      let t = initializeTest();

      // Navigate to /foo
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // Navigate to /bar
      let B = await t.navigate("/bar");
      let getBarKey = t.router.state.navigation.location?.key;
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // Post to /bar, redirect to /baz
      let C = await t.navigate("/bar", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      let postBarKey = t.router.state.navigation.location?.key;
      let D = await C.actions.bar.redirect("/baz");
      await D.loaders.root.resolve("ROOT");
      await D.loaders.baz.resolve("BAZ");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/baz");

      // POP to /bar
      let E = await t.navigate(-1);
      await E.loaders.bar.resolve("BAR");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/bar");
      expect(t.router.state.location.key).toBe(getBarKey);
      expect(t.router.state.location.key).not.toBe(postBarKey);
    });

    it("navigates correctly using POP navigations across action redirects to the same location", async () => {
      let t = initializeTest();

      // Navigate to /foo
      let A = await t.navigate("/foo");
      let fooKey = t.router.state.navigation.location?.key;
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // Navigate to /bar
      let B = await t.navigate("/bar");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // Post to /bar, redirect to /bar
      let C = await t.navigate("/bar", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
      });
      let postBarKey = t.router.state.navigation.location?.key;
      let D = await C.actions.bar.redirect("/bar");
      await D.loaders.root.resolve("ROOT");
      await D.loaders.bar.resolve("BAR");
      expect(t.router.state.historyAction).toEqual("REPLACE");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // POP to /foo
      let E = await t.navigate(-1);
      await E.loaders.foo.resolve("FOO");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/foo");
      expect(t.router.state.location.key).toBe(fooKey);
      expect(t.router.state.location.key).not.toBe(postBarKey);
    });

    it("navigates correctly using POP navigations across <Form replace> redirects", async () => {
      let t = initializeTest();

      // Navigate to /foo
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // Navigate to /bar
      let B = await t.navigate("/bar");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // Post to /bar, redirect to /baz
      let C = await t.navigate("/bar", {
        formMethod: "post",
        formData: createFormData({ key: "value" }),
        replace: true,
      });
      let D = await C.actions.bar.redirect("/baz");
      await D.loaders.root.resolve("ROOT");
      await D.loaders.baz.resolve("BAZ");
      expect(t.router.state.historyAction).toEqual("REPLACE");
      expect(t.router.state.location.pathname).toEqual("/baz");

      // POP to /foo
      let E = await t.navigate(-1);
      await E.loaders.foo.resolve("FOO");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/foo");
    });

    it("should respect explicit replace:false on non-redirected actions to new locations", async () => {
      // start at / (history stack: [/])
      let t = initializeTest();

      // Link to /foo (history stack: [/, /foo])
      let A = await t.navigate("/foo");
      await A.loaders.root.resolve("ROOT");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // POST /bar (history stack: [/, /foo, /bar])
      let B = await t.navigate("/bar", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
        replace: false,
      });
      await B.actions.bar.resolve("BAR");
      await B.loaders.root.resolve("ROOT");
      await B.loaders.bar.resolve("BAR");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/bar");

      // POP /foo (history stack: [GET /, GET /foo])
      let C = await t.navigate(-1);
      await C.loaders.foo.resolve("FOO");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/foo");
    });

    it("should respect explicit replace:false on non-redirected actions to the same location", async () => {
      // start at / (history stack: [/])
      let t = initializeTest();

      // Link to /foo (history stack: [/, /foo])
      let A = await t.navigate("/foo");
      await A.loaders.root.resolve("ROOT");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // POST /foo (history stack: [/, /foo, /foo])
      let B = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
        replace: false,
      });
      await B.actions.foo.resolve("FOO2 ACTION");
      await B.loaders.root.resolve("ROOT2");
      await B.loaders.foo.resolve("FOO2");
      expect(t.router.state.historyAction).toEqual("PUSH");
      expect(t.router.state.location.pathname).toEqual("/foo");

      // POP /foo (history stack: [/, /foo])
      let C = await t.navigate(-1);
      await C.loaders.root.resolve("ROOT3");
      await C.loaders.foo.resolve("FOO3");
      expect(t.router.state.historyAction).toEqual("POP");
      expect(t.router.state.location.pathname).toEqual("/foo");
    });
  });

  describe("navigation states", () => {
    it("initialization", async () => {
      let t = initializeTest();
      let navigation = t.router.state.navigation;
      expect(navigation.state).toBe("idle");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toBeUndefined();
    });

    it("get", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo");
      let navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toMatchObject({
        pathname: "/foo",
        search: "",
        hash: "",
      });

      await A.loaders.foo.resolve("A");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("idle");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toBeUndefined();
    });

    it("get + redirect", async () => {
      let t = initializeTest();

      let A = await t.navigate("/foo");
      let B = await A.loaders.foo.redirect("/bar");

      let navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location?.pathname).toBe("/bar");

      await B.loaders.bar.resolve("B");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("idle");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toBeUndefined();
    });

    it("action submission", async () => {
      let t = initializeTest();

      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      let navigation = t.router.state.navigation;
      expect(navigation.state).toBe("submitting");

      expect(
        // @ts-expect-error
        new URLSearchParams(navigation.formData).toString()
      ).toBe("gosh=dang");
      expect(navigation.formMethod).toBe("post");
      expect(navigation.formEncType).toBe("application/x-www-form-urlencoded");
      expect(navigation.location).toMatchObject({
        pathname: "/foo",
        search: "",
        hash: "",
      });

      await A.actions.foo.resolve("A");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");
      expect(
        // @ts-expect-error
        new URLSearchParams(navigation.formData).toString()
      ).toBe("gosh=dang");
      expect(navigation.formMethod).toBe("post");
      expect(navigation.formEncType).toBe("application/x-www-form-urlencoded");
      expect(navigation.location).toMatchObject({
        pathname: "/foo",
        search: "",
        hash: "",
      });

      await A.loaders.foo.resolve("A");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");

      await A.loaders.root.resolve("B");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("idle");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toBeUndefined();
    });

    it("action submission + redirect", async () => {
      let t = initializeTest();

      let A = await t.navigate("/foo", {
        formMethod: "post",
        formData: createFormData({ gosh: "dang" }),
      });
      let B = await A.actions.foo.redirect("/bar");

      let navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");
      expect(
        // @ts-expect-error
        new URLSearchParams(navigation.formData).toString()
      ).toBe("gosh=dang");
      expect(navigation.formMethod).toBe("post");
      expect(navigation.location).toMatchObject({
        pathname: "/bar",
        search: "",
        hash: "",
      });

      await B.loaders.bar.resolve("B");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");

      await B.loaders.root.resolve("C");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("idle");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toBeUndefined();
    });

    it("loader submission", async () => {
      let t = initializeTest();
      let A = await t.navigate("/foo", {
        formData: createFormData({ gosh: "dang" }),
      });
      let navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");
      expect(navigation.formData).toEqual(createFormData({ gosh: "dang" }));
      expect(navigation.formMethod).toBe("get");
      expect(navigation.formEncType).toBe("application/x-www-form-urlencoded");
      expect(navigation.location).toMatchObject({
        pathname: "/foo",
        search: "?gosh=dang",
        hash: "",
      });

      await A.loaders.root.resolve("ROOT");
      await A.loaders.foo.resolve("A");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("idle");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toBeUndefined();
    });

    it("loader submission + redirect", async () => {
      let t = initializeTest();

      let A = await t.navigate("/foo", {
        formData: createFormData({ gosh: "dang" }),
      });
      await A.loaders.root.resolve("ROOT");
      let B = await A.loaders.foo.redirect("/bar");

      let navigation = t.router.state.navigation;
      expect(navigation.state).toBe("loading");
      expect(navigation.formData).toEqual(createFormData({ gosh: "dang" }));
      expect(navigation.formMethod).toBe("get");
      expect(navigation.formEncType).toBe("application/x-www-form-urlencoded");
      expect(navigation.location?.pathname).toBe("/bar");

      await B.loaders.bar.resolve("B");
      navigation = t.router.state.navigation;
      expect(navigation.state).toBe("idle");
      expect(navigation.formData).toBeUndefined();
      expect(navigation.location).toBeUndefined();
    });
  });
});
