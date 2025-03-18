import { expect } from "@playwright/test";
import type { Files } from "./helpers/vite.js";
import { test, viteConfig, build, createProject } from "./helpers/vite.js";

const js = String.raw;

const simpleFiles: Files = async ({ port }) => ({
  "vite.config.ts": await viteConfig.basic({ port }),
  "react-router.config.ts": js`
    export default {
      rootRouteFile: "custom/root.tsx",
      routesFile: "custom/app-routes.ts",
      clientEntryFile: "custom/entry.client.tsx",
      serverEntryFile: "custom/entry.server.tsx",
    };
  `,
  "app/custom/root.tsx": js`
    import { Links, Meta, Outlet, Scripts } from "react-router";

    export default function Root() {
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <div id="content">
              <h1>Custom Root</h1>
              <Outlet />
            </div>
            <Scripts />
          </body>
        </html>
      );
    }
  `,
  "app/custom/app-routes.ts": js`
    import { type RouteConfig, index } from "@react-router/dev/routes";

    export default [
      index("index.tsx"),
    ] satisfies RouteConfig;
  `,
  "app/index.tsx": js`
    export default function IndexRoute() {
      return <div id="hydrated" onClick={() => {}}>Custom IndexRoute</div>
    }
  `,
  "app/custom/entry.client.tsx": js`
    import { HydratedRouter } from "react-router/dom";
    import { startTransition, StrictMode } from "react";
    import { hydrateRoot } from "react-dom/client";

    window.__customClientEntryExecuted = true;

    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <HydratedRouter discover={"none"} />
        </StrictMode>
      );
    });
  `,
  "app/custom/entry.server.tsx": js`
    import * as React from "react";
    import { ServerRouter } from "react-router";
    import { renderToString } from "react-dom/server";

    export default function handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      remixContext
    ) {
      let markup = renderToString(
        <ServerRouter context={remixContext} url={request.url} />
      );
      responseHeaders.set("Content-Type", "text/html");
      responseHeaders.set("X-Custom-Server-Entry", "true");
      return new Response('<!DOCTYPE html>' + markup, {
        headers: responseHeaders,
        status: responseStatusCode,
      });
    }
  `,
});

test.describe("File path configuration", () => {
  test("uses custom file paths", async ({ page, dev, request }) => {
    let { port } = await dev(simpleFiles);
    const response = await page.goto(`http://localhost:${port}/`);

    // Verify custom root.tsx and app-routes.ts is being used.
    await expect(page.locator("h1")).toHaveText("Custom Root");
    await expect(page.locator("#content div")).toHaveText("Custom IndexRoute");

    // Verify client entry is being used.
    expect(
      await page.evaluate(() => (window as any).__customClientEntryExecuted)
    ).toBe(true);

    // Verify server entry is used by checking for the custom header.
    expect(response?.headers()["x-custom-server-entry"]).toBe("true");
  });

  test("fails build when custom rootRouteFile doesn't exist", async () => {
    let cwd = await createProject({
      "react-router.config.ts": js`
        export default {
          rootRouteFile: "custom/nonexistent-root.tsx"
        };
      `,
    });
    let buildResult = build({ cwd });
    expect(buildResult.status).toBe(1);
    expect(buildResult.stderr.toString()).toContain(
      'Could not find "root" entry file at'
    );
    expect(buildResult.stderr.toString()).toContain("nonexistent-root.tsx");
  });

  test("fails build when custom routesFile doesn't exist", async () => {
    let cwd = await createProject({
      "app/root.tsx": js`
        export default function Root() {
          return <div>Root</div>;
        }
      `,
      "react-router.config.ts": js`
        export default {
          routesFile: "custom/nonexistent-routes.ts"
        };
      `,
    });
    let buildResult = build({ cwd });
    expect(buildResult.status).toBe(1);
    expect(buildResult.stderr.toString()).toContain(
      'Could not find "routes" entry file at'
    );
    expect(buildResult.stderr.toString()).toContain("nonexistent-routes.ts");
  });

  test("fails build when custom clientEntryFile doesn't exist", async () => {
    let cwd = await createProject({
      "app/root.tsx": js`
        export default function Root() {
          return <div>Root</div>;
        }
      `,
      "app/routes.ts": js`
        export default [];
      `,
      "react-router.config.ts": js`
        export default {
          clientEntryFile: "custom/nonexistent-entry.client.tsx"
        };
      `,
    });
    let buildResult = build({ cwd });
    expect(buildResult.status).toBe(1);
    expect(buildResult.stderr.toString()).toContain(
      'Could not find "entry.client" entry file at'
    );
    expect(buildResult.stderr.toString()).toContain("nonexistent-entry.client.tsx");
  });

  test("fails build when custom serverEntryFile doesn't exist", async () => {
    let cwd = await createProject({
      "app/root.tsx": js`
        export default function Root() {
          return <div>Root</div>;
        }
      `,
      "app/routes.ts": js`
        export default [];
      `,
      "react-router.config.ts": js`
        export default {
          serverEntryFile: "custom/nonexistent-entry.server.tsx"
        };
      `,
    });
    let buildResult = build({ cwd });
    expect(buildResult.status).toBe(1);
    expect(buildResult.stderr.toString()).toContain(
      'Could not find "entry.server" entry file at'
    );
    expect(buildResult.stderr.toString()).toContain("nonexistent-entry.server.tsx");
  });
});
