import { build, preview } from "vite";
import { test, expect } from "@playwright/test";

import { createProject } from "./helpers/vite.js";

for (let enabled of [false, true]) {
  test(`Data Mode route-pattern preloading (flag: ${enabled})`, async ({
    page,
  }) => {
    let cwd = await createProject({
      "index.html": String.raw`
        <html><body>
          <button id="start">Start router</button>
          <div id="app"></div>
          <script type="module" src="/main.tsx"></script>
        </body></html>
      `,
      "main.tsx": String.raw`
        import * as React from "react";
        import { createRoot } from "react-dom/client";
        import { createBrowserRouter, RouterProvider, Link, Outlet, useLoaderData } from "react-router";
        ${enabled ? 'import { unstable_preloadRoutePattern } from "react-router/route-pattern";' : ""}

        let root = createRoot(document.getElementById("app"));
        let initialData = new Promise(resolve => {
          window.resolveInitialLoader = () => resolve("Ready");
        });
        document.getElementById("start").onclick = () => {
          ${enabled ? "unstable_preloadRoutePattern();" : ""}
          let router = createBrowserRouter([{
            path: "/",
            loader: () => initialData,
            HydrateFallback: () => <p>Loading route data</p>,
            Component() {
              return <>
                <h1>{useLoaderData()}</h1>
                <Link to="/other">Other</Link>
                <Outlet />
              </>;
            },
            children: [{ path: "other", Component: () => <h2>Other route</h2> }],
          }], { future: { unstable_routePatternMatching: ${enabled} } });
          root.render(<RouterProvider router={router} />);
        };
        document.body.dataset.ready = "true";
      `,
    });
    let chunks: {
      fileName: string;
      isEntry: boolean;
      imports: string[];
      modules: string[];
    }[] = [];
    await build({
      root: cwd,
      configFile: false,
      logLevel: "silent",
      build: { target: "esnext" },
      plugins: [
        {
          name: "inspect-matcher-chunks",
          generateBundle(_, bundle) {
            chunks = Object.values(bundle).flatMap((chunk) =>
              chunk.type === "chunk"
                ? [
                    {
                      fileName: chunk.fileName,
                      isEntry: chunk.isEntry,
                      imports: chunk.imports,
                      modules: Object.keys(chunk.modules),
                    },
                  ]
                : [],
            );
          },
        },
      ],
    });

    let matcherChunks = chunks.filter((chunk) =>
      chunk.modules.some(
        (id) =>
          id.includes("/@remix-run/route-pattern/") ||
          id.endsWith("/matcher-route-pattern.js"),
      ),
    );
    if (enabled) {
      expect(matcherChunks.length).toBeGreaterThan(0);
      let initialChunks = new Set<string>();
      function addInitialChunk(fileName: string) {
        if (initialChunks.has(fileName)) return;
        initialChunks.add(fileName);
        chunks
          .find((chunk) => chunk.fileName === fileName)
          ?.imports.forEach(addInitialChunk);
      }
      chunks
        .filter((chunk) => chunk.isEntry)
        .forEach((chunk) => addInitialChunk(chunk.fileName));
      for (let chunk of matcherChunks) {
        expect(initialChunks.has(chunk.fileName)).toBe(true);
      }
    } else {
      expect(matcherChunks).toEqual([]);
    }

    let requests: string[] = [];
    let errors: Error[] = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("pageerror", (error) => errors.push(error));
    let server = await preview({
      root: cwd,
      configFile: false,
      logLevel: "silent",
      preview: { port: 0 },
    });
    try {
      await page.goto(server.resolvedUrls!.local[0]);
      await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
      for (let chunk of matcherChunks) {
        expect(requests.some((url) => url.endsWith(chunk.fileName))).toBe(true);
      }
      await page.getByRole("button", { name: "Start router" }).click();
      await expect(page.getByText("Loading route data")).toBeVisible();
      await page.evaluate("window.resolveInitialLoader()");
      await expect(page.getByRole("heading", { name: "Ready" })).toBeVisible();
      await page.getByRole("link", { name: "Other", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Other route" }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await new Promise<void>((resolve) =>
        server.httpServer.close(() => resolve()),
      );
    }
  });
}
