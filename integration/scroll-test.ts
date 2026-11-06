import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { redirect, Form } from "react-router";

        export function action() {
          return redirect("/test");
        };

        export default function Component() {
          return (
            <>
              <h1>Index Page - Scroll Down</h1>
              <Form method="post" style={{ marginTop: "150vh" }}>
                <button type="submit">Submit</button>
              </Form>
            </>
          );
        }
      `,

      "app/routes/test.tsx": js`
        export default function Component() {
          return (
            <>
              <h1 id="redirected">Redirected!</h1>
              <p style={{ marginTop: "150vh" }}>I should not be visible!!</p>
            </>
          );
        }
      `,

      "app/routes/hash.tsx": js`
        import { Link } from "react-router";

        export default function Component() {
          return (
            <>
              <h1>Hash Scrolling</h1>
              <Link to="#hello-world">hash link to hello-world</Link>
              <Link to="#hello 🌎">hash link to hello 🌎</Link>
              <div style={{ height: '3000px' }}>Spacer Div</div>
              <p id="hello-world">hello-world scroll target</p>
              <p id="hello 🌎">hello 🌎 scroll target</p>
            </>
          );
        }
      `,
    },
  });

  // This creates an interactive app using playwright.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  runTests();
});

test.describe("with JavaScript", () => {
  test.use({ javaScriptEnabled: true });
  runTests();
});

function runTests() {
  test("page scroll should be at the top on the new page", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    // Scroll to the bottom and submit
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    let scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBeGreaterThan(0);
    await app.clickSubmitButton("/?index");
    await page.waitForSelector("#redirected");

    // Ensure we scrolled back to the top
    scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBe(0);
  });

  test("should scroll to hash locations", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/hash");
    let scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBe(0);
    await app.clickLink("/hash#hello-world");
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });

  test("should scroll to hash locations with URL encoded characters", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/hash");
    let scroll = await page.evaluate(() => window.scrollY);
    expect(scroll).toBe(0);
    await app.clickLink("/hash#hello 🌎");
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
  });
}

for (let mode of ["framework-ssr", "framework-spa", "rsc-framework"] as const) {
  test.describe(`element scroll restoration (${mode})`, () => {
    let elementApp: AppFixture;
    test.beforeAll(async () => {
      let elementFixture = await createFixture({
        ...(mode === "rsc-framework"
          ? { templateName: "rsc-vite-framework" as const }
          : {}),
        ...(mode === "framework-spa" ? { spaMode: true } : {}),
        files: {
          "app/root.tsx": js`
            import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
            import { Containers } from "./containers";
            export default function Root() {
              return <html><head><Meta /><Links /></head><body>
                <Containers><Outlet /></Containers>
                ${mode === "framework-spa" ? "" : '<ScrollRestoration storageKey="element-scroll" getKey={(location) => location.pathname} />'}
                <Scripts />
              </body></html>;
            }
          `,
          "app/containers.tsx": js`
            "use client";
            import { useEffect, useState } from "react";
            import { Link, unstable_useElementScrollRestoration } from "react-router";
            export function Containers({children}) {
              unstable_useElementScrollRestoration("#outer");
              unstable_useElementScrollRestoration("#content");
              unstable_useElementScrollRestoration("#short");
              let [expanded, setExpanded] = useState(false);
              let [sidebar, setSidebar] = useState(true);
              useEffect(() => { document.documentElement.dataset.hydrated = "true"; }, []);
              return <>
                <Link to="/">Home</Link><Link to="/two">Two</Link>
                <Link to="/two#target">Hash</Link>
                <Link to="/two" preventScrollReset>Preserve</Link>
                <button onClick={() => setExpanded(true)}>Expand</button>
                <button onClick={() => setSidebar(!sidebar)}>Toggle sidebar</button>
                {sidebar && <Sidebar />}
                <div id="outer" style={{width:400,height:220,overflow:"auto"}}>
                  <div style={{height:400}}>Outer spacer</div>
                  <main id="content" style={{width:300,height:150,overflow:"auto"}}>
                    <div style={{height:expanded ? 4000 : 2000,width:1200}}>
                      {children}<div style={{height:1200}} /><p id="target">Target</p>
                    </div>
                  </main>
                  <div style={{height:1000}} />
                </div>
                <div id="short" style={{height:100,overflow:"auto"}}>
                  <div style={{height:expanded ? 3000 : 50}}>Short content</div>
                </div>
                <div style={{height:2000}} />
              </>;
            }
            function Sidebar() {
              unstable_useElementScrollRestoration("#sidebar");
              return <aside id="sidebar" style={{width:200,height:200,overflow:"auto"}}>
                <div style={{height:2000,width:600}}>Sidebar</div>
              </aside>;
            }
          `,
          "app/routes/_index.tsx": js`export default function Index() { return <h1 id="route">Home</h1>; }`,
          "app/routes/two.tsx": js`export default function Two() { return <h1 id="route">Two</h1>; }`,
        },
      });
      elementApp = await createAppFixture(elementFixture);
    });
    test.afterAll(() => elementApp?.close());

    test("restores several containers on back/forward and supports standalone SPA hooks", async ({
      page,
    }) => {
      await page.goto(elementApp.serverUrl);
      await page.waitForSelector('html[data-hydrated="true"]');
      await page.evaluate(() => {
        document.getElementById("sidebar")!.scrollTop = 240;
        document.getElementById("outer")!.scrollTop = 320;
        document.getElementById("content")!.scrollTop = 800;
        document.getElementById("content")!.scrollLeft = 75;
        window.scrollTo(0, 110);
      });
      await page
        .getByRole("link", { name: "Two", exact: true })
        .evaluate((node: HTMLAnchorElement) => node.click());
      await expect(page.locator("#route")).toHaveText("Two");
      await expect
        .poll(() => page.locator("#content").evaluate((el) => el.scrollTop))
        .toBe(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(
        mode === "framework-spa" ? 110 : 0,
      );
      await page.goBack();
      await expect(page.locator("#route")).toHaveText("Home");
      await expect
        .poll(() =>
          page
            .locator("#content")
            .evaluate((el) => [el.scrollLeft, el.scrollTop]),
        )
        .toEqual([75, 800]);
      expect(
        await page.locator("#sidebar").evaluate((el) => el.scrollTop),
      ).toBe(240);
      expect(await page.locator("#outer").evaluate((el) => el.scrollTop)).toBe(
        320,
      );
      await page.goForward();
      await expect(page.locator("#route")).toHaveText("Two");
      await expect
        .poll(() => page.locator("#content").evaluate((el) => el.scrollTop))
        .toBe(0);
    });

    test("scrolls nested hash containers without scrolling window in standalone mode", async ({
      page,
    }) => {
      await page.goto(elementApp.serverUrl);
      await page.waitForSelector('html[data-hydrated="true"]');
      await page.evaluate(() => window.scrollTo(0, 100));
      await page
        .getByRole("link", { name: "Hash", exact: true })
        .evaluate((node: HTMLAnchorElement) => node.click());
      await expect(page.locator("#route")).toHaveText("Two");
      await expect
        .poll(() => page.locator("#content").evaluate((el) => el.scrollTop))
        .toBeGreaterThan(1000);
      expect(
        await page.locator("#outer").evaluate((el) => el.scrollTop),
      ).toBeGreaterThan(0);
      if (mode === "framework-spa")
        expect(await page.evaluate(() => window.scrollY)).toBe(100);
    });

    test("captures local container removal before its DOM scroll position is lost", async ({
      page,
    }) => {
      await page.goto(elementApp.serverUrl);
      await page.waitForSelector('html[data-hydrated="true"]');
      await page.locator("#sidebar").evaluate((el) => {
        el.scrollTop = 345;
      });
      await page
        .getByRole("button", { name: "Toggle sidebar" })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect(page.locator("#sidebar")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Toggle sidebar" })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect
        .poll(() => page.locator("#sidebar").evaluate((el) => el.scrollTop))
        .toBe(345);
    });

    if (mode !== "framework-spa") {
      test("preserves saved ancestors and window while scrolling an unsaved nested hash container", async ({
        page,
      }) => {
        await page.addInitScript(() => {
          sessionStorage.setItem(
            "element-scroll",
            JSON.stringify({ "/two": 130 }),
          );
          sessionStorage.setItem(
            "element-scroll:elements",
            JSON.stringify({
              version: 1,
              positions: {
                "/two": {
                  "#outer": { x: 0, y: 250 },
                  "#sidebar": { x: 0, y: 90 },
                },
              },
            }),
          );
        });
        await page.goto(elementApp.serverUrl);
        await page.waitForSelector('html[data-hydrated="true"]');
        await page
          .getByRole("link", { name: "Hash", exact: true })
          .evaluate((node: HTMLAnchorElement) => node.click());
        await expect(page.locator("#route")).toHaveText("Two");
        await expect
          .poll(() => page.locator("#content").evaluate((el) => el.scrollTop))
          .toBeGreaterThan(1000);
        expect(
          await page.locator("#outer").evaluate((el) => el.scrollTop),
        ).toBe(250);
        expect(
          await page.locator("#sidebar").evaluate((el) => el.scrollTop),
        ).toBe(90);
        expect(await page.evaluate(() => window.scrollY)).toBe(130);
      });

      test("restores before hydration once, including clamping and later content growth", async ({
        page,
      }) => {
        let release!: () => void;
        let hydrationGate = new Promise<void>((resolve) => {
          release = resolve;
        });
        await page.addInitScript(() => {
          sessionStorage.setItem(
            "element-scroll:elements",
            JSON.stringify({
              version: 1,
              positions: {
                "/": {
                  "#sidebar": { x: 0, y: 240 },
                  "#content": { x: 75, y: 800 },
                  "#short": { x: 0, y: 900 },
                },
              },
            }),
          );
        });
        await page.route("**/assets/*.js", async (route) => {
          await hydrationGate;
          await route.continue();
        });
        await page.goto(elementApp.serverUrl, { waitUntil: "commit" });
        await expect
          .poll(() => page.locator("#content").evaluate((el) => el.scrollTop))
          .toBe(800);
        expect(
          await page.locator("#content").evaluate((el) => el.scrollLeft),
        ).toBe(75);
        expect(
          await page.locator("#sidebar").evaluate((el) => el.scrollTop),
        ).toBe(240);
        expect(
          await page.locator("html").getAttribute("data-hydrated"),
        ).toBeNull();
        expect(
          await page.locator("#short").evaluate((el) => el.scrollTop),
        ).toBe(0);
        await page.locator("#content").evaluate((el) => {
          el.scrollTop = 333;
        });
        release();
        await page.waitForSelector('html[data-hydrated="true"]');
        expect(
          await page.locator("#content").evaluate((el) => el.scrollTop),
        ).toBe(333);
        await page
          .getByRole("button", { name: "Expand" })
          .evaluate((node: HTMLButtonElement) => node.click());
        await expect
          .poll(() => page.locator("#short").evaluate((el) => el.scrollHeight))
          .toBe(3000);
        expect(
          await page.locator("#content").evaluate((el) => el.scrollTop),
        ).toBe(333);
        expect(
          await page.locator("#short").evaluate((el) => el.scrollTop),
        ).toBe(0);
      });
    }
  });
}

test("restores custom root keys before hydration when the route repeats the basename", async ({
  page,
}) => {
  let basenameFixture = await createFixture({
    files: {
      "react-router.config.ts": js`export default { basename: "/base" };`,
      "app/root.tsx": js`
      import { useEffect } from "react";
      import { Links, Outlet, Scripts, ScrollRestoration, unstable_useElementScrollRestoration } from "react-router";
      export default function Root() {
        unstable_useElementScrollRestoration("#pane");
        useEffect(() => { document.documentElement.dataset.hydrated = "true"; }, []);
        return <html><head><Links /></head><body>
          <main id="pane" style={{height:100,overflow:"auto"}}><div style={{height:2000}}><Outlet /></div></main>
          <div style={{height:3000}} />
          <ScrollRestoration storageKey="basename-scroll" getKey={(location) => location.pathname} /><Scripts />
        </body></html>;
      }
    `,
      "app/routes/base.page.tsx": js`export default function Page() { return <h1>Page</h1>; }`,
    },
  });
  let basenameApp = await createAppFixture(basenameFixture);
  let release!: () => void;
  let gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "basename-scroll",
        JSON.stringify({ "/base/page": 140, "/page": 30 }),
      );
      sessionStorage.setItem(
        "basename-scroll:elements",
        JSON.stringify({
          version: 1,
          positions: {
            "/base/page": { "#pane": { x: 0, y: 800 } },
            "/page": { "#pane": { x: 0, y: 200 } },
          },
        }),
      );
    });
    await page.route("**/assets/*.js", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(basenameApp.serverUrl + "/base/base/page", {
      waitUntil: "commit",
    });
    await expect
      .poll(() => page.locator("#pane").evaluate((el) => el.scrollTop))
      .toBe(800);
    expect(await page.evaluate(() => window.scrollY)).toBe(140);
    expect(await page.locator("html").getAttribute("data-hydrated")).toBeNull();
    release();
    await page.waitForSelector('html[data-hydrated="true"]');
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    expect(
      await page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("basename-scroll")!)["/base/page"],
      ),
    ).toBe(140);
  } finally {
    release();
    basenameApp.close();
  }
});
