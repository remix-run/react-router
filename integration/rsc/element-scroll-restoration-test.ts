import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { implementations, js, setupRscTest } from "./utils";

for (let implementation of implementations) {
  test.describe(`element scroll restoration (RSC Data, ${implementation.name})`, () => {
    let port: number;
    let stop: (() => void) | undefined;
    test.beforeAll(async () => {
      port = await getPort();
      stop = await setupRscTest({
        implementation,
        port,
        files: {
          "src/routes.ts": js`
            export const routes = [{
              id: "root", path: "", lazy: () => import("./routes/root"),
              children: [
                { id: "home", index: true, lazy: () => import("./routes/home") },
                { id: "two", path: "two", lazy: () => import("./routes/two") },
              ],
            }];
          `,
          "src/routes/root.tsx": js`
            import { Links, Outlet } from "react-router";
            import { Containers, Restoration } from "./containers";
            export function Layout({children}) {
              return <html><head><Links /></head><body>
                <Containers>{children}</Containers><Restoration />
              </body></html>;
            }
            export default function Root() { return <Outlet />; }
          `,
          "src/routes/containers.tsx": js`
            "use client";
            import { useEffect } from "react";
            import { Link, ScrollRestoration, unstable_useElementScrollRestoration } from "react-router";
            export function Restoration() { return <ScrollRestoration />; }
            export function Containers({children}) {
              unstable_useElementScrollRestoration("#pane");
              unstable_useElementScrollRestoration("#sidebar");
              useEffect(() => { document.documentElement.dataset.hydrated = "true"; }, []);
              return <>
                <Link to="/">Home</Link><Link to="/two">Two</Link>
                <div id="sidebar" style={{height:100,overflow:"auto"}}><div style={{height:2000}}>Sidebar</div></div>
                <main id="pane" style={{height:200,width:300,overflow:"auto"}}>
                  <div style={{height:3000,width:1500}}>{children}</div>
                </main>
              </>;
            }
          `,
          "src/routes/home.tsx": js`export default function Home() { return <h1>Home</h1>; }`,
          "src/routes/two.tsx": js`export default function Two() { return <h1>Two</h1>; }`,
        },
      });
    });
    test.afterAll(() => stop?.());

    test("restores independent containers on navigation", async ({ page }) => {
      await page.goto(`http://localhost:${port}`);
      await page.waitForSelector('html[data-hydrated="true"]');
      await page.evaluate(() => {
        document.getElementById("pane")!.scrollTop = 600;
        document.getElementById("pane")!.scrollLeft = 100;
        document.getElementById("sidebar")!.scrollTop = 250;
      });
      await page
        .getByRole("link", { name: "Two", exact: true })
        .evaluate((el: HTMLAnchorElement) => el.click());
      await expect(page.getByRole("heading")).toHaveText("Two");
      await expect
        .poll(() => page.locator("#pane").evaluate((el) => el.scrollTop))
        .toBe(0);
      await page.goBack();
      await expect(page.getByRole("heading")).toHaveText("Home");
      await expect
        .poll(() =>
          page.locator("#pane").evaluate((el) => [el.scrollLeft, el.scrollTop]),
        )
        .toEqual([100, 600]);
      expect(
        await page.locator("#sidebar").evaluate((el) => el.scrollTop),
      ).toBe(250);
    });

    test("restores before hydration and consumes the initial attempt", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        window.history.replaceState(
          { ...window.history.state, key: "rsc-entry" },
          "",
        );
        sessionStorage.setItem(
          "react-router-scroll-positions:elements",
          JSON.stringify({
            version: 1,
            positions: { "rsc-entry": { "#pane": { x: 100, y: 600 } } },
          }),
        );
      });
      let release!: () => void;
      let hydrationGate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route("**/assets/*.js", async (route) => {
        await hydrationGate;
        await route.continue();
      });
      await page.goto(`http://localhost:${port}`, { waitUntil: "commit" });
      await expect
        .poll(() => page.locator("#pane").evaluate((el) => el.scrollTop))
        .toBe(600);
      expect(
        await page.locator("html").getAttribute("data-hydrated"),
      ).toBeNull();
      await page.locator("#pane").evaluate((el) => {
        el.scrollTop = 325;
      });
      release();
      await page.waitForSelector('html[data-hydrated="true"]');
      expect(await page.locator("#pane").evaluate((el) => el.scrollTop)).toBe(
        325,
      );
    });
  });
}
