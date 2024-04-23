import type { DataStrategyFunction, DataStrategyMatch } from "../utils";
import { json } from "../utils";
import { createDeferred, setup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

describe("router dataStrategy", () => {
  function mockDataStrategy(fn: DataStrategyFunction) {
    return jest.fn<
      ReturnType<DataStrategyFunction>,
      Parameters<DataStrategyFunction>
    >(fn);
  }

  describe("loaders", () => {
    it("should allow a custom implementation to passthrough to default behavior", async () => {
      let dataStrategy = mockDataStrategy(({ matches }) =>
        Promise.all(matches.map((m) => m.resolve()))
      );
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "json",
            path: "/test",
            loader: true,
            children: [
              {
                id: "text",
                index: true,
                loader: true,
              },
            ],
          },
        ],
        dataStrategy,
      });

      let A = await t.navigate("/test");

      // Should be called in parallel
      expect(A.loaders.json.stub).toHaveBeenCalledTimes(1);
      expect(A.loaders.text.stub).toHaveBeenCalledTimes(1);

      await A.loaders.json.resolve(json({ message: "hello json" }));
      await A.loaders.text.resolve(new Response("hello text"));

      expect(t.router.state.loaderData).toEqual({
        json: { message: "hello json" },
        text: "hello text",
      });
      expect(dataStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Request),
          params: {},
          matches: [
            expect.objectContaining({
              route: expect.objectContaining({
                id: "json",
              }),
            }),
            expect.objectContaining({
              route: expect.objectContaining({
                id: "text",
              }),
            }),
          ],
        })
      );
    });

    it("should allow a custom implementation to passthrough to default behavior and lazy", async () => {
      let dataStrategy = mockDataStrategy(({ matches }) =>
        Promise.all(matches.map((m) => m.resolve()))
      );
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "json",
            path: "/test",
            lazy: true,
            children: [
              {
                id: "text",
                index: true,
                lazy: true,
              },
            ],
          },
        ],
        dataStrategy,
      });

      let A = await t.navigate("/test");
      await A.lazy.json.resolve({
        loader: () => ({ message: "hello json" }),
      });
      await A.lazy.text.resolve({
        loader: () => "hello text",
      });
      expect(t.router.state.loaderData).toEqual({
        json: { message: "hello json" },
        text: "hello text",
      });
      expect(dataStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Request),
          matches: [
            expect.objectContaining({
              route: expect.objectContaining({
                id: "json",
              }),
            }),
            expect.objectContaining({
              route: expect.objectContaining({
                id: "text",
              }),
            }),
          ],
        })
      );
    });

    it("should allow custom implementations to override default behavior", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "test",
            path: "/test",
            loader: true,
          },
        ],
        async dataStrategy({ matches }) {
          return Promise.all(
            matches.map((m) =>
              m.resolve(async (handler) => {
                let result = await handler();
                return {
                  type: "data",
                  result: `Route ID "${m.route.id}" returned "${result}"`,
                };
              })
            )
          );
        },
      });

      let A = await t.navigate("/test");
      await A.loaders.test.resolve("TEST");

      expect(t.router.state.loaderData).toMatchObject({
        test: 'Route ID "test" returned "TEST"',
      });
    });

    it("should allow custom implementations to override default behavior with lazy", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "test",
            path: "/test",
            lazy: true,
          },
        ],
        async dataStrategy({ matches }) {
          return Promise.all(
            matches.map((m) =>
              m.resolve(async (handler) => {
                let result = await handler();
                return {
                  type: "data",
                  result: `Route ID "${m.route.id}" returned "${result}"`,
                };
              })
            )
          );
        },
      });

      let A = await t.navigate("/test");
      await A.lazy.test.resolve({ loader: () => "TEST" });

      expect(t.router.state.loaderData).toMatchObject({
        test: 'Route ID "test" returned "TEST"',
      });
    });

    it("handles errors at the proper boundary", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            path: "/parent",
            children: [
              {
                id: "child",
                path: "child",
                hasErrorBoundary: true,
                children: [
                  {
                    id: "test",
                    index: true,
                    loader: true,
                  },
                ],
              },
            ],
          },
        ],
        dataStrategy({ matches }) {
          return Promise.all(matches.map(async (match) => match.resolve()));
        },
      });

      let A = await t.navigate("/parent/child");
      await A.loaders.test.reject(new Error("ERROR"));

      expect(t.router.state.loaderData.test).toBeUndefined();
      expect(t.router.state.errors?.child.message).toBe("ERROR");
    });

    it("handles errors at the proper boundary with a custom implementation", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            path: "/parent",
            children: [
              {
                id: "child",
                path: "child",
                hasErrorBoundary: true,
                children: [
                  {
                    id: "test",
                    index: true,
                    loader: true,
                  },
                ],
              },
            ],
          },
        ],
        dataStrategy({ matches }) {
          return Promise.all(
            matches.map((match) => {
              return match.resolve(async (handler) => {
                return {
                  type: "data",
                  result: await handler(),
                };
              });
            })
          );
        },
      });

      let A = await t.navigate("/parent/child");
      await A.loaders.test.reject(new Error("ERROR"));

      expect(t.router.state.loaderData.test).toBeUndefined();
      expect(t.router.state.errors?.child.message).toBe("ERROR");
    });

    it("bubbles to the root if dataStrategy throws", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: true,
            children: [
              {
                id: "child",
                path: "child",
                loader: true,
              },
            ],
          },
        ],
        dataStrategy({ matches }) {
          throw new Error("Uh oh");
        },
      });

      let A = await t.navigate("/parent/child");
      await A.loaders.parent.resolve("PARENT");

      expect(t.router.state).toMatchObject({
        actionData: null,
        errors: {
          parent: new Error("Uh oh"),
        },
        loaderData: {},
        navigation: {
          state: "idle",
        },
      });
    });

    it("throws an error if an implementation does not call resolve", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: true,
            hasErrorBoundary: true,
            children: [
              {
                id: "child",
                path: "child",
                lazy: true,
              },
            ],
          },
        ],
        // @ts-expect-error
        dataStrategy({ matches }) {
          return Promise.all(
            matches.map(async (match) => {
              if (match.route.id === "child") {
                // noop to cause error
                return "forgot to load child";
              }
              return match.resolve();
            })
          );
        },
      });

      let A = await t.navigate("/parent/child");
      await A.loaders.parent.resolve("PARENT");

      expect(t.router.state).toMatchObject({
        actionData: null,
        errors: {
          parent: new Error(
            '`match.resolve()` was not called for route id "child". ' +
              "You must call `match.resolve()` on every match passed " +
              "to `dataStrategy` to ensure all routes are properly loaded."
          ),
        },
        loaderData: {
          child: undefined,
          parent: undefined,
        },
        navigation: {
          state: "idle",
        },
      });
    });

    it("indicates which routes need to load via match.shouldLoad", async () => {
      let dataStrategy = jest.fn<
        ReturnType<DataStrategyFunction>,
        Parameters<DataStrategyFunction>
      >(({ matches }) => {
        return Promise.all(matches.map((m) => m.resolve()));
      });
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            loader: true,
            children: [
              {
                id: "parent",
                path: "parent",
                loader: true,
                action: true,
                children: [
                  {
                    id: "child",
                    path: "child",
                    lazy: true,
                  },
                ],
              },
            ],
          },
        ],
        dataStrategy,
        hydrationData: {
          // don't call dataStrategy on hydration
          loaderData: { root: null },
        },
      });

      let A = await t.navigate("/");
      expect(dataStrategy.mock.calls[0][0].matches).toEqual([
        expect.objectContaining({
          shouldLoad: true,
          route: expect.objectContaining({ id: "root" }),
        }),
      ]);
      await A.loaders.root.resolve("ROOT");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      let B = await t.navigate("/parent");
      expect(dataStrategy.mock.calls[1][0].matches).toEqual([
        expect.objectContaining({
          shouldLoad: false,
          route: expect.objectContaining({ id: "root" }),
        }),
        expect.objectContaining({
          shouldLoad: true,
          route: expect.objectContaining({ id: "parent" }),
        }),
      ]);
      await B.loaders.parent.resolve("PARENT");
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        parent: "PARENT",
      });

      let C = await t.navigate("/parent/child");
      expect(dataStrategy.mock.calls[2][0].matches).toEqual([
        expect.objectContaining({
          shouldLoad: false,
          route: expect.objectContaining({ id: "root" }),
        }),
        expect.objectContaining({
          shouldLoad: false,
          route: expect.objectContaining({ id: "parent" }),
        }),
        expect.objectContaining({
          shouldLoad: true,
          route: expect.objectContaining({ id: "child" }),
        }),
      ]);
      await C.lazy.child.resolve({
        action: () => "CHILD ACTION",
        loader: () => "CHILD",
        shouldRevalidate: () => false,
      });
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        parent: "PARENT",
        child: "CHILD",
      });

      await t.navigate("/parent/child", {
        formMethod: "post",
        formData: createFormData({}),
      });
      await tick();
      expect(dataStrategy.mock.calls[3][0].matches).toEqual([
        expect.objectContaining({
          shouldLoad: false,
          route: expect.objectContaining({ id: "root" }),
        }),
        expect.objectContaining({
          shouldLoad: false,
          route: expect.objectContaining({ id: "parent" }),
        }),
        expect.objectContaining({
          shouldLoad: true, // action
          route: expect.objectContaining({ id: "child" }),
        }),
      ]);
      expect(dataStrategy.mock.calls[4][0].matches).toEqual([
        expect.objectContaining({
          shouldLoad: true,
          route: expect.objectContaining({ id: "root" }),
        }),
        expect.objectContaining({
          shouldLoad: true,
          route: expect.objectContaining({ id: "parent" }),
        }),
        expect.objectContaining({
          shouldLoad: false, // shouldRevalidate=false
          route: expect.objectContaining({ id: "child" }),
        }),
      ]);
      expect(t.router.state.actionData).toMatchObject({
        child: "CHILD ACTION",
      });
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        parent: "PARENT",
        child: "CHILD",
      });
    });
  });

  describe("actions", () => {
    it("should allow a custom implementation to passthrough to default behavior", async () => {
      let dataStrategy = mockDataStrategy(({ matches }) =>
        Promise.all(matches.map((m) => m.resolve()))
      );
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "json",
            path: "/test",
            action: true,
          },
        ],
        dataStrategy,
      });

      let A = await t.navigate("/test", {
        formMethod: "post",
        formData: createFormData({}),
      });

      await A.actions.json.resolve(json({ message: "hello json" }));

      expect(t.router.state.actionData).toEqual({
        json: { message: "hello json" },
      });
      expect(dataStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Request),
          matches: [
            expect.objectContaining({
              route: expect.objectContaining({
                id: "json",
              }),
            }),
          ],
        })
      );
    });

    it("should allow a custom implementation to passthrough to default behavior and lazy", async () => {
      let dataStrategy = mockDataStrategy(({ matches }) =>
        Promise.all(matches.map((m) => m.resolve()))
      );
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "json",
            path: "/test",
            lazy: true,
          },
        ],
        dataStrategy,
      });

      let A = await t.navigate("/test", {
        formMethod: "post",
        formData: createFormData({}),
      });
      await A.lazy.json.resolve({
        action: () => ({ message: "hello json" }),
      });
      expect(t.router.state.actionData).toEqual({
        json: { message: "hello json" },
      });
      expect(dataStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Request),
          matches: [
            expect.objectContaining({
              route: expect.objectContaining({
                id: "json",
              }),
            }),
          ],
        })
      );
    });
  });

  describe("fetchers", () => {
    describe("loaders", () => {
      it("should allow a custom implementation to passthrough to default behavior", async () => {
        let dataStrategy = mockDataStrategy(({ matches }) =>
          Promise.all(matches.map((m) => m.resolve()))
        );
        let t = setup({
          routes: [
            {
              path: "/",
            },
            {
              id: "json",
              path: "/test",
              loader: true,
            },
          ],
          dataStrategy,
        });

        let key = "key";
        let A = await t.fetch("/test", key);

        await A.loaders.json.resolve(json({ message: "hello json" }));

        expect(t.router.state.fetchers.get(key)?.data.message).toBe(
          "hello json"
        );

        expect(dataStrategy).toHaveBeenCalledWith(
          expect.objectContaining({
            request: expect.any(Request),
            matches: [
              expect.objectContaining({
                route: expect.objectContaining({
                  id: "json",
                }),
              }),
            ],
          })
        );
      });

      it("should allow a custom implementation to passthrough to default behavior and lazy", async () => {
        let dataStrategy = mockDataStrategy(({ matches }) =>
          Promise.all(matches.map((m) => m.resolve()))
        );
        let t = setup({
          routes: [
            {
              path: "/",
            },
            {
              id: "json",
              path: "/test",
              lazy: true,
            },
          ],
          dataStrategy,
        });

        let key = "key";
        let A = await t.fetch("/test", key);
        await A.lazy.json.resolve({
          loader: () => ({ message: "hello json" }),
        });
        expect(t.router.state.fetchers.get(key)?.data.message).toBe(
          "hello json"
        );
        expect(dataStrategy).toHaveBeenCalledWith(
          expect.objectContaining({
            request: expect.any(Request),
            matches: [
              expect.objectContaining({
                route: expect.objectContaining({
                  id: "json",
                }),
              }),
            ],
          })
        );
      });
    });

    describe("actions", () => {
      it("should allow a custom implementation to passthrough to default behavior", async () => {
        let dataStrategy = mockDataStrategy(({ matches }) =>
          Promise.all(matches.map((m) => m.resolve()))
        );
        let t = setup({
          routes: [
            {
              path: "/",
            },
            {
              id: "json",
              path: "/test",
              action: true,
            },
          ],
          dataStrategy,
        });

        let key = "key";
        let A = await t.fetch("/test", key, {
          formMethod: "post",
          formData: createFormData({}),
        });

        await A.actions.json.resolve(json({ message: "hello json" }));

        expect(t.router.state.fetchers.get(key)?.data.message).toBe(
          "hello json"
        );

        expect(dataStrategy).toHaveBeenCalledWith(
          expect.objectContaining({
            request: expect.any(Request),
            matches: expect.arrayContaining([
              expect.objectContaining({
                route: expect.objectContaining({
                  id: "json",
                }),
              }),
            ]),
          })
        );
      });

      it("should allow a custom implementation to passthrough to default behavior and lazy", async () => {
        let dataStrategy = mockDataStrategy(({ matches }) =>
          Promise.all(matches.map((m) => m.resolve()))
        );
        let t = setup({
          routes: [
            {
              path: "/",
            },
            {
              id: "json",
              path: "/test",
              lazy: true,
            },
          ],
          dataStrategy,
        });

        let key = "key";
        let A = await t.fetch("/test", key, {
          formMethod: "post",
          formData: createFormData({}),
        });
        await A.lazy.json.resolve({
          action: () => ({ message: "hello json" }),
        });

        expect(t.router.state.fetchers.get(key)?.data.message).toBe(
          "hello json"
        );

        expect(dataStrategy).toHaveBeenCalledWith(
          expect.objectContaining({
            request: expect.any(Request),
            matches: expect.arrayContaining([
              expect.objectContaining({
                route: expect.objectContaining({
                  id: "json",
                }),
              }),
            ]),
          })
        );
      });
    });
  });

  describe("use-cases", () => {
    it("permits users to take control over response decoding", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "json",
            path: "/test",
            loader: true,
            children: [
              {
                id: "reverse",
                index: true,
                loader: true,
              },
            ],
          },
        ],
        async dataStrategy({ matches }) {
          return Promise.all(
            matches.map(async (m) => {
              return await m.resolve(async (handler) => {
                let result = await handler();
                if (
                  result instanceof Response &&
                  result.headers.get("Content-Type") === "application/reverse"
                ) {
                  let str = await result.text();
                  return {
                    type: "data",
                    result: {
                      original: str,
                      reversed: str.split("").reverse().join(""),
                    },
                  };
                }
                // This will be a JSON response we expect to be decoded the normal way
                return { type: "data", result };
              });
            })
          );
        },
      });

      let A = await t.navigate("/test");
      await A.loaders.json.resolve(json({ message: "hello json" }));
      await A.loaders.reverse.resolve(
        new Response("hello text", {
          headers: { "Content-Type": "application/reverse" },
        })
      );

      expect(t.router.state.loaderData).toEqual({
        json: { message: "hello json" },
        reverse: {
          original: "hello text",
          reversed: "txet olleh",
        },
      });
    });

    it("allows a single-fetch type approach", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: true,
            children: [
              {
                id: "child",
                path: "child",
                loader: true,
              },
            ],
          },
        ],
        async dataStrategy({ matches }) {
          // Hold a deferred for each route we need to load
          let routeDeferreds: Map<
            string,
            ReturnType<typeof createDeferred>
          > = new Map();

          // Use resolve's to create and await a deferred for each
          // route that needs to load
          let matchPromises = matches.map((m) =>
            m.resolve(() => {
              // Don't call handler, just create a deferred we can resolve from
              // the single fetch response and return it's promise
              let dfd = createDeferred();
              routeDeferreds.set(m.route.id, dfd);
              return dfd.promise;
            })
          );

          // Mocked single fetch call response for the routes that need loading
          let result = {
            loaderData: {
              parent: "PARENT",
              child: "CHILD",
            },
            errors: null,
          };

          // Resolve the deferred's above and return the mapped match promises
          routeDeferreds.forEach((dfd, routeId) =>
            dfd.resolve({ type: "data", result: result.loaderData[routeId] })
          );
          return Promise.all(matchPromises);
        },
      });

      await t.navigate("/parent/child");

      // We don't even have to resolve the loader here because it'll never
      // be called in this test
      await tick();

      expect(t.router.state.loaderData).toMatchObject({
        parent: "PARENT",
        child: "CHILD",
      });
    });

    it("allows middleware/context implementations", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: true,
            handle: {
              context: {
                parent: () => ({ id: "parent" }),
              },
              middleware(context) {
                context.parent.whatever = "PARENT MIDDLEWARE";
              },
            },
            children: [
              {
                id: "child",
                path: "child",
                loader: true,
                handle: {
                  context: {
                    child: () => ({ id: "child" }),
                  },
                  middleware(context) {
                    context.child.whatever = "CHILD MIDDLEWARE";
                  },
                },
              },
            ],
          },
        ],
        async dataStrategy({ matches }) {
          // Run context/middleware sequentially
          let context = matches.reduce((acc, m) => {
            if (m.route.handle?.context) {
              let matchContext = Object.entries(m.route.handle.context).reduce(
                (acc, [key, value]) =>
                  Object.assign(acc, {
                    // @ts-expect-error
                    [key]: value(),
                  }),
                {}
              );
              Object.assign(acc, matchContext);
            }
            if (m.route.handle?.middleware) {
              m.route.handle.middleware(acc);
            }
            return acc;
          }, {});

          // Run loaders in parallel only exposing contexts from above
          return Promise.all(
            matches.map((m, i) =>
              m.resolve(async (handler) => {
                // Only provide context values up to this level in the matches
                let handlerCtx = matches.slice(0, i + 1).reduce((acc, m) => {
                  Object.keys(m.route.handle?.context).forEach((k) => {
                    acc[k] = context[k];
                  });
                  return acc;
                }, {});
                return { type: "data", result: await handler(handlerCtx) };
              })
            )
          );
        },
      });

      let A = await t.navigate("/parent/child");

      // Loaders are called with context from their level and above, and
      // context reflects any values set by middleware
      expect(A.loaders.parent.stub).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Request),
          params: expect.any(Object),
        }),
        {
          parent: {
            id: "parent",
            whatever: "PARENT MIDDLEWARE",
          },
        }
      );

      expect(A.loaders.child.stub).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Request),
          params: expect.any(Object),
        }),
        {
          parent: {
            id: "parent",
            whatever: "PARENT MIDDLEWARE",
          },
          child: {
            id: "child",
            whatever: "CHILD MIDDLEWARE",
          },
        }
      );

      await A.loaders.parent.resolve("PARENT LOADER");
      expect(t.router.state.navigation.state).toBe("loading");

      await A.loaders.child.resolve("CHILD LOADER");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toMatchObject({
        parent: "PARENT LOADER",
        child: "CHILD LOADER",
      });
    });

    it("allows middleware/context implementations when some routes don't need to revalidate", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: true,
            handle: {
              context: {
                parent: () => ({ id: "parent" }),
              },
              middleware(context) {
                context.parent.whatever = "PARENT MIDDLEWARE";
              },
            },
            children: [
              {
                id: "child",
                path: "child",
                loader: true,
                handle: {
                  context: {
                    child: () => ({ id: "child" }),
                  },
                  middleware(context) {
                    context.child.whatever = "CHILD MIDDLEWARE";
                  },
                },
              },
            ],
          },
        ],
        async dataStrategy({ matches }) {
          // Run context/middleware sequentially
          let context = matches.reduce((acc, m) => {
            if (m.route.handle?.context) {
              let matchContext = Object.entries(m.route.handle.context).reduce(
                (acc, [key, value]) =>
                  Object.assign(acc, {
                    // @ts-expect-error
                    [key]: value(),
                  }),
                {}
              );
              Object.assign(acc, matchContext);
            }
            if (m.route.handle?.middleware) {
              m.route.handle.middleware(acc);
            }
            return acc;
          }, {});

          // Run loaders in parallel only exposing contexts from above
          return Promise.all(
            matches.map((m, i) =>
              m.resolve(async (callHandler) => {
                // Only provide context values up to this level in the matches
                let handlerCtx = matches.slice(0, i + 1).reduce((acc, m) => {
                  Object.keys(m.route.handle?.context).forEach((k) => {
                    acc[k] = context[k];
                  });
                  return acc;
                }, {});
                return { type: "data", result: await callHandler(handlerCtx) };
              })
            )
          );
        },
      });

      let A = await t.navigate("/parent");
      await A.loaders.parent.resolve("PARENT");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toMatchObject({
        parent: "PARENT",
      });

      let B = await t.navigate("/parent/child");

      // Loaders are called with context from their level and above, and
      // context reflects any values set by middleware
      expect(B.loaders.child.stub).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.any(Request),
          params: expect.any(Object),
        }),
        {
          parent: {
            id: "parent",
            whatever: "PARENT MIDDLEWARE",
          },
          child: {
            id: "child",
            whatever: "CHILD MIDDLEWARE",
          },
        }
      );

      await B.loaders.child.resolve("CHILD");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toMatchObject({
        parent: "PARENT",
        child: "CHILD",
      });
    });

    it("allows automatic caching of loader results", async () => {
      let cache: Record<string, unknown> = {};
      let t = setup({
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: true,
            handle: {
              cacheKey: (url: string) => new URL(url).pathname,
            },
            children: [
              {
                id: "child",
                path: "child",
                loader: true,
                action: true,
              },
            ],
          },
        ],
        async dataStrategy({ request, matches }) {
          const getCacheKey = (m: DataStrategyMatch) =>
            m.route.handle?.cacheKey
              ? [m.route.id, m.route.handle.cacheKey(request.url)].join("-")
              : null;

          return Promise.all(
            matches.map(async (m) => {
              return m.resolve(async (handler) => {
                if (request.method !== "GET") {
                  // invalidate on actions
                  cache = {};
                  return { type: "data", result: await handler() };
                }

                let key = getCacheKey(m);
                if (key && cache[key]) {
                  return { type: "data", result: cache[key] };
                }

                let handlerResult = await handler();
                if (key) {
                  cache[key] = handlerResult;
                }

                return { type: "data", result: handlerResult };
              });
            })
          );
        },
      });

      let A = await t.navigate("/parent/child");
      await A.loaders.parent.resolve("PARENT");
      await A.loaders.child.resolve("CHILD");

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        loaderData: {
          parent: "PARENT",
          child: "CHILD",
        },
      });

      // Changing search params should force revalidation, but pathname-based
      // cache will serve the old data
      let B = await t.navigate("/parent/child?a=b");
      await B.loaders.child.resolve("CHILD*");

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        loaderData: {
          parent: "PARENT",
          child: "CHILD*",
        },
      });

      // Useless resolution - handler was never called for parent
      await B.loaders.parent.resolve("PARENT*");

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        loaderData: {
          parent: "PARENT",
          child: "CHILD*",
        },
      });

      // Action to invalidate the cache
      let C = await t.navigate("/parent/child?a=b", {
        formMethod: "post",
        formData: createFormData({}),
      });
      await C.actions.child.resolve("ACTION");
      await C.loaders.parent.resolve("PARENT**");
      await C.loaders.child.resolve("CHILD**");

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        actionData: {
          child: "ACTION",
        },
        loaderData: {
          parent: "PARENT**",
          child: "CHILD**",
        },
      });
    });
  });
});
