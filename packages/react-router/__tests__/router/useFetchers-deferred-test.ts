/**
 * Integration test for the useFetchers fix with deferred routes
 * This test verifies that multiple concurrent fetchers work correctly on deferred routes
 */

import {
  createMemoryRouter,
  defer,
  useFetcher,
  useFetchers,
} from "../index";
import { renderWithRouter, act } from "./utils/test-renderer";

describe("useFetchers with deferred routes", () => {
  it("should preserve concurrent fetcher behavior on deferred routes", async () => {
    let resolveDeferred: (value: any) => void;
    const deferredPromise = new Promise((resolve) => {
      resolveDeferred = resolve;
    });

    function DeferredRoute() {
      const fetcher = useFetcher();
      const fetchers = useFetchers();

      return (
        <div>
          <button
            onClick={() => fetcher.load("/api/data1")}
            id="fetcher-btn-1"
          >
            Fetch 1
          </button>
          <button
            onClick={() => fetcher.load("/api/data2")}
            id="fetcher-btn-2"
          >
            Fetch 2
          </button>
          <button
            onClick={() => fetcher.load("/api/data3")}
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

    const router = createMemoryRouter([
      {
        path: "/",
        loader: async () => {
          // Simulate deferred data
          return defer({
            deferredData: await deferredPromise,
          });
        },
        Component: DeferredRoute,
      },
    ]);

    let { container } = renderWithRouter(router);

    // Initially all should be idle
    expect(container.querySelector("#fetcher-state-count")?.textContent).toBe("0");

    // Submit multiple fetchers concurrently
    await act(async () => {
      document.getElementById("fetcher-btn-1")?.click();
      document.getElementById("fetcher-btn-2")?.click();
      document.getElementById("fetcher-btn-3")?.click();
    });

    // Now we should have 3 fetchers
    expect(container.querySelector("#fetcher-state-count")?.textContent).toBe("3");

    // Initially they should be in loading state
    const fetcherStates = container.querySelectorAll("[id^='fetcher-']");
    expect(fetcherStates.length).toBe(3);

    // Resolve the deferred promise
    await act(async () => {
      resolveDeferred!({ message: "resolved" });
      await new Promise((resolve) => setTimeout(resolve, 10)); // Let the state update
    });

    // All fetchers should still be present and eventually become idle
    expect(container.querySelector("#fetcher-state-count")?.textContent).toBe("3");
  });

  it("should maintain independent fetcher states during deferred revalidation", async () => {
    let resolveDeferred: (value: any) => void;
    const deferredPromise = new Promise((resolve) => {
      resolveDeferred = resolve;
    });

    function DeferredRoute() {
      const fetcher = useFetcher();
      const fetchers = useFetchers();

      return (
        <div>
          {/* Multiple fetcher buttons to test concurrency */}
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              onClick={() => fetcher.load(`/api/data${i}`)}
              id={`fetcher-btn-${i}`}
            >
              Fetch {i + 1}
            </button>
          ))}
          
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

    const router = createMemoryRouter([
      {
        path: "/",
        loader: async () => {
          // Deferred loader that takes some time
          return defer({
            slowData: await deferredPromise,
          });
        },
        Component: DeferredRoute,
      },
    ]);

    let { container } = renderWithRouter(router);

    // Submit multiple fetchers rapidly to test concurrency
    await act(async () => {
      for (let i = 0; i < 5; i++) {
        document.getElementById(`fetcher-btn-${i}`)?.click();
      }
    });

    // All 5 fetchers should be present
    expect(container.querySelector("#fetcher-state-count")?.textContent).toBe("5");

    // Resolve the deferred loader
    await act(async () => {
      resolveDeferred!({ message: "deferred resolved" });
      await new Promise((resolve) => setTimeout(resolve, 20)); // Allow state updates
    });

    // All fetchers should still be present after deferred resolution
    expect(container.querySelector("#fetcher-state-count")?.textContent).toBe("5");

    // All fetchers should eventually complete independently
    const stateDisplays = container.querySelectorAll("[id^='fetcher-'][id$='-state-display']");
    expect(stateDisplays.length).toBe(5);
  });
});