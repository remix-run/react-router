import { createMemoryHistory } from "../history";
import { createRouter } from "../router";
import { AbortedDeferredError, ErrorResponseImpl, defer } from "../utils";
import { deferredData, trackedPromise } from "./utils/custom-matchers";
import { cleanup, createDeferred, setup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

interface CustomMatchers<R = jest.Expect> {
  trackedPromise(data?: any, error?: any, aborted?: boolean): R;
  deferredData(
    done: boolean,
    status?: number,
    headers?: Record<string, string>
  ): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend({
  deferredData,
  trackedPromise,
});

describe("deferred data", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => {
    cleanup();
  });

  it("should not track deferred responses on naked objects", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
        },
        {
          id: "lazy",
          path: "lazy",
          loader: true,
        },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/lazy");

    let dfd = createDeferred();
    await A.loaders.lazy.resolve({
      critical: "1",
      lazy: dfd.promise,
    });
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical: "1",
        lazy: expect.any(Promise),
      },
    });
    expect(t.router.state.loaderData.lazy.lazy._tracked).toBeUndefined();
  });

  it("should support returning deferred responses", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
        },
        {
          id: "lazy",
          path: "lazy",
          loader: true,
        },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/lazy");

    let dfd1 = createDeferred();
    let dfd2 = createDeferred();
    let dfd3 = createDeferred();
    dfd1.resolve("Immediate data");
    await A.loaders.lazy.resolve(
      defer({
        critical1: "1",
        critical2: "2",
        lazy1: dfd1.promise,
        lazy2: dfd2.promise,
        lazy3: dfd3.promise,
      })
    );
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical1: "1",
        critical2: "2",
        lazy1: expect.trackedPromise("Immediate data"),
        lazy2: expect.trackedPromise(),
        lazy3: expect.trackedPromise(),
      },
    });

    await dfd2.resolve("2");
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical1: "1",
        critical2: "2",
        lazy1: expect.trackedPromise("Immediate data"),
        lazy2: expect.trackedPromise("2"),
        lazy3: expect.trackedPromise(),
      },
    });

    await dfd3.resolve("3");
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical1: "1",
        critical2: "2",
        lazy1: expect.trackedPromise("Immediate data"),
        lazy2: expect.trackedPromise("2"),
        lazy3: expect.trackedPromise("3"),
      },
    });

    // Should proxy values through
    let data = t.router.state.loaderData.lazy;
    await expect(data.lazy1).resolves.toBe("Immediate data");
    await expect(data.lazy2).resolves.toBe("2");
    await expect(data.lazy3).resolves.toBe("3");
  });

  it("should cancel outstanding deferreds on a new navigation", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "lazy",
          path: "lazy",
          loader: true,
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/lazy");
    let dfd1 = createDeferred();
    let dfd2 = createDeferred();
    await A.loaders.lazy.resolve(
      defer({
        critical1: "1",
        critical2: "2",
        lazy1: dfd1.promise,
        lazy2: dfd2.promise,
      })
    );

    // Interrupt pending deferred's from /lazy navigation
    let navPromise = t.navigate("/");

    // Cancelled promises should reject immediately
    let data = t.router.state.loaderData.lazy;
    await expect(data.lazy1).rejects.toBeInstanceOf(AbortedDeferredError);
    await expect(data.lazy2).rejects.toBeInstanceOf(AbortedDeferredError);
    await expect(data.lazy1).rejects.toThrowError("Deferred data aborted");
    await expect(data.lazy2).rejects.toThrowError("Deferred data aborted");

    let B = await navPromise;

    // During navigation - deferreds remain as promises
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical1: "1",
        critical2: "2",
        lazy1: expect.trackedPromise(null, null, true),
        lazy2: expect.trackedPromise(null, null, true),
      },
    });

    // But they are frozen - no re-paints on resolve/reject!
    await dfd1.resolve("a");
    await dfd2.reject(new Error("b"));
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical1: "1",
        critical2: "2",
        lazy1: expect.trackedPromise(null, null, true),
        lazy2: expect.trackedPromise(null, null, true),
      },
    });

    await B.loaders.index.resolve("INDEX*");
    expect(t.router.state.loaderData).toEqual({
      index: "INDEX*",
    });
  });

  it("should not cancel outstanding deferreds on reused routes", async () => {
    let t = setup({
      routes: [
        {
          id: "root",
          path: "/",
          loader: true,
        },
        {
          id: "parent",
          path: "parent",
          loader: true,
          children: [
            {
              id: "a",
              path: "a",
              loader: true,
            },
            {
              id: "b",
              path: "b",
              loader: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { root: "ROOT" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/parent/a");
    let parentDfd = createDeferred();
    await A.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT",
        lazy: parentDfd.promise,
      })
    );
    let aDfd = createDeferred();
    await A.loaders.a.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: aDfd.promise,
      })
    );

    // Navigate such that we reuse the parent route
    let B = await t.navigate("/parent/b");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(),
      },
    });

    // This should reflect in loaderData
    await parentDfd.resolve("LAZY PARENT");
    // This should not
    await aDfd.resolve("LAZY A");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise("LAZY PARENT"),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true), // No re-paint!
      },
    });

    // Complete the navigation
    await B.loaders.b.resolve("B DATA");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise("LAZY PARENT"),
      },
      b: "B DATA",
    });
  });

  it("should handle promise rejections", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
        },
        {
          id: "lazy",
          path: "lazy",
          loader: true,
        },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/lazy");

    let dfd = createDeferred();
    await A.loaders.lazy.resolve(
      defer({
        critical: "1",
        lazy: dfd.promise,
      })
    );

    await dfd.reject(new Error("Kaboom!"));
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical: "1",
        lazy: expect.trackedPromise(undefined, new Error("Kaboom!")),
      },
    });

    // should proxy the error through
    let data = t.router.state.loaderData.lazy;
    await expect(data.lazy).rejects.toEqual(new Error("Kaboom!"));
  });

  it("should cancel all outstanding deferreds on router.revalidate()", async () => {
    let shouldRevalidateSpy = jest.fn(() => false);
    let t = setup({
      routes: [
        {
          id: "root",
          path: "/",
          loader: true,
        },
        {
          id: "parent",
          path: "parent",
          loader: true,
          shouldRevalidate: shouldRevalidateSpy,
          children: [
            {
              id: "index",
              index: true,
              loader: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { root: "ROOT" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/parent");
    let parentDfd = createDeferred();
    await A.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT",
        lazy: parentDfd.promise,
      })
    );
    let indexDfd = createDeferred();
    await A.loaders.index.resolve(
      defer({
        critical: "CRITICAL INDEX",
        lazy: indexDfd.promise,
      })
    );

    // Trigger a revalidation which should cancel outstanding deferreds
    let R = await t.revalidate();
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(),
      },
      index: {
        critical: "CRITICAL INDEX",
        lazy: expect.trackedPromise(),
      },
    });

    // Neither should reflect in loaderData
    await parentDfd.resolve("Nope!");
    await indexDfd.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      index: {
        critical: "CRITICAL INDEX",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    // Complete the revalidation
    let parentDfd2 = createDeferred();
    await R.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT 2",
        lazy: parentDfd2.promise,
      })
    );
    let indexDfd2 = createDeferred();
    await R.loaders.index.resolve(
      defer({
        critical: "CRITICAL INDEX 2",
        lazy: indexDfd2.promise,
      })
    );

    // Revalidations await all deferreds, so we're still in a loading
    // state with the prior loaderData here
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.revalidation).toBe("loading");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      index: {
        critical: "CRITICAL INDEX",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    await indexDfd2.resolve("LAZY INDEX 2");
    // Not done yet!
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.revalidation).toBe("loading");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      index: {
        critical: "CRITICAL INDEX",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    await parentDfd2.resolve("LAZY PARENT 2");
    // Done now that all deferreds have resolved
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.revalidation).toBe("idle");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT 2",
        lazy: expect.trackedPromise("LAZY PARENT 2"),
      },
      index: {
        critical: "CRITICAL INDEX 2",
        lazy: expect.trackedPromise("LAZY INDEX 2"),
      },
    });

    expect(shouldRevalidateSpy).not.toHaveBeenCalled();
  });

  it("cancels correctly on revalidations chains", async () => {
    let shouldRevalidateSpy = jest.fn(() => false);
    let t = setup({
      routes: [
        {
          id: "root",
          path: "/",
        },
        {
          id: "foo",
          path: "foo",
          loader: true,
          shouldRevalidate: shouldRevalidateSpy,
        },
      ],
    });

    let A = await t.navigate("/foo");
    let dfda = createDeferred();
    await A.loaders.foo.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: dfda.promise,
      })
    );
    expect(t.router.state.loaderData).toEqual({
      foo: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(),
      },
    });

    let B = await t.revalidate();
    let dfdb = createDeferred();
    // This B data will _never_ make it through - since we will await all of
    // it and we'll revalidate before it resolves
    await B.loaders.foo.resolve(
      defer({
        critical: "CRITICAL B",
        lazy: dfdb.promise,
      })
    );
    // The initial revalidation cancelled the navigation deferred
    await dfda.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      foo: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    let C = await t.revalidate();
    let dfdc = createDeferred();
    await C.loaders.foo.resolve(
      defer({
        critical: "CRITICAL C",
        lazy: dfdc.promise,
      })
    );
    // The second revalidation should have cancelled the first revalidation
    // deferred
    await dfdb.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      foo: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    // Resolve the final revalidation which should make it into loaderData
    await dfdc.resolve("Yep!");
    expect(t.router.state.loaderData).toEqual({
      foo: {
        critical: "CRITICAL C",
        lazy: expect.trackedPromise("Yep!"),
      },
    });

    expect(shouldRevalidateSpy).not.toHaveBeenCalled();
  });

  it("cancels correctly on revalidations interrupted by navigations", async () => {
    let t = setup({
      routes: [
        {
          id: "root",
          path: "/",
        },
        {
          id: "foo",
          path: "foo",
          loader: true,
        },
        {
          id: "bar",
          path: "bar",
          loader: true,
        },
      ],
    });

    let A = await t.navigate("/foo");
    let dfda = createDeferred();
    await A.loaders.foo.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: dfda.promise,
      })
    );
    await dfda.resolve("LAZY A");
    expect(t.router.state.loaderData).toEqual({
      foo: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise("LAZY A"),
      },
    });

    let B = await t.revalidate();
    let dfdb = createDeferred();
    await B.loaders.foo.resolve(
      defer({
        critical: "CRITICAL B",
        lazy: dfdb.promise,
      })
    );
    // B not reflected because its got existing loaderData
    expect(t.router.state.loaderData).toEqual({
      foo: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise("LAZY A"),
      },
    });

    let C = await t.navigate("/bar");
    let dfdc = createDeferred();
    await C.loaders.bar.resolve(
      defer({
        critical: "CRITICAL C",
        lazy: dfdc.promise,
      })
    );
    // The second revalidation should have cancelled the first revalidation
    // deferred
    await dfdb.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      bar: {
        critical: "CRITICAL C",
        lazy: expect.trackedPromise(),
      },
    });

    await dfdc.resolve("Yep!");
    expect(t.router.state.loaderData).toEqual({
      bar: {
        critical: "CRITICAL C",
        lazy: expect.trackedPromise("Yep!"),
      },
    });
  });

  it("cancels pending deferreds on 404 navigations", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "lazy",
          path: "lazy",
          loader: true,
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/lazy");
    let dfd = createDeferred();
    await A.loaders.lazy.resolve(
      defer({
        critical: "CRITICAL",
        lazy: dfd.promise,
      })
    );

    await t.navigate("/not-found");
    // Navigation completes immediately and deferreds are cancelled
    expect(t.router.state.loaderData).toEqual({});

    // Resolution doesn't do anything
    await dfd.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({});
  });

  it("cancels pending deferreds on errored GET submissions (w/ reused routes)", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "parent",
          path: "parent",
          loader: true,
          hasErrorBoundary: true,
          children: [
            {
              id: "a",
              path: "a",
              loader: true,
            },
            {
              id: "b",
              path: "b",
              loader: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    // Navigate to /parent/a and kick off a deferred's for both
    let A = await t.navigate("/parent/a");
    let parentDfd = createDeferred();
    await A.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT",
        lazy: parentDfd.promise,
      })
    );
    let aDfd = createDeferred();
    await A.loaders.a.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: aDfd.promise,
      })
    );
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(),
      },
    });

    // Perform an invalid navigation to /parent/b which will be handled
    // using parent's error boundary.  Parent's deferred should be left alone
    // while A's should be cancelled since they will no longer be rendered
    let B = await t.navigate("/parent/b");
    await B.loaders.b.reject(
      new Response("broken", { status: 400, statusText: "Bad Request" })
    );

    // Navigation completes immediately with an error at the boundary
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(),
      },
    });
    expect(t.router.state.errors).toEqual({
      parent: new ErrorResponseImpl(400, "Bad Request", "broken", false),
    });

    await parentDfd.resolve("Yep!");
    await aDfd.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise("Yep!"),
      },
    });
  });

  it("cancels pending deferreds on errored GET submissions (w/o reused routes)", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "a",
          path: "a",
          loader: true,
          children: [
            {
              id: "aChild",
              path: "child",
              loader: true,
            },
          ],
        },
        {
          id: "b",
          path: "b",
          loader: true,
          children: [
            {
              id: "bChild",
              path: "child",
              loader: true,
              hasErrorBoundary: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    // Navigate to /parent/a and kick off deferred's for both
    let A = await t.navigate("/a/child");
    let aDfd = createDeferred();
    await A.loaders.a.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: aDfd.promise,
      })
    );
    let aChildDfd = createDeferred();
    await A.loaders.aChild.resolve(
      defer({
        critical: "CRITICAL A CHILD",
        lazy: aChildDfd.promise,
      })
    );
    expect(t.router.state.loaderData).toEqual({
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(),
      },
      aChild: {
        critical: "CRITICAL A CHILD",
        lazy: expect.trackedPromise(),
      },
    });

    // Perform an invalid navigation to /b/child which should cancel all
    // pending deferred's since nothing is reused.  It should not call bChild's
    // loader since it's below the boundary but should call b's loader.
    let B = await t.navigate("/b/child");

    await B.loaders.bChild.reject(
      new Response("broken", { status: 400, statusText: "Bad Request" })
    );

    // Both should be cancelled
    await aDfd.resolve("Nope!");
    await aChildDfd.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
      aChild: {
        critical: "CRITICAL A CHILD",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    await B.loaders.b.resolve("B LOADER");
    expect(t.router.state.loaderData).toEqual({
      b: "B LOADER",
    });
    expect(t.router.state.errors).toEqual({
      bChild: new ErrorResponseImpl(400, "Bad Request", "broken", false),
    });
  });

  it("does not cancel pending deferreds on hash change only navigations", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "lazy",
          path: "lazy",
          loader: true,
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/lazy");
    let dfd = createDeferred();
    await A.loaders.lazy.resolve(
      defer({
        critical: "CRITICAL",
        lazy: dfd.promise,
      })
    );

    await t.navigate("/lazy#hash");
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical: "CRITICAL",
        lazy: expect.trackedPromise(),
      },
    });

    await dfd.resolve("Yep!");
    expect(t.router.state.loaderData).toEqual({
      lazy: {
        critical: "CRITICAL",
        lazy: expect.trackedPromise("Yep!"),
      },
    });
  });

  it("cancels pending deferreds on action submissions", async () => {
    let shouldRevalidateSpy = jest.fn(() => false);
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "parent",
          path: "parent",
          loader: true,
          shouldRevalidate: shouldRevalidateSpy,
          children: [
            {
              id: "a",
              path: "a",
              loader: true,
            },
            {
              id: "b",
              path: "b",
              action: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/parent/a");
    let parentDfd = createDeferred();
    await A.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT",
        lazy: parentDfd.promise,
      })
    );
    let aDfd = createDeferred();
    await A.loaders.a.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: aDfd.promise,
      })
    );

    // Action submission causes all to be cancelled, even reused ones, and
    // ignores shouldRevalidate since the cancelled active deferred means we
    // are missing data
    let B = await t.navigate("/parent/b", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await parentDfd.resolve("Nope!");
    await aDfd.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    await B.actions.b.resolve("ACTION");
    let parentDfd2 = createDeferred();
    await B.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT 2",
        lazy: parentDfd2.promise,
      })
    );
    expect(t.router.state.actionData).toEqual({
      b: "ACTION",
    });
    // Since we still have outstanding deferreds on the revalidation, we're
    // still in the loading state and showing the old data
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    await parentDfd2.resolve("Yep!");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT 2",
        lazy: expect.trackedPromise("Yep!"),
      },
    });

    expect(shouldRevalidateSpy).not.toHaveBeenCalled();
  });

  it("does not put resolved deferred's back into a loading state during revalidation", async () => {
    let shouldRevalidateSpy = jest.fn(() => false);
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "parent",
          path: "parent",
          loader: true,
          shouldRevalidate: shouldRevalidateSpy,
          children: [
            {
              id: "a",
              path: "a",
              loader: true,
            },
            {
              id: "b",
              path: "b",
              action: true,
              loader: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    // Route to /parent/a and return and resolve deferred's for both
    let A = await t.navigate("/parent/a");
    let parentDfd1 = createDeferred();
    let parentDfd2 = createDeferred();
    await A.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT",
        lazy1: parentDfd1.promise,
        lazy2: parentDfd2.promise,
      })
    );
    let aDfd1 = createDeferred();
    let aDfd2 = createDeferred();
    await A.loaders.a.resolve(
      defer({
        critical: "CRITICAL A",
        lazy1: aDfd1.promise,
        lazy2: aDfd2.promise,
      })
    );

    // Resolve one of the deferred for each prior to the action submission
    await parentDfd1.resolve("LAZY PARENT 1");
    await aDfd1.resolve("LAZY A 1");

    // Action submission causes all to be cancelled, even reused ones, and
    // ignores shouldRevalidate since the cancelled active deferred means we
    // are missing data
    let B = await t.navigate("/parent/b", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await parentDfd2.resolve("Nope!");
    await aDfd2.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy1: expect.trackedPromise("LAZY PARENT 1"),
        lazy2: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy1: expect.trackedPromise("LAZY A 1"),
        lazy2: expect.trackedPromise(null, null, true),
      },
    });

    await B.actions.b.resolve("ACTION");
    let parentDfd1Revalidation = createDeferred();
    let parentDfd2Revalidation = createDeferred();
    await B.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT*",
        lazy1: parentDfd1Revalidation.promise,
        lazy2: parentDfd2Revalidation.promise,
      })
    );
    await B.loaders.b.resolve("B");

    // At this point, we resolved the action and the loaders - however the
    // parent loader returned a deferred so we stay in the "loading" state
    // until everything resolves
    expect(t.router.state.navigation.state).toBe("loading");
    expect(t.router.state.actionData).toEqual({
      b: "ACTION",
    });
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy1: expect.trackedPromise("LAZY PARENT 1"),
        lazy2: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy1: expect.trackedPromise("LAZY A 1"),
        lazy2: expect.trackedPromise(null, null, true),
      },
    });

    // Resolve the first deferred - should not complete the navigation yet
    await parentDfd1Revalidation.resolve("LAZY PARENT 1*");
    expect(t.router.state.navigation.state).toBe("loading");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy1: expect.trackedPromise("LAZY PARENT 1"),
        lazy2: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy1: expect.trackedPromise("LAZY A 1"),
        lazy2: expect.trackedPromise(null, null, true),
      },
    });

    await parentDfd2Revalidation.resolve("LAZY PARENT 2*");
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.actionData).toEqual({
      b: "ACTION",
    });
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT*",
        lazy1: expect.trackedPromise("LAZY PARENT 1*"),
        lazy2: expect.trackedPromise("LAZY PARENT 2*"),
      },
      b: "B",
    });

    expect(shouldRevalidateSpy).not.toHaveBeenCalled();
  });

  it("triggers fallbacks on new dynamic route instances", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "invoice",
          path: "invoices/:id",
          loader: true,
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/invoices/1");
    let dfd1 = createDeferred();
    await A.loaders.invoice.resolve(defer({ lazy: dfd1.promise }));
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise(),
      },
    });

    await dfd1.resolve("DATA 1");
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise("DATA 1"),
      },
    });

    // Goes back into a loading state since this is a new instance of the
    // invoice route
    let B = await t.navigate("/invoices/2");
    let dfd2 = createDeferred();
    await B.loaders.invoice.resolve(defer({ lazy: dfd2.promise }));
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise(),
      },
    });

    await dfd2.resolve("DATA 2");
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise("DATA 2"),
      },
    });
  });

  it("triggers fallbacks on new splat route instances", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "invoices",
          path: "invoices",
          children: [
            {
              id: "invoice",
              path: "*",
              loader: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/invoices/1");
    let dfd1 = createDeferred();
    await A.loaders.invoice.resolve(defer({ lazy: dfd1.promise }));
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise(),
      },
    });

    await dfd1.resolve("DATA 1");
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise("DATA 1"),
      },
    });

    // Goes back into a loading state since this is a new instance of the
    // invoice route
    let B = await t.navigate("/invoices/2");
    let dfd2 = createDeferred();
    await B.loaders.invoice.resolve(defer({ lazy: dfd2.promise }));
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise(),
      },
    });

    await dfd2.resolve("DATA 2");
    expect(t.router.state.loaderData).toEqual({
      invoice: {
        lazy: expect.trackedPromise("DATA 2"),
      },
    });
  });

  it("cancels awaited reused deferreds on subsequent navigations", async () => {
    let shouldRevalidateSpy = jest.fn(() => false);
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "parent",
          path: "parent",
          loader: true,
          shouldRevalidate: shouldRevalidateSpy,
          children: [
            {
              id: "a",
              path: "a",
              loader: true,
            },
            {
              id: "b",
              path: "b",
              action: true,
              loader: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    // Route to /parent/a and return and resolve deferred's for both
    let A = await t.navigate("/parent/a");
    let parentDfd = createDeferred(); // Never resolves in this test
    await A.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT",
        lazy: parentDfd.promise,
      })
    );
    let aDfd = createDeferred();
    await A.loaders.a.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: aDfd.promise,
      })
    );

    // Action submission to cancel deferreds
    let B = await t.navigate("/parent/b", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(),
      },
    });

    await B.actions.b.resolve("ACTION");
    let parentDfd2 = createDeferred(); // Never resolves in this test
    await B.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT*",
        lazy: parentDfd2.promise,
      })
    );
    await B.loaders.b.resolve("B");

    // Still in loading state due to revalidation deferred
    expect(t.router.state.navigation.state).toBe("loading");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    // Navigate elsewhere - should cancel/abort revalidation deferreds
    let C = await t.navigate("/");
    await C.loaders.index.resolve("INDEX*");
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.actionData).toEqual(null);
    expect(t.router.state.loaderData).toEqual({
      index: "INDEX*",
    });
  });

  it("does not support deferred data on fetcher loads", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
        },
        {
          id: "fetch",
          path: "fetch",
          loader: true,
        },
      ],
      initialEntries: ["/"],
    });

    let key = "key";
    let A = await t.fetch("/fetch", key);

    // deferred in a fetcher awaits all data in the loading state
    let dfd = createDeferred();
    await A.loaders.fetch.resolve(
      defer({
        critical: "1",
        lazy: dfd.promise,
      })
    );
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "loading",
      data: undefined,
    });

    await dfd.resolve("2");
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: {
        critical: "1",
        lazy: "2",
      },
    });

    // Trigger a revalidation for the same fetcher
    let B = await t.revalidate("fetch", "fetch");
    expect(t.router.state.revalidation).toBe("loading");
    let dfd2 = createDeferred();
    await B.loaders.fetch.resolve(
      defer({
        critical: "3",
        lazy: dfd2.promise,
      })
    );
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: {
        critical: "1",
        lazy: "2",
      },
    });

    await dfd2.resolve("4");
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: {
        critical: "3",
        lazy: "4",
      },
    });
  });

  it("triggers error boundaries if fetcher deferred data rejects", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
        },
        {
          id: "fetch",
          path: "fetch",
          loader: true,
        },
      ],
      initialEntries: ["/"],
    });

    let key = "key";
    let A = await t.fetch("/fetch", key);

    let dfd = createDeferred();
    await A.loaders.fetch.resolve(
      defer({
        critical: "1",
        lazy: dfd.promise,
      })
    );
    await dfd.reject(new Error("Kaboom!"));
    expect(t.router.state.errors).toMatchObject({
      index: new Error("Kaboom!"),
    });
    expect(t.router.state.fetchers.get(key)).toBeUndefined();
  });

  it("cancels pending deferreds on fetcher reloads", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
        },
        {
          id: "fetch",
          path: "fetch",
          loader: true,
        },
      ],
      initialEntries: ["/"],
    });

    let key = "key";
    let A = await t.fetch("/fetch", key);

    // deferred in a fetcher awaits all data in the loading state
    let dfd1 = createDeferred();
    let loaderPromise1 = A.loaders.fetch.resolve(
      defer({
        critical: "1",
        lazy: dfd1.promise,
      })
    );
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "loading",
      data: undefined,
    });

    // Fetch again
    let B = await t.fetch("/fetch", key);

    let dfd2 = createDeferred();
    let loaderPromise2 = B.loaders.fetch.resolve(
      defer({
        critical: "3",
        lazy: dfd2.promise,
      })
    );
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "loading",
      data: undefined,
    });

    // Resolving the second finishes us up
    await dfd1.resolve("2");
    await dfd2.resolve("4");
    await loaderPromise1;
    await loaderPromise2;
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: {
        critical: "3",
        lazy: "4",
      },
    });
  });

  it("cancels pending deferreds on fetcher action submissions", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "parent",
          path: "parent",
          loader: true,
          shouldRevalidate: () => false,
          children: [
            {
              id: "a",
              path: "a",
              loader: true,
            },
            {
              id: "b",
              path: "b",
              action: true,
            },
          ],
        },
      ],
      hydrationData: { loaderData: { index: "INDEX" } },
      initialEntries: ["/"],
    });

    let A = await t.navigate("/parent/a");
    let parentDfd = createDeferred();
    await A.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT",
        lazy: parentDfd.promise,
      })
    );
    let aDfd = createDeferred();
    await A.loaders.a.resolve(
      defer({
        critical: "CRITICAL A",
        lazy: aDfd.promise,
      })
    );

    // Fetcher action submission causes all to be cancelled and
    // ignores shouldRevalidate since the cancelled active deferred means we
    // are missing data
    let key = "key";
    let B = await t.fetch("/parent/b", key, {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    await parentDfd.resolve("Nope!");
    await aDfd.resolve("Nope!");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    await B.actions.b.resolve("ACTION");
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "loading",
      data: "ACTION",
    });

    await B.actions.b.resolve("ACTION");
    let parentDfd2 = createDeferred();
    await B.loaders.parent.resolve(
      defer({
        critical: "CRITICAL PARENT 2",
        lazy: parentDfd2.promise,
      })
    );
    let aDfd2 = createDeferred();
    await B.loaders.a.resolve(
      defer({
        critical: "CRITICAL A 2",
        lazy: aDfd2.promise,
      })
    );

    // Still showing old data while we wait on revalidation deferreds to
    // complete
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT",
        lazy: expect.trackedPromise(null, null, true),
      },
      a: {
        critical: "CRITICAL A",
        lazy: expect.trackedPromise(null, null, true),
      },
    });

    await parentDfd2.resolve("Yep!");
    await aDfd2.resolve("Yep!");
    expect(t.router.state.loaderData).toEqual({
      parent: {
        critical: "CRITICAL PARENT 2",
        lazy: expect.trackedPromise("Yep!"),
      },
      a: {
        critical: "CRITICAL A 2",
        lazy: expect.trackedPromise("Yep!"),
      },
    });
    expect(t.router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: "ACTION",
    });
  });

  it("differentiates between navigation and fetcher deferreds on cancellations", async () => {
    let dfds: Array<ReturnType<typeof createDeferred>> = [];
    let signals: Array<AbortSignal> = [];
    let router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/"] }),
      routes: [
        {
          id: "root",
          path: "/",
          loader: ({ request }) => {
            let dfd = createDeferred();
            dfds.push(dfd);
            signals.push(request.signal);
            return defer({ value: dfd.promise });
          },
        },
      ],
      hydrationData: {
        loaderData: {
          root: { value: -1 },
        },
      },
    });

    // navigate to root, kicking off a reload of the root loader
    let key = "key";
    router.navigate("/");
    router.fetch(key, "root", "/");
    await tick();
    expect(router.state.navigation.state).toBe("loading");
    expect(router.state.loaderData).toEqual({
      root: { value: -1 },
    });
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "loading",
      data: undefined,
    });

    // Interrupt with a revalidation
    router.revalidate();

    // Original deferreds should do nothing on resolution
    dfds[0].resolve(0);
    dfds[1].resolve(1);
    await tick();
    expect(router.state.navigation.state).toBe("loading");
    expect(router.state.loaderData).toEqual({
      root: { value: -1 },
    });
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "loading",
      data: undefined,
    });

    // New deferreds should complete the revalidation
    dfds[2].resolve(2);
    dfds[3].resolve(3);
    await tick();
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.loaderData).toEqual({
      root: { value: expect.trackedPromise(2) },
    });
    expect(router.state.fetchers.get(key)).toMatchObject({
      state: "idle",
      data: { value: 3 },
    });

    // Assert that both the route loader and fetcher loader were aborted
    expect(signals[0].aborted).toBe(true); // initial route
    expect(signals[1].aborted).toBe(true); // initial fetcher
    expect(signals[2].aborted).toBe(false); // revalidating route
    expect(signals[3].aborted).toBe(false); // revalidating fetcher

    expect(router._internalActiveDeferreds.size).toBe(0);
    expect(router._internalFetchControllers.size).toBe(0);
    router.dispose();
  });
});
