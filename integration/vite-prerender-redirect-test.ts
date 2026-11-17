import { readFile } from "node:fs/promises";
import path from "node:path";

import { js } from "./helpers/create-fixture";
import { build, createProject, reactRouterConfig, test } from "./helpers/vite";
import { expect } from "@playwright/test";

for (let { template, previewServerPrerendering } of [
  { template: "vite-5-template", previewServerPrerendering: false },
  { template: "vite-6-template", previewServerPrerendering: true },
  { template: "rsc-vite-framework", previewServerPrerendering: false },
] as const) {
  test.describe(`prerender redirects (${template})`, () => {
    test("preserves redirect destinations and refresh timing", async ({
      page,
    }) => {
      let location =
        'https://example.invalid/?q="a&b"&content=<title>Example</title>';
      let cwd = await createProject(
        {
          "react-router.config.ts": reactRouterConfig({
            future: {
              unstable_previewServerPrerendering: previewServerPrerendering,
            },
            prerender: ["/markup", "/permanent", "/temporary", "/target"],
          }),
          "app/routes/markup.tsx": js`
            import { redirect } from "react-router";
            export function loader() {
              return redirect(${JSON.stringify(location)});
            }
            export default function Route() { return null; }
          `,
          "app/routes/permanent.tsx": js`
            import { redirect } from "react-router";
            export function loader() {
              return redirect("/target?first=1&second=2", 301);
            }
            export default function Route() { return null; }
          `,
          "app/routes/temporary.tsx": js`
            import { redirect } from "react-router";
            export function loader() { return redirect("/target"); }
            export default function Route() { return null; }
          `,
          "app/routes/target.tsx": js`
            export default function Route() { return <h1>Target</h1>; }
          `,
        },
        template,
      );
      let buildResult = build({ cwd });
      expect(buildResult.status, buildResult.stderr.toString()).toBe(0);
      let baseUrl = "http://prerender.test";
      // Serve the generated artifacts as a static host would, in both modes.
      await page.route(`${baseUrl}/**`, async (route) => {
        let pathname = new URL(route.request().url()).pathname;
        await route.fulfill({
          path: path.join(
            cwd,
            "build/client",
            pathname,
            path.extname(pathname) ? "" : "index.html",
          ),
        });
      });
      await page.route("https://example.invalid/**", (route) => route.abort());
      await page.goto(`${baseUrl}/markup`, { waitUntil: "domcontentloaded" });
      let result = await page.evaluate(() => {
        let anchor = document.querySelector("a")!;
        return {
          attributes: anchor.getAttributeNames(),
          href: anchor.getAttribute("href"),
          title: document.title,
          text: anchor.textContent,
          refresh: document
            .querySelector('meta[http-equiv="refresh"]')!
            .getAttribute("content"),
          titleElements: document.querySelectorAll("title").length,
        };
      });
      expect(result).toEqual({
        attributes: ["href"],
        href: location,
        title: `Redirecting to: ${location}`,
        text: expect.stringContaining(location),
        refresh: `2;url=${location}`,
        titleElements: 1,
      });
      expect(result.text).toContain("/markup");

      for (let [route, delay] of [
        ["permanent", 0],
        ["temporary", 2],
      ] as const) {
        let html = await readFile(
          path.join(cwd, `build/client/${route}/index.html`),
          "utf8",
        );
        expect(html).toContain(`content="${delay};url=/target`);
      }
      await page.goto(`${baseUrl}/permanent`);
      await expect(page).toHaveURL(`${baseUrl}/target?first=1&second=2`);
      await expect(page.getByRole("heading", { name: "Target" })).toBeVisible();
    });

    test("validates redirect URL protocols", async () => {
      let protocol = "JaVaScRiPt";
      // Use an RSC resource route to exercise prerendering directly.
      let cwd = await createProject(
        {
          "react-router.config.ts": reactRouterConfig({
            prerender: ["/unsupported"],
            future: {
              unstable_previewServerPrerendering: previewServerPrerendering,
            },
          }),
          "app/routes/unsupported.tsx": js`
            import { redirect } from "react-router";
            export function loader() {
              return redirect(${JSON.stringify(`${protocol}:void(0)`)});
            }
            ${template === "rsc-vite-framework" ? "" : "export default function Route() { return null; }"}
          `,
        },
        template,
      );
      let result = build({ cwd });
      expect(result.status).not.toBe(0);
      expect(result.stderr.toString()).toMatch(
        /Cannot prerender redirect for "\/unsupported\/?": unsafe URL protocol "javascript:"/,
      );
    });
  });
}
