import { expect } from "@playwright/test";

import { test, viteConfig } from "./helpers/vite.js";

const js = String.raw;

test("hydrates Links with a server-only nonce", async ({ page, dev }) => {
  let { port } = await dev(async ({ port }) => ({
    "vite.config.ts": await viteConfig.basic({ port }),
    "app/entry.server.tsx": js`
      import { renderToReadableStream } from "react-dom/server";
      import { ServerRouter } from "react-router";

      export default async function handleRequest(request, status, headers, context) {
        let body = await renderToReadableStream(
          <ServerRouter context={context} url={request.url} nonce="server-nonce" />,
          { nonce: "server-nonce" }
        );
        headers.set("Content-Type", "text/html");
        headers.set("Content-Security-Policy", "style-src 'self' 'nonce-server-nonce'");
        return new Response(body, { status, headers });
      }
    `,
    "app/root.tsx": js`
      import { useEffect, useState } from "react";
      import { Links, Scripts } from "react-router";
      import "./critical.css";

      export const links = () => [
        { rel: "stylesheet", href: "/route.css" },
        { page: "/other" },
      ];

      export default function Root() {
        let [count, setCount] = useState(0);
        let [hydrated, setHydrated] = useState(false);
        useEffect(() => setHydrated(true), []);
        return (
          <html>
            <head><Links /></head>
            <body>
              <button disabled={!hydrated} onClick={() => setCount(count + 1)}>
                Count: {count}
              </button>
              <Scripts />
            </body>
          </html>
        );
      }
    `,
    "app/critical.css": "button { color: rgb(255, 0, 0); }",
    "app/routes/other.tsx": js`
      export function loader() { return null; }
      export default function Other() { return <p>Other</p>; }
    `,
    "public/route.css": "button { padding: 20px; }",
  }));

  let hydrationWarnings: string[] = [];
  page.on("console", (message) => {
    if (/hydrat|didn't match|did not match/i.test(message.text())) {
      hydrationWarnings.push(message.text());
    }
  });

  let response = await page.goto(`http://localhost:${port}/`);
  let html = await response!.text();
  expect(html).toContain('nonce="server-nonce"');
  expect(html).toContain("data-react-router-critical-css");
  expect(html).toContain('href="/other.data"');

  let button = page.getByRole("button", { name: "Count: 0" });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole("button", { name: "Count: 1" })).toBeVisible();
  expect(
    await page
      .locator('link[href="/route.css"]')
      .evaluate((link: HTMLLinkElement) => link.nonce),
  ).toBe("server-nonce");
  expect(
    await page
      .locator('link[rel="prefetch"][href="/other.data"]')
      .evaluate((link: HTMLLinkElement) => link.nonce),
  ).toBe("server-nonce");
  expect(hydrationWarnings).toEqual([]);
  expect(page.errors).toEqual([]);
});
