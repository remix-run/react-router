import type { Router } from "../../lib/router/router";
import { createRouter } from "../../lib/router/router";
import { createMemoryHistory } from "../../lib/router/history";
import { sleep } from "./utils/utils";

describe("Issue #14506: Fetcher race condition with optimistic UI", () => {
  let router: Router;

  afterEach(() => {
    router?.dispose();
  });

  it("should keep formData available until loaderData updates (no flicker)", async () => {
    let itemStatus = false;

    router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/"] }),
      routes: [
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "item",
              path: "item",
              loader: async () => {
                await sleep(5);
                return { status: itemStatus };
              },
              action: async ({ request }) => {
                let formData = await request.formData();
                itemStatus = formData.get("status") === "true";
                await sleep(5);
                return { success: true };
              },
            },
          ],
        },
      ],
    });

    router.initialize();
    await router.navigate("/item");

    // Track what UI sees using the pattern from the issue
    let transitions: Array<{
      fetcherState: string;
      hasFormData: boolean;
      loaderDataStatus: boolean;
      uiDisplays: boolean;
    }> = [];

    router.subscribe((state) => {
      let fetcher = state.fetchers.get("toggle");
      let loaderData = state.loaderData["item"];

      if (fetcher) {
        // Exact pattern from issue: const status = (fetcher.formData?.get('status') === 'true') ?? item.status
        let displayedStatus =
          (fetcher.formData && fetcher.formData.get("status") === "true") ??
          loaderData?.status ??
          false;

        transitions.push({
          fetcherState: fetcher.state,
          hasFormData: fetcher.formData !== undefined,
          loaderDataStatus: loaderData?.status ?? false,
          uiDisplays: displayedStatus,
        });
      }
    });

    let formData = new FormData();
    formData.append("status", "true");

    await router.fetch("toggle", "item", "/item", {
      formMethod: "POST",
      formData,
    });

    await sleep(50);

    // Check for flicker: true -> false -> true
    let uiValues = transitions.map(t => t.uiDisplays);
    let hasFlicker = false;
    for (let i = 0; i < uiValues.length - 2; i++) {
      if (uiValues[i] === true && uiValues[i + 1] === false && uiValues[i + 2] === true) {
        hasFlicker = true;
        break;
      }
    }

    expect(hasFlicker).toBe(false);
    expect(uiValues[uiValues.length - 1]).toBe(true);
  });
});