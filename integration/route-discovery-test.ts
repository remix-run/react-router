import { test, expect } from "@playwright/test";
import type { AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let appFixture: AppFixture;
test.beforeAll(async () => {
  let fixture = await createFixture({
    files: {
      "app/entry.client.tsx": js`
      import { StrictMode, startTransition } from "react";
      import { hydrateRoot } from "react-dom/client";
      import { HydratedRouter } from "react-router/dom";
      window.discoveryEvents = [];
      window.discoveryErrors = [];
      startTransition(() => hydrateRoot(document, <StrictMode><HydratedRouter
        onError={(error) => window.discoveryErrors.push(error.message)}
      /></StrictMode>));
    `,
      "app/root.tsx": js`
      import { useEffect, useState } from "react";
      import { Link, Outlet, Scripts, useFetcher, useNavigation, unstable_useRouteDiscovery } from "react-router";
      export async function clientLoader() {
        if (window.deferHydration) await new Promise(resolve => window.finishHydration = resolve);
        return null;
      }
      clientLoader.hydrate = true;
      export function HydrateFallback() {
        return <html><head/><body><p id="hydrating">Hydrating</p><Link to="/target">Eager target</Link><Scripts /></body></html>;
      }
      function Editor() {
        unstable_useRouteDiscovery({ onManifestMismatch: event => {
          window.discoveryEvents.push("editor"); event.stopPropagation();
        } });
        return <input aria-label="Draft" defaultValue="unsaved draft" />;
      }
      export default function Root() {
        let [editor, setEditor] = useState(false);
        let [result, setResult] = useState("");
        let { state, version, loadAllRoutes, discoverRoutes } = unstable_useRouteDiscovery({
          onBeforeDiscovery: async event => {
            window.discoveryEvents.push("before:" + event.source);
            if (window.discoveryStrategy === "before") await event.loadAllRoutes();
          },
          onManifestMismatch: async event => {
            window.discoveryEvents.push("mismatch:" + event.source);
            if (window.discoveryStrategy === "cancel") return;
            if (window.discoveryStrategy === "default") return event.defaultBehavior();
            if (window.discoveryStrategy === "wait") await new Promise(resolve => window.finishRecovery = resolve);
            await event.loadAllRoutes();
          },
        });
        let fetcher = useFetcher();
        let navigation = useNavigation();
        useEffect(() => { window.discovery = { loadAllRoutes, discoverRoutes }; }, [loadAllRoutes, discoverRoutes]);
        return <html><head/><body>
          <div id="discovery-state">{state}</div><div id="version">{version}</div>
          <div id="navigation">{navigation.state}</div><div id="fetcher">{fetcher.state}</div>
          <button onClick={() => loadAllRoutes().then(() => setResult("loaded"), e => setResult("caught:" + e.message))}>Complete</button>
          <button onClick={() => discoverRoutes(["/target"]).then(r => setResult(r.type))}>Discover</button>
          <button onClick={() => setEditor(!editor)}>Toggle editor</button>
          {editor ? <Editor/> : null}
          <div id="result">{result}</div>
          <Link to="/target" discover="none">Target</Link>
          <Link to="/other" discover="none">Other</Link>
          {typeof window !== "undefined" && window.eagerLink ? <Link to="/target">Eager target</Link> : null}
          <fetcher.Form method="post" action="/target" discover="none"><button>Submit</button></fetcher.Form>
          <Outlet/><Scripts/>
        </body></html>;
      }
      export function ErrorBoundary() { return <html><head/><body><p id="error-boundary">Error</p><Scripts/></body></html>; }
    `,
      "react-router.config.ts": js`export default { subResourceIntegrity: true, future: { unstable_customRouteDiscovery: true } };`,
      "app/routes/$slug.tsx": js`
        import { useParams } from "react-router";
        export default function Slug() { return <h1>Slug: {useParams().slug}</h1>; }
      `,
      "app/routes/_index.tsx": js`export default function Index() { return <h1>Home</h1>; }`,
      "app/routes/target.tsx": js`
      export function loader() { return null; }
      export function action() { return null; }
      export default function Target() { return <h1>Target route</h1>; }
    `,
      "app/routes/other.tsx": js`export default function Other() { return <h1>Other route</h1>; }`,
    },
  });
  appFixture = await createAppFixture(fixture);
});
test.afterAll(async () => {
  await appFixture.close();
});

async function mismatchRequests(page: import("@playwright/test").Page) {
  await page.route("**/__manifest?*", (route) =>
    route.fulfill({
      status: 204,
      headers: { "X-Remix-Reload-Document": "true" },
    }),
  );
}

test("loads only metadata, preserves the running manifest, and stops subsequent discovery", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  let requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await app.goto("/", true);
  await expect(page.locator("#discovery-state")).toHaveText("partial");
  await page.evaluate(() => {
    (window as any).originalManifest = (window as any).__reactRouterManifest;
  });
  let version = await page.locator("#version").textContent();
  requests = [];
  await page.getByRole("button", { name: "Complete", exact: true }).click();
  await expect(page.locator("#discovery-state")).toHaveText("complete");
  expect(requests.filter((url) => url.endsWith(".js"))).toHaveLength(1);
  expect(requests[0]).toContain("/manifest-");
  expect(
    await page.evaluate(
      () =>
        (window as any).originalManifest ===
        (window as any).__reactRouterManifest,
    ),
  ).toBe(true);
  expect(await page.locator("#version").textContent()).toBe(version);
  await page.getByRole("link", { name: "Target", exact: true }).click();
  await expect(page.getByRole("heading")).toHaveText("Target route");
  await page.getByRole("link", { name: "Other", exact: true }).click();
  await expect(page.getByRole("heading")).toHaveText("Other route");
  expect(requests.some((url) => url.includes("/__manifest"))).toBe(false);
});

test("selective discovery does not navigate or download route modules/data", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/", true);
  await expect(page.locator("#discovery-state")).toHaveText("partial");
  let requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.getByRole("button", { name: "Discover", exact: true }).click();
  await expect(page.locator("#result")).toHaveText("success");
  expect(requests).toHaveLength(1);
  expect(requests[0]).toContain("/__manifest?");
  await expect(page.getByRole("heading")).toHaveText("Home");
  await expect(page.locator("#discovery-state")).toHaveText("partial");
  await page.getByRole("link", { name: "Target", exact: true }).click();
  await expect(page.getByRole("heading")).toHaveText("Target route");
  expect(requests.filter((url) => url.includes("/__manifest"))).toHaveLength(1);
});

test("waits for hydrated route commitment before the first eager request", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).deferHydration = true;
    (window as any).eagerLink = true;
    (window as any).discoveryStrategy = "before";
  });
  let requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await page.waitForFunction(
    () => typeof (window as any).finishHydration === "function",
  );
  expect(requests.some((url) => url.includes("/__manifest"))).toBe(false);
  await page.evaluate(() => (window as any).finishHydration());
  await expect(page.locator("#discovery-state")).toHaveText("complete");
  expect(await page.evaluate(() => (window as any).discoveryEvents)).toContain(
    "before:eager",
  );
  expect(requests.some((url) => url.includes("/__manifest"))).toBe(false);
});

test("a later editor intercepts recovery and cleanup reveals the root handler", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/", true);
  await mismatchRequests(page);
  await page.getByRole("button", { name: "Toggle editor" }).click();
  await page.getByRole("link", { name: "Target", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).discoveryEvents))
    .toContain("editor");
  await expect(page.locator("#navigation")).toHaveText("idle");
  await expect(page.getByRole("heading")).toHaveText("Home");
  await expect(page.getByRole("textbox", { name: "Draft" })).toHaveValue(
    "unsaved draft",
  );
  await expect(page.locator("#error-boundary")).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle editor" }).click();
  await page.getByRole("link", { name: "Target", exact: true }).click();
  await expect(page.getByRole("heading")).toHaveText("Target route");
  await expect(page.locator("#discovery-state")).toHaveText("complete");
});

test("a canceled fetcher submission never posts or replays after completion", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).discoveryStrategy = "cancel";
  });
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/", true);
  await mismatchRequests(page);
  let posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).discoveryEvents))
    .toContain("mismatch:fetcher");
  await expect(page.locator("#fetcher")).toHaveText("idle");
  await page.getByRole("button", { name: "Complete", exact: true }).click();
  await expect(page.locator("#discovery-state")).toHaveText("complete");
  expect(posts).toEqual([]);
  await expect(page.locator("#error-boundary")).toHaveCount(0);
});

test("missing retained manifests reject direct loads and cancel recovery without an error boundary", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/", true);
  await page.route("**/assets/manifest-*.js", (route) =>
    route.fulfill({ status: 404, body: "missing retained asset" }),
  );
  await page.getByRole("button", { name: "Complete", exact: true }).click();
  await expect(page.locator("#result")).toContainText("caught:");
  await mismatchRequests(page);
  await page.getByRole("link", { name: "Target", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).discoveryErrors.length))
    .toBe(1);
  await expect(page.locator("#navigation")).toHaveText("idle");
  await expect(page.locator("#discovery-state")).toHaveText("partial");
  await expect(page.getByRole("heading")).toHaveText("Home");
  await expect(page.locator("#error-boundary")).toHaveCount(0);
});

test("a canceled Back navigation restores the URL and displayed route", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.history.replaceState({ idx: 0, key: "start" }, "", "/start");
    window.history.pushState({ idx: 1, key: "target" }, "", "/target");
    (window as any).discoveryStrategy = "cancel";
  });
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/target", true);
  await expect(page.getByRole("heading")).toHaveText("Target route");
  await mismatchRequests(page);
  await page.goBack();
  await expect
    .poll(() => page.evaluate(() => (window as any).discoveryEvents))
    .toContain("mismatch:navigation");
  await expect(page).toHaveURL(/\/target$/);
  await expect(page.getByRole("heading")).toHaveText("Target route");
  await expect(page.locator("#navigation")).toHaveText("idle");
  await expect(page.locator("#error-boundary")).toHaveCount(0);
});

test("shared recovery survives a superseded navigation and resumes a fetcher exactly once", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).discoveryStrategy = "wait";
  });
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/", true);
  await mismatchRequests(page);
  let posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.getByRole("link", { name: "Target", exact: true }).click();
  await page.waitForFunction(
    () => typeof (window as any).finishRecovery === "function",
  );
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).discoveryEvents))
    .toContain("before:fetcher");
  await page.getByRole("link", { name: "Other", exact: true }).click();
  await page.evaluate(() => (window as any).finishRecovery());
  await expect(page.getByRole("heading")).toHaveText("Other route");
  await expect(page.locator("#fetcher")).toHaveText("idle");
  await expect(page.locator("#discovery-state")).toHaveText("complete");
  expect(posts).toHaveLength(1);
  let events = await page.evaluate(
    () => (window as any).discoveryEvents as string[],
  );
  expect(events.filter((event) => event.startsWith("mismatch:"))).toEqual([
    "mismatch:navigation",
  ]);
});

test("a navigation immediately after canceled Back preserves subsequent history events", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.history.replaceState({ idx: 0, key: "start" }, "", "/start");
    window.history.pushState({ idx: 1, key: "target" }, "", "/target");
    (window as any).discoveryStrategy = "cancel";
  });
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/target", true);
  // Discover a static destination so the navigation after cancellation can
  // finish immediately, before an asynchronous compensating POP would arrive.
  await page.evaluate(() =>
    (window as any).discovery.discoverRoutes(["/other"]),
  );
  await expect(page.getByRole("heading")).toHaveText("Target route");
  await mismatchRequests(page);
  await page.evaluate(async () => {
    let router = (window as any).__reactRouterDataRouter;
    await router.navigate(-1);
    await router.navigate("/other");
  });
  await expect(page).toHaveURL(/\/other$/);
  await expect(page.getByRole("heading")).toHaveText("Other route");
  await page.goBack();
  await expect(page).toHaveURL(/\/target$/);
  await expect(page.getByRole("heading")).toHaveText("Target route");
  await expect(page.locator("#navigation")).toHaveText("idle");
});

test("before-discovery full-load failures report and fall back to incremental discovery", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).discoveryStrategy = "before";
  });
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/", true);
  await page.route("**/assets/manifest-*.js", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.getByRole("link", { name: "Target", exact: true }).click();
  await expect(page.getByRole("heading")).toHaveText("Target route");
  expect(
    await page.evaluate(() => (window as any).discoveryErrors.length),
  ).toBe(1);
  await expect(page.locator("#discovery-state")).toHaveText("partial");
  await expect(page.locator("#error-boundary")).toHaveCount(0);
});

(["navigation", "fetcher"] as const).forEach((source) => {
  test(`custom ${source} handlers can explicitly request default document recovery`, async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await page.addInitScript(() => {
      (window as any).discoveryStrategy = "default";
    });
    await app.goto("/", true);
    await mismatchRequests(page);
    let requests: string[] = [];
    let posts: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest())
        requests.push(new URL(request.url()).pathname);
      if (request.method() === "POST") posts.push(request.url());
    });
    if (source === "navigation") {
      await app.clickLink("/target");
      await expect(
        page.getByRole("heading", { name: "Target route" }),
      ).toBeVisible();
      expect(requests).toEqual(["/target"]);
    } else {
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect.poll(() => requests).toEqual(["/"]);
      await expect(page.locator("#fetcher")).toHaveText("idle");
    }
    expect(posts).toEqual([]);
    await expect(page.locator("#error-boundary")).toHaveCount(0);
  });
});
