import * as React from "react";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server.node";

import { FrameworkContext } from "../../../lib/dom/ssr/components";
import { RemixRootDefaultErrorBoundary } from "../../../lib/dom/ssr/errorBoundaries";
import { RemixRootDefaultHydrateFallback } from "../../../lib/dom/ssr/fallback";
import { mockFrameworkContext } from "../../utils/framework";

async function getHydrationWarnings(element: React.ReactElement) {
  let routeModules = {
    root: {
      default: () => null,
      Layout: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    },
  };

  let serverContext = mockFrameworkContext({
    nonce: "server-nonce",
    routeModules,
  });

  let clientContext = mockFrameworkContext({
    routeModules,
  });

  let hydrationErrors: string[] = [];
  let consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation((...args: any[]) => {
      let message = args
        .map((arg) =>
          typeof arg === "string" ? arg : arg?.message || String(arg),
        )
        .join(" ");

      if (
        /hydrat/i.test(message) ||
        /didn't match|did not match/i.test(message) ||
        /extra attributes/i.test(message) ||
        /nonce/i.test(message)
      ) {
        hydrationErrors.push(message);
      }
    });

  let container = document.createElement("div");
  document.body.appendChild(container);
  let root: ReturnType<typeof hydrateRoot> | undefined;

  try {
    let html = renderToString(
      <FrameworkContext.Provider value={serverContext}>
        {element}
      </FrameworkContext.Provider>,
    );
    container.innerHTML = html;

    await act(async () => {
      root = hydrateRoot(
        container,
        <FrameworkContext.Provider value={clientContext}>
          {element}
        </FrameworkContext.Provider>,
      );
    });

    return hydrationErrors;
  } finally {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    container.remove();
    consoleErrorSpy.mockRestore();
  }
}

describe("default error boundary and hydrate fallback hydration", () => {
  it("RemixRootDefaultErrorBoundary does not warn about a nonce mismatch when hydrating without a nonce", async () => {
    expect(
      await getHydrationWarnings(
        <RemixRootDefaultErrorBoundary error={new Error("boom")} />,
      ),
    ).toEqual([]);
  });

  it("RemixRootDefaultHydrateFallback does not warn about a nonce mismatch when hydrating without a nonce", async () => {
    expect(
      await getHydrationWarnings(<RemixRootDefaultHydrateFallback />),
    ).toEqual([]);
  });
});
