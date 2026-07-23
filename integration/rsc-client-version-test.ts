import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, type Page } from "@playwright/test";

import {
  reactRouterConfig,
  test,
  type Files,
  type TemplateName,
} from "./helpers/vite.js";

const js = String.raw;
const templateName = "rsc-vite-framework" as const satisfies TemplateName;

function getFiles() {
  return {
    "app/root.tsx": js`
      import { Link, Outlet } from "react-router";

      export default function Root() {
        return (
          <html lang="en">
            <body>
              <Link to="/other?token=abc123&ref=campaign#section1">
                Go to Other
              </Link>
              <Outlet />
            </body>
          </html>
        );
      }
    `,
    "app/routes/_index.tsx": js`
      export default function Index() {
        return <h1>Home</h1>;
      }
    `,
    "app/routes/other.tsx": js`
      import { useLocation } from "react-router";

      export default function Other() {
        let location = useLocation();
        return (
          <h1 data-location>
            {location.pathname + location.search + location.hash}
          </h1>
        );
      }
    `,
  };
}

function trackDocumentRequests(page: Page) {
  let requests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      requests.push(request.url());
    }
  });
  return requests;
}

async function interceptWithStaleClientVersion(page: Page) {
  let manifestRequests: string[] = [];
  await page.route(/\.manifest(?:\?|$)/, async (route) => {
    let url = new URL(route.request().url());
    manifestRequests.push(url.href);
    url.searchParams.set("version", "stale");
    await route.continue({ url: url.href });
  });
  return manifestRequests;
}

test.describe("RSC client versions", () => {
  test("derives the client version from the Vite RSC assets manifest", async ({
    page,
    request,
    vitePreview,
  }) => {
    let files: Files = async () => getFiles();
    let { cwd, port } = await vitePreview(files, templateName);
    let baseUrl = `http://localhost:${port}`;
    let documentRequests = trackDocumentRequests(page);
    let manifestRequests: string[] = [];
    page.on("request", (request) => {
      if (/\.manifest(?:\?|$)/.test(request.url())) {
        manifestRequests.push(request.url());
      }
    });

    await page.goto(`${baseUrl}/`);
    await expect.poll(() => manifestRequests.length).toBeGreaterThan(0);
    expect(manifestRequests[0]).toMatch(
      /\/other\.manifest\?version=[a-f0-9]{8}$/,
    );

    let clientVersion = new URL(manifestRequests[0]).searchParams.get(
      "version",
    );
    let { default: assetsManifest } = await import(
      pathToFileURL(
        path.join(cwd, "build/server/__vite_rsc_assets_manifest.js"),
      ).href
    );
    let { clientVersion: manifestClientVersion, ...versionedManifestValues } =
      assetsManifest;
    expect(manifestClientVersion).toBe(clientVersion);
    expect(clientVersion).toBe(
      await getClientVersion(JSON.stringify(versionedManifestValues)),
    );

    let currentResponse = await request.get(
      `${baseUrl}/other.manifest?version=${clientVersion}`,
    );
    expect(currentResponse.status()).toBe(200);

    await page.getByRole("link", { name: "Go to Other" }).click();
    await expect(page.locator("[data-location]")).toHaveText(
      "/other?token=abc123&ref=campaign#section1",
    );
    expect(documentRequests).toHaveLength(1);
  });

  test("defers an eager discovery mismatch until navigation, then reloads the destination", async ({
    page,
    vitePreview,
  }) => {
    let files: Files = async () => getFiles();
    let { port } = await vitePreview(files, templateName);
    let baseUrl = `http://localhost:${port}`;
    let documentRequests = trackDocumentRequests(page);
    let manifestRequests = await interceptWithStaleClientVersion(page);
    let eagerMismatch = page.waitForResponse(
      (response) =>
        response.url().includes(".manifest") && response.status() === 204,
    );

    await page.goto(`${baseUrl}/`);
    await eagerMismatch;
    await expect.poll(() => manifestRequests.length).toBeGreaterThan(0);

    // An eager discovery mismatch should not disrupt the current document.
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
    expect(documentRequests).toHaveLength(1);

    await page.getByRole("link", { name: "Go to Other" }).click();

    await expect(page.locator("[data-location]")).toHaveText(
      "/other?token=abc123&ref=campaign#section1",
    );
    expect(page.url()).toBe(
      `${baseUrl}/other?token=abc123&ref=campaign#section1`,
    );
    expect(documentRequests).toHaveLength(2);
    expect(documentRequests[1]).toBe(
      `${baseUrl}/other?token=abc123&ref=campaign`,
    );
  });

  test("reloads when a prerendered RSC payload has a new client version", async ({
    page,
    vitePreview,
  }) => {
    let files: Files = async () => ({
      ...getFiles(),
      "react-router.config.ts": reactRouterConfig({
        ssr: false,
        prerender: ["/", "/other"],
      }),
      "app/root.tsx": js`
        import { Link, Outlet } from "react-router";

        export default function Root() {
          return (
            <html lang="en">
              <body>
                <Link to="/other">Go to Other</Link>
                <Outlet />
              </body>
            </html>
          );
        }
      `,
    });
    let { cwd, port } = await vitePreview(files, templateName);
    let baseUrl = `http://localhost:${port}`;
    let documentRequests = trackDocumentRequests(page);

    let { default: assetsManifest } = await import(
      pathToFileURL(
        path.join(cwd, "build/server/__vite_rsc_assets_manifest.js"),
      ).href
    );
    let clientVersion = assetsManifest.clientVersion as string;
    let newVersion = clientVersion === "deadbeef" ? "feedface" : "deadbeef";

    let replacedVersion = false;
    await page.route(/\/other\.rsc(?:\?|$)/, async (route) => {
      if (replacedVersion) {
        await route.continue();
        return;
      }

      replacedVersion = true;
      let response = await route.fetch();
      let source = await response.text();
      expect(source).toContain(clientVersion);
      await route.fulfill({
        response,
        body: source.replaceAll(clientVersion, newVersion),
      });
    });

    await page.goto(`${baseUrl}/`);
    let rscResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/other.rsc") && response.status() === 200,
    );

    await page.getByRole("link", { name: "Go to Other" }).click();
    await rscResponse;

    await expect(page.locator("[data-location]")).toHaveText("/other");
    expect(documentRequests).toHaveLength(2);
    expect(documentRequests[1]).toBe(`${baseUrl}/other`);
  });

  test("reloads when a server function rerender has a new client version", async ({
    page,
    vitePreview,
  }) => {
    let files: Files = async () => ({
      ...getFiles(),
      "app/actions.ts": js`
        "use server";

        export async function incrementCounter(count: number) {
          return count + 1;
        }
      `,
      "app/counter.client.tsx": js`
        "use client";

        import { useActionState } from "react";

        import { incrementCounter } from "./actions";

        export function Counter() {
          const [count, increment] = useActionState(incrementCounter, 0);
          return (
            <form action={increment}>
              <output data-count>{count}</output>
              <button type="submit" data-submit>Increment</button>
            </form>
          );
        }
      `,
      "app/routes/_index.tsx": js`
        import { Counter } from "../counter.client";

        export default function Index() {
          return (
            <div>
              <h1>Home</h1>
              <Counter />
            </div>
          );
        }
      `,
    });
    let { cwd, port } = await vitePreview(files, templateName);
    let baseUrl = `http://localhost:${port}`;
    let documentRequests = trackDocumentRequests(page);

    let { default: assetsManifest } = await import(
      pathToFileURL(
        path.join(cwd, "build/server/__vite_rsc_assets_manifest.js"),
      ).href
    );
    let clientVersion = assetsManifest.clientVersion as string;
    let newVersion = clientVersion === "deadbeef" ? "feedface" : "deadbeef";

    // Swap the client version inside the server function's rerender payload,
    // simulating an action response from a newer deployment.
    let replacedVersion = false;
    await page.route(`${baseUrl}/`, async (route) => {
      if (route.request().method() !== "POST" || replacedVersion) {
        await route.continue();
        return;
      }

      replacedVersion = true;
      let response = await route.fetch();
      let source = await response.text();
      expect(source).toContain(clientVersion);
      await route.fulfill({
        response,
        body: source.replaceAll(clientVersion, newVersion),
      });
    });

    await page.goto(`${baseUrl}/`);
    await expect(page.locator("[data-count]")).toHaveText("0");

    await page.getByRole("button", { name: "Increment" }).click();

    // The stale client must reload the document instead of applying the
    // mismatched rerender.
    await expect.poll(() => documentRequests.length).toBe(2);
    expect(documentRequests[1]).toBe(`${baseUrl}/`);
    await expect(page.locator("[data-count]")).toHaveText("0");
  });

  test("does not reload repeatedly for the same stale client version", async ({
    page,
    vitePreview,
  }) => {
    let files: Files = async () => getFiles();
    let { port } = await vitePreview(files, templateName);
    let baseUrl = `http://localhost:${port}`;
    let documentRequests = trackDocumentRequests(page);
    let manifestRequests = await interceptWithStaleClientVersion(page);
    let consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    let eagerMismatch = page.waitForResponse(
      (response) =>
        response.url().includes(".manifest") && response.status() === 204,
    );

    await page.goto(`${baseUrl}/`);
    await eagerMismatch;
    await expect.poll(() => manifestRequests.length).toBeGreaterThan(0);

    let clientVersion = new URL(manifestRequests[0]).searchParams.get(
      "version",
    );
    await page.evaluate((version) => {
      sessionStorage.setItem("react-router-manifest-version", version!);
    }, clientVersion);

    await page.getByRole("link", { name: "Go to Other" }).click();
    await expect.poll(() => manifestRequests.length).toBeGreaterThan(1);
    await expect
      .poll(() => consoleErrors)
      .toContain("Unable to discover routes due to manifest version mismatch.");

    expect(documentRequests).toHaveLength(1);
  });
});

async function getClientVersion(source: string) {
  let digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}
