import * as React from "react";
import { act, render, screen } from "@testing-library/react";
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

const setup = (destination = "/layout/next", childBoundary = false) => {
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
  const router = createMemoryRouter(
    [
      {
        children: [
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
    router,
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
