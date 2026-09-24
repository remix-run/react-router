import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { LoaderFunction } from "../index";
import {
  Outlet,
  RouterProvider,
  createMemoryRouter,
  redirect,
  useLoaderData,
  useRouteError,
} from "../index";
import { createDeferred as deferred } from "./router/utils/utils";
import { getFetcherData } from "./router/utils/data-router-setup";

const Layout = () => (
  <main>
    <p>{useLoaderData() as string}</p>
    <Outlet />
  </main>
);
const Child = () => <p>child {useLoaderData() as string}</p>;
const ErrorPage = () => (
  <p role="alert">{(useRouteError() as Error).message}</p>
);

const setup = (
  destination = "/layout/next",
  childBoundary = false,
  layoutBoundary = false,
) => {
  const backgroundAction = deferred();
  const backgroundStarted = deferred();
  const navigationAction = deferred();
  const navigationStarted = deferred();
  const backgroundRoot = deferred();
  const backgroundRootStarted = deferred();
  const nextChild = deferred();
  const nextChildStarted = deferred();
  const nextChildLoader = jest.fn(() => {
    nextChildStarted.resolve(null);
    return nextChild.promise;
  });
  const layoutLoader = jest.fn<
    ReturnType<LoaderFunction>,
    Parameters<LoaderFunction>
  >(() => "layout initial");
  const saveAction = jest.fn(async () => {
    navigationStarted.resolve(null);
    await navigationAction.promise;
    return redirect(destination);
  });
  const resourceLoader = jest.fn(() => "resource initial");
  const resourceShouldRevalidate = jest.fn(() => true);
  const router = createMemoryRouter(
    [
      {
        children: [
          {
            id: "resource",
            path: "resource",
            loader: resourceLoader,
            shouldRevalidate: resourceShouldRevalidate,
          },
          {
            children: [
              {
                element: <Child />,
                errorElement: childBoundary ? <ErrorPage /> : undefined,
                id: "child",
                loader: nextChildLoader,
                path: ":id",
              },
            ],
            element: <Layout />,
            errorElement: layoutBoundary ? <ErrorPage /> : undefined,
            id: "layout",
            loader: layoutLoader,
            path: "layout",
            shouldRevalidate: () => false,
          },
          {
            action: saveAction,
            id: "save",
            path: "save",
          },
          {
            element: <Child />,
            id: "other",
            loader: () => {
              nextChildStarted.resolve(null);
              return nextChild.promise;
            },
            path: "other/:id",
          },
          {
            action: async () => {
              backgroundStarted.resolve(null);
              await backgroundAction.promise;
              return { ok: true };
            },
            id: "mutate",
            path: "mutate",
          },
        ],
        element: <Outlet />,
        errorElement: <ErrorPage />,
        hydrateFallbackElement: <p>loading fallback</p>,
        id: "root",
        loader: ({ request }) => {
          if (new URL(request.url).pathname === "/save") {
            backgroundRootStarted.resolve(null);
            return backgroundRoot.promise;
          }
          return "root next";
        },
        path: "/",
      },
    ],
    {
      hydrationData: {
        loaderData: {
          child: "start",
          layout: "layout initial",
          root: "root initial",
        },
      },
      initialEntries: ["/layout/start"],
    },
  );
  render(<RouterProvider router={router} />);

  const startRace = async () => {
    const background = router.fetch("bg", "layout", "/mutate", {
      formData: new FormData(),
      formMethod: "post",
    });
    await backgroundStarted.promise;
    const navigation = router.navigate("/save", {
      formData: new FormData(),
      formMethod: "post",
    });
    await navigationStarted.promise;
    backgroundAction.resolve(null);
    await backgroundRootStarted.promise;
    navigationAction.resolve(null);
    await nextChildStarted.promise;
    return { background, navigation };
  };
  return {
    backgroundRoot,
    layoutLoader,
    nextChild,
    nextChildLoader,
    router,
    resourceLoader,
    resourceShouldRevalidate,
    saveAction,
    startRace,
  };
};

describe("loader data retained across background updates", () => {
  it.each(["background-first", "navigation-first"])(
    "preserves skipped layout data when %s completes",
    async (order) => {
      const t = setup();
      try {
        expect(screen.getByText("child start")).toBeInTheDocument();
        let pending!: Awaited<ReturnType<typeof t.startRace>>;
        await act(async () => {
          pending = await t.startRace();
        });
        if (order === "background-first") {
          await act(async () => {
            t.backgroundRoot.resolve("background root");
            await pending.background;
          });
          await act(async () => {
            t.nextChild.resolve("next");
            await pending.navigation;
          });
        } else {
          await act(async () => {
            t.nextChild.resolve("next");
            await pending.navigation;
          });
          await act(async () => {
            t.backgroundRoot.resolve("background root");
            await pending.background;
          });
        }
        expect(t.router.state.navigation.state).toBe("idle");
        expect(t.layoutLoader).not.toHaveBeenCalled();
        expect(screen.queryByText("loading fallback")).not.toBeInTheDocument();
        expect(screen.getByText("layout initial")).toBeInTheDocument();
        expect(screen.getByText("child next")).toBeInTheDocument();
      } finally {
        t.router.dispose();
      }
    },
  );

  it("preserves completed fetcher revalidations when retrying the navigation loaders", async () => {
    const t = setup();
    const fetcherData = getFetcherData(t.router);
    t.resourceLoader
      .mockReturnValueOnce("resource initial")
      .mockReturnValueOnce("resource refreshed");
    t.resourceShouldRevalidate.mockImplementation(
      () => t.resourceLoader.mock.calls.length < 2,
    );
    try {
      await act(async () => {
        await t.router.fetch("resource", "layout", "/resource");
      });
      let pending!: Awaited<ReturnType<typeof t.startRace>>;
      await act(async () => {
        pending = await t.startRace();
      });
      await act(async () => {
        t.backgroundRoot.reject(new Error("background root failed"));
        await pending.background;
        t.nextChild.resolve("next");
        await pending.navigation;
      });
      expect(t.resourceLoader).toHaveBeenCalledTimes(2);
      expect(fetcherData.get("resource")).toBe("resource refreshed");
      expect(t.router.state.fetchers.size).toBe(0);
      expect(screen.getByText("child next")).toBeInTheDocument();
    } finally {
      t.router.dispose();
    }
  });

  it.each(["/layout/next", "/layout/start#updated"])(
    "validates skipped data when a newer fetcher completes navigation to %s",
    async (destination) => {
      const t = setup(destination);
      const newerChild = deferred();
      t.layoutLoader.mockReturnValue("layout refreshed");
      const fetcherData = getFetcherData(t.router);
      let pending!: Awaited<ReturnType<typeof t.startRace>>;
      try {
        let newer!: ReturnType<typeof t.router.fetch>;
        await act(async () => {
          pending = await t.startRace();
          t.nextChildLoader.mockReturnValueOnce(newerChild.promise);
          newer = t.router.fetch("newer", "layout", "/mutate", {
            formData: new FormData(),
            formMethod: "post",
          });
        });
        await waitFor(() => expect(t.nextChildLoader).toHaveBeenCalledTimes(2));
        t.nextChildLoader.mockResolvedValue("replacement child");
        await act(async () => {
          t.backgroundRoot.reject(new Error("background root failed"));
          await pending.background;
          newerChild.resolve("newer child");
          await newer;
        });
        expect(t.router.state.navigation.state).toBe("idle");
        expect(t.router.state.loaderData.layout).toBeDefined();
        expect(screen.queryByText("loading fallback")).not.toBeInTheDocument();
        expect(screen.getByText("child replacement child")).toBeInTheDocument();
        expect(fetcherData.get("newer")).toEqual({ ok: true });
        expect(t.router.state.fetchers.size).toBe(0);
      } finally {
        await act(async () => {
          await t.nextChild.resolve("aborted navigation child");
          await pending.navigation;
        });
        t.router.dispose();
      }
    },
  );

  it.each([false, true])(
    "renders a failed replacement layout load (layout boundary: %s)",
    async (layoutBoundary) => {
      const t = setup("/layout/next", false, layoutBoundary);
      t.layoutLoader.mockImplementation(() => {
        throw new Error("replacement layout failed");
      });
      try {
        let pending!: Awaited<ReturnType<typeof t.startRace>>;
        await act(async () => {
          pending = await t.startRace();
        });
        await act(async () => {
          t.backgroundRoot.reject(new Error("background root failed"));
          await pending.background;
          t.nextChild.resolve("next");
          await pending.navigation;
        });
        expect(t.router.state.navigation.state).toBe("idle");
        expect(t.layoutLoader).toHaveBeenCalledTimes(1);
        expect(screen.queryByText("layout initial")).not.toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(
          "replacement layout failed",
        );
      } finally {
        t.router.dispose();
      }
    },
  );

  it("follows a redirect from the replacement layout load", async () => {
    const t = setup();
    t.layoutLoader.mockReturnValue(redirect("/other/next"));
    try {
      let pending!: Awaited<ReturnType<typeof t.startRace>>;
      await act(async () => {
        pending = await t.startRace();
      });
      await act(async () => {
        t.backgroundRoot.reject(new Error("background root failed"));
        await pending.background;
        t.nextChild.resolve("next");
        await pending.navigation;
      });
      expect(t.router.state.location.pathname).toBe("/other/next");
      expect(t.layoutLoader).toHaveBeenCalledTimes(1);
      expect(t.router.state.loaderData.layout).toBeUndefined();
      expect(screen.getByText("child next")).toBeInTheDocument();
    } finally {
      t.router.dispose();
    }
  });

  it("aborts a pending replacement load when a newer navigation starts", async () => {
    const t = setup();
    const replacement = deferred();
    let replacementSignal: AbortSignal | undefined;
    t.layoutLoader.mockImplementation(({ request }) => {
      replacementSignal = request.signal;
      return replacement.promise;
    });
    try {
      let pending!: Awaited<ReturnType<typeof t.startRace>>;
      await act(async () => {
        pending = await t.startRace();
      });
      await act(async () => {
        t.backgroundRoot.reject(new Error("background root failed"));
        await pending.background;
        t.nextChild.resolve("next");
      });
      expect(t.layoutLoader).toHaveBeenCalledTimes(1);
      expect(t.router.state.navigation.state).toBe("loading");
      await act(async () => {
        await t.router.navigate("/other/next");
        replacement.resolve("superseded layout");
        await pending.navigation;
      });
      expect(replacementSignal?.aborted).toBe(true);
      expect(t.router.state.location.pathname).toBe("/other/next");
      expect(screen.queryByText("superseded layout")).not.toBeInTheDocument();
      expect(screen.getByText("child next")).toBeInTheDocument();
    } finally {
      t.router.dispose();
    }
  });

  it.each([false, true])(
    "respects the navigation error boundary after a background error (child boundary: %s)",
    async (childBoundary) => {
      const t = setup("/layout/next", childBoundary);
      t.layoutLoader.mockReturnValue("layout refreshed");
      try {
        let pending!: Awaited<ReturnType<typeof t.startRace>>;
        await act(async () => {
          pending = await t.startRace();
        });
        await act(async () => {
          t.backgroundRoot.reject(new Error("background root failed"));
          await pending.background;
          t.nextChild.reject(new Error("destination child failed"));
          await pending.navigation;
        });
        expect(t.layoutLoader).toHaveBeenCalledTimes(childBoundary ? 1 : 0);
        expect(screen.queryByText("loading fallback")).not.toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(
          "destination child failed",
        );
      } finally {
        t.router.dispose();
      }
    },
  );

  it("loads a skipped layout if a background error removes its data before commit", async () => {
    const t = setup();
    t.layoutLoader.mockReturnValue("layout refreshed");
    const idleHoles: string[] = [];
    const unsubscribe = t.router.subscribe((state) => {
      if (
        state.navigation.state === "idle" &&
        state.location.pathname === "/layout/next" &&
        !state.errors &&
        state.loaderData.layout === undefined
      ) {
        idleHoles.push(state.location.pathname);
      }
    });
    try {
      let pending!: Awaited<ReturnType<typeof t.startRace>>;
      await act(async () => {
        pending = await t.startRace();
      });
      await act(async () => {
        t.backgroundRoot.reject(new Error("background root failed"));
        await pending.background;
      });
      await act(async () => {
        t.nextChild.resolve("next");
        await pending.navigation;
      });
      expect(idleHoles).toEqual([]);
      expect(t.layoutLoader).toHaveBeenCalledTimes(1);
      expect(t.saveAction).toHaveBeenCalledTimes(1);
      expect(screen.getByText("layout refreshed")).toBeInTheDocument();
      expect(screen.getByText("child next")).toBeInTheDocument();
    } finally {
      unsubscribe();
      t.router.dispose();
    }
  });

  it.each([false, true])(
    "renders real errors (child boundary: %s)",
    async (childBoundary) => {
      const t = setup("/layout/next", childBoundary);
      try {
        let pending!: Awaited<ReturnType<typeof t.startRace>>;
        await act(async () => {
          pending = await t.startRace();
        });
        await act(async () => {
          t.backgroundRoot.resolve("background root");
          await pending.background;
        });
        await act(async () => {
          t.nextChild.reject(new Error("expected child failure"));
          await pending.navigation;
        });
        expect(t.layoutLoader).not.toHaveBeenCalled();
        expect(screen.queryByText("loading fallback")).not.toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(
          "expected child failure",
        );
      } finally {
        t.router.dispose();
      }
    },
  );

  it("discards layout data after leaving that layout", async () => {
    const t = setup("/other/next");
    try {
      let pending!: Awaited<ReturnType<typeof t.startRace>>;
      await act(async () => {
        pending = await t.startRace();
      });
      await act(async () => {
        t.backgroundRoot.resolve("background root");
        await pending.background;
      });
      await act(async () => {
        t.nextChild.resolve("next");
        await pending.navigation;
      });
      expect(t.router.state.loaderData.layout).toBeUndefined();
      expect(screen.queryByText("layout initial")).not.toBeInTheDocument();
      expect(screen.getByText("child next")).toBeInTheDocument();
    } finally {
      t.router.dispose();
    }
  });
});
