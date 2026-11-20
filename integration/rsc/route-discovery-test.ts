import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { implementations, js, setupRscTest } from "./utils";

for (let implementation of implementations) {
  test(`RSC (${implementation.name}) bounds route discovery for documents and data`, async ({
    page,
  }) => {
    let pathname = `/${Array.from({ length: 70 }, (_, i) => i % 10).join("/")}`;
    let port = await getPort();
    let stop = await setupRscTest({
      implementation,
      port,
      files: {
        "src/routes.ts": js`
          export const routes = [{
            id: "root",
            path: "",
            lazy: () => import("./routes/root"),
            children: [
              { id: "other", path: "other", lazy: () => import("./routes/other") },
              { id: "splat", path: "*", lazy: () => import("./routes/sample") },
            ],
          }];
        `,
        "src/routes/sample.tsx": js`
          import { Link } from "react-router";
          export default function Sample() {
            return <>
              <h1>Sample</h1>
              <Link to=${JSON.stringify(pathname)} discover="none">Sample</Link>
              <Link to="/other" discover="none">Other</Link>
            </>;
          }
        `,
        "src/routes/other.tsx": js`
          export default function Other() {
            return <h1>Other</h1>;
          }
        `,
      },
    });

    try {
      let manifestRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).pathname.endsWith(".manifest")) {
          manifestRequests.push(request.url());
        }
      });

      let response = await page.goto(`http://localhost:${port}${pathname}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Sample" })).toBeVisible();
      await page.waitForFunction(() => (window as any).__routerInitialized);
      let otherResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === "/other.rsc",
      );
      await page.getByRole("link", { name: "Other" }).click();
      expect((await otherResponse).status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Other" })).toBeVisible();
      expect(manifestRequests).toEqual([]);

      // Start with the splat already discovered so navigation can request data.
      await page.goto(`http://localhost:${port}/sample`);
      await page.waitForFunction(() => (window as any).__routerInitialized);
      let dataResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === `${pathname}.rsc`,
      );
      await page.getByRole("link", { name: "Sample" }).click();
      let data = await dataResponse;
      expect(data.status()).toBe(200);
      let payload = await data.text();
      expect(payload).toContain('"routeDiscovery":{"mode":"initial"}');
      expect(payload).toContain('"id":"other"');
      await expect(page.getByRole("heading", { name: "Sample" })).toBeVisible();
      await page.getByRole("link", { name: "Other" }).click();
      await expect(page.getByRole("heading", { name: "Other" })).toBeVisible();
    } finally {
      stop();
    }
  });

  test(`RSC (${implementation.name}) navigates while eager manifest patches are pending`, async ({
    page,
    request,
  }) => {
    let entryBrowser = await readFile(
      new URL("../helpers/rsc-vite/src/entry.browser.tsx", import.meta.url),
      "utf8",
    );
    let port = await getPort();
    let origin = `http://localhost:${port}`;
    let stop = await setupRscTest({
      implementation,
      port,
      files: {
        "src/entry.browser.tsx":
          entryBrowser.replace(
            "  createFromReadableStream,",
            "  createFromReadableStream as decodeStream,",
          ) +
          js`
          async function createFromReadableStream(...args) {
            let payload = await decodeStream(...args);
            if (payload.type === "manifest") {
              let patches = payload.patches;
              Object.defineProperty(payload, "patches", {
                get() {
                  // Signal that discovery has decoded the manifest envelope,
                  // while its route definitions are still blocked on the server.
                  window.__manifestPatchesPending = true;
                  return patches;
                },
              });
            }
            return payload;
          }
        `,
        "src/routes.ts": js`
          let release;
          let pending = new Promise(resolve => { release = resolve; });
          let calls = 0;
          export const routes = [{
            id: "root", path: "", lazy: () => import("./routes/root"),
            children: [
              { id: "home", index: true, lazy: () => import("./routes/home") },
              { id: "other", path: "other", lazy: async () => {
                if (++calls === 1) await pending;
                return import("./routes/other");
              } },
              { id: "release", path: "release", loader() {
                release();
                return new Response("released");
              } },
            ],
          }];
        `,
        "src/routes/home.tsx": js`
          import { Link } from "react-router";
          export default function Home() { return <Link to="/other">Other</Link>; }
        `,
        "src/routes/other.tsx": js`
          export default function Other() { return <h1>Other</h1>; }
        `,
      },
    });

    try {
      await page.goto(origin);
      await page.waitForFunction(
        () => (window as any).__manifestPatchesPending,
      );
      await page.getByRole("link", { name: "Other" }).click();
      await request.get(`${origin}/release`);
      await expect(page.getByRole("heading", { name: "Other" })).toBeVisible();
    } finally {
      await request.get(`${origin}/release`);
      stop();
    }
  });
}
