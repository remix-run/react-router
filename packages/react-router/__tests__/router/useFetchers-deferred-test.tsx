/**
 * Integration test for the useFetchers fix with deferred routes
 * This test verifies that multiple concurrent fetchers work correctly on deferred routes
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useFetcher,
  useFetchers,
  useLoaderData,
} from "../../index";
import { createDeferred, tick } from "./utils/utils";

describe("useFetchers with deferred routes", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should preserve concurrent fetcher behavior on deferred routes", async () => {
    const pageDeferred = createDeferred();
    const fetcherDeferreds = [createDeferred(), createDeferred(), createDeferred()];

    function ParentLayout() {
      return (
        <div>
          <Outlet />
        </div>
      );
    }

    function DeferredRoute() {
      const fetcher1 = useFetcher({ key: "fetcher-1" });
      const fetcher2 = useFetcher({ key: "fetcher-2" });
      const fetcher3 = useFetcher({ key: "fetcher-3" });
      const fetchers = useFetchers();
      const loaderData = useLoaderData() as { pageData: any };

      return (
        <div>
          <div>Page data: {loaderData?.pageData?.message || "loading"}</div>
          <button
            onClick={() => fetcher1.load("/api/data1")}
            id="fetcher-btn-1"
          >
            Fetch 1
          </button>
          <button
            onClick={() => fetcher2.load("/api/data2")}
            id="fetcher-btn-2"
          >
            Fetch 2
          </button>
          <button
            onClick={() => fetcher3.load("/api/data3")}
            id="fetcher-btn-3"
          >
            Fetch 3
          </button>

          <div id="fetcher-state-count">{fetchers.length}</div>
          <div id="fetcher-states">
            {fetchers.map((f, i) => (
              <span key={i} id={`fetcher-${i}-state`}>
                {f.state},
              </span>
            ))}
          </div>
        </div>
      );
    }

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <ParentLayout />,
          hydrateFallbackElement: <div>Loading...</div>,
          children: [
            {
              index: true,
              loader: async () => {
                // Simulate deferred data using a promise
                return {
                  pageData: await pageDeferred.promise,
                };
              },
              Component: DeferredRoute,
            },
          ],
        },
        {
          path: "/api/data1",
          loader: async () => {
            await fetcherDeferreds[0].promise;
            return { data: "data1" };
          },
        },
        {
          path: "/api/data2",
          loader: async () => {
            await fetcherDeferreds[1].promise;
            return { data: "data2" };
          },
        },
        {
          path: "/api/data3",
          loader: async () => {
            await fetcherDeferreds[2].promise;
            return { data: "data3" };
          },
        },
      ],
      {
        initialEntries: ["/"],
      }
    );

    render(<RouterProvider router={router} />);

    // Initially should show loading fallback
    await waitFor(() => screen.getByText("Loading..."));

    // Resolve the page deferred promise to show the actual content
    await act(async () => {
      pageDeferred.resolve({ message: "resolved" });
      await tick();
    });

    // Wait for content to render
    await waitFor(() => screen.getByText("Fetch 1"));
    
    // Initially all should be idle (no active fetchers)
    expect(screen.getByText("0")).toBeInTheDocument();

    // Submit multiple fetchers concurrently
    await act(async () => {
      fireEvent.click(screen.getByText("Fetch 1"));
      fireEvent.click(screen.getByText("Fetch 2"));
      fireEvent.click(screen.getByText("Fetch 3"));
      await tick();
    });

    // Now we should have 3 fetchers in loading state
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    // Verify all are in loading state (use querySelector since there are multiple)
    const loadingSpans = document.querySelectorAll("[id^='fetcher-'][id$='-state']");
    expect(loadingSpans.length).toBe(3);
    loadingSpans.forEach((span) => {
      expect(span.textContent).toContain("loading");
    });

    // Resolve all fetcher deferreds one by one
    await act(async () => {
      fetcherDeferreds[0].resolve({ data: "data1" });
      await tick();
    });

    // Should still have 2 active fetchers
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    await act(async () => {
      fetcherDeferreds[1].resolve({ data: "data2" });
      await tick();
    });

    // Should still have 1 active fetcher
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    await act(async () => {
      fetcherDeferreds[2].resolve({ data: "data3" });
      await tick();
    });

    // All fetchers completed - should be 0 active fetchers
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("should maintain independent fetcher states during deferred revalidation", async () => {
    const pageDeferred = createDeferred();
    const fetcherDeferreds = Array.from({ length: 5 }, () => createDeferred());

    function ParentLayout() {
      return (
        <div>
          <Outlet />
        </div>
      );
    }

    function DeferredRoute() {
      const fetchers = useFetchers();
      const loaderData = useLoaderData() as { slowData: any };

      // Create 5 independent fetchers with unique keys
      const fetcher0 = useFetcher({ key: "fetcher-0" });
      const fetcher1 = useFetcher({ key: "fetcher-1" });
      const fetcher2 = useFetcher({ key: "fetcher-2" });
      const fetcher3 = useFetcher({ key: "fetcher-3" });
      const fetcher4 = useFetcher({ key: "fetcher-4" });

      return (
        <div>
          <div>Slow data: {loaderData?.slowData?.message || "loading"}</div>
          {/* Multiple fetcher buttons to test concurrency */}
          <button
            onClick={() => fetcher0.load(`/api/data0`)}
            id="fetcher-btn-0"
          >
            Fetch 1
          </button>
          <button
            onClick={() => fetcher1.load(`/api/data1`)}
            id="fetcher-btn-1"
          >
            Fetch 2
          </button>
          <button
            onClick={() => fetcher2.load(`/api/data2`)}
            id="fetcher-btn-2"
          >
            Fetch 3
          </button>
          <button
            onClick={() => fetcher3.load(`/api/data3`)}
            id="fetcher-btn-3"
          >
            Fetch 4
          </button>
          <button
            onClick={() => fetcher4.load(`/api/data4`)}
            id="fetcher-btn-4"
          >
            Fetch 5
          </button>

          <div id="fetcher-state-count">{fetchers.length}</div>
          <div id="fetcher-states-display">
            {fetchers.map((f, idx) => (
              <span key={idx} id={`fetcher-${idx}-state-display`}>
                {f.state}-
              </span>
            ))}
          </div>
        </div>
      );
    }

    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <ParentLayout />,
          hydrateFallbackElement: <div>Loading...</div>,
          children: [
            {
              index: true,
              loader: async () => {
                // Deferred loader that takes some time
                return {
                  slowData: await pageDeferred.promise,
                };
              },
              Component: DeferredRoute,
            },
          ],
        },
        {
          path: "/api/data0",
          loader: async () => {
            await fetcherDeferreds[0].promise;
            return { data: "data0" };
          },
        },
        {
          path: "/api/data1",
          loader: async () => {
            await fetcherDeferreds[1].promise;
            return { data: "data1" };
          },
        },
        {
          path: "/api/data2",
          loader: async () => {
            await fetcherDeferreds[2].promise;
            return { data: "data2" };
          },
        },
        {
          path: "/api/data3",
          loader: async () => {
            await fetcherDeferreds[3].promise;
            return { data: "data3" };
          },
        },
        {
          path: "/api/data4",
          loader: async () => {
            await fetcherDeferreds[4].promise;
            return { data: "data4" };
          },
        },
      ],
      {
        initialEntries: ["/"],
      }
    );

    render(<RouterProvider router={router} />);

    // Initially should show loading fallback
    await waitFor(() => screen.getByText("Loading..."));

    // Resolve the page deferred loader
    await act(async () => {
      pageDeferred.resolve({ message: "deferred resolved" });
      await tick();
    });

    // Wait for content to render
    await waitFor(() => screen.getByText("Fetch 1"));

    // Submit multiple fetchers rapidly to test concurrency
    await act(async () => {
      fireEvent.click(screen.getByText("Fetch 1"));
      fireEvent.click(screen.getByText("Fetch 2"));
      fireEvent.click(screen.getByText("Fetch 3"));
      fireEvent.click(screen.getByText("Fetch 4"));
      fireEvent.click(screen.getByText("Fetch 5"));
      await tick();
    });

    // All 5 fetchers should be present and in loading state
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    // Verify loading states
    const loadingSpans = document.querySelectorAll("[id^='fetcher-'][id$='-state-display']");
    expect(loadingSpans.length).toBe(5);
    loadingSpans.forEach((span) => {
      expect(span.textContent).toContain("loading");
    });

    // Resolve all fetcher deferreds
    await act(async () => {
      fetcherDeferreds.forEach((dfd) => dfd.resolve({ data: "done" }));
      await tick();
    });

    // All fetchers completed - should be 0 active fetchers
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});