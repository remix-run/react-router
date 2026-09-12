import { expect, type Page } from "@playwright/test";
import getPort from "get-port";

import { js } from "./helpers/create-fixture.js";
import { test } from "./helpers/vite.js";
import { implementations, setupRscTest } from "./rsc/utils.js";

async function expectNonceSupport(page: Page, nonce: string) {
  const scripts = page.locator("script");
  const count = await scripts.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index++) {
    expect(
      await scripts
        .nth(index)
        .evaluate((script: HTMLScriptElement) => script.nonce),
    ).toBe(nonce);
  }

  await page.getByRole("button", { name: "Count: 0" }).click();
  await expect(page.getByRole("button", { name: "Count: 1" })).toBeVisible();
}

test.describe("RSC CSP nonces", () => {
  test.describe("RSC Framework", () => {
    test("adds the nonce to document scripts and hydrates under a strict CSP", async ({
      page,
      vitePreview,
    }) => {
      const { port } = await vitePreview(
        async () => ({
          "app/entry.ssr.tsx": js`
              import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
              import { renderToReadableStream } from "react-dom/server.edge";
              import {
                unstable_routeRSCServerRequest as routeRSCServerRequest,
                unstable_RSCStaticRouter as RSCStaticRouter,
              } from "react-router";

              export async function generateHTML(
                request: Request,
                serverResponse: Response,
              ) {
                const nonce = crypto.randomUUID();
                const response = await routeRSCServerRequest({
                  request,
                  serverResponse,
                  createFromReadableStream,
                  nonce,
                  async renderHTML(getPayload, options) {
                    const payload = getPayload();
                    const bootstrapScriptContent =
                      await import.meta.viteRsc.loadBootstrapScriptContent("index");

                    return renderToReadableStream(
                      <RSCStaticRouter
                        getPayload={getPayload}
                        nonce={options.nonce}
                      />,
                      {
                        ...options,
                        bootstrapScriptContent,
                        formState: await payload.formState,
                        signal: request.signal,
                      },
                    );
                  },
                });
                response.headers.set(
                  "Content-Security-Policy",
                  "script-src 'self' 'nonce-" + nonce + "'",
                );
                return response;
              }
            `,
          "app/routes/_index.tsx": js`
              "use client";

              import { useState } from "react";

              export default function Index() {
                const [count, setCount] = useState(0);
                return (
                  <button onClick={() => setCount(count + 1)}>
                    Count: {count}
                  </button>
                );
              }
            `,
        }),
        "rsc-vite-framework",
      );

      const response = await page.goto(`http://localhost:${port}`);
      const policy = response?.headers()["content-security-policy"];
      const nonce = policy?.match(/'nonce-([^']+)'/)?.[1];
      expect(nonce).toBeTruthy();
      await expectNonceSupport(page, nonce!);
    });
  });

  implementations.forEach((implementation) => {
    test.describe(`RSC Data (${implementation.name})`, () => {
      let port: number;
      let stop: (() => void) | undefined;

      test.beforeAll(async () => {
        port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/entry.ssr.tsx": js`
              import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
              import { renderToReadableStream } from "react-dom/server.edge";
              import {
                unstable_routeRSCServerRequest as routeRSCServerRequest,
                unstable_RSCStaticRouter as RSCStaticRouter,
              } from "react-router";

              export default async function handler(
                request: Request,
                serverResponse: Response,
              ) {
                const nonce = crypto.randomUUID();
                const bootstrapScriptContent =
                  await import.meta.viteRsc.loadBootstrapScriptContent("index");
                const response = await routeRSCServerRequest({
                  request,
                  serverResponse,
                  createFromReadableStream,
                  nonce,
                  async renderHTML(getPayload, options) {
                    const payload = getPayload();
                    return renderToReadableStream(
                      <RSCStaticRouter
                        getPayload={getPayload}
                        nonce={options.nonce}
                      />,
                      {
                        ...options,
                        bootstrapScriptContent,
                        signal: request.signal,
                        formState: await payload.formState,
                      },
                    );
                  },
                });
                response.headers.set(
                  "Content-Security-Policy",
                  "script-src 'self' 'nonce-" + nonce + "'",
                );
                return response;
              }
            `,
            "src/routes/home.client.tsx": js`
              "use client";

              import { useState } from "react";

              export default function Counter() {
                const [count, setCount] = useState(0);
                return (
                  <button onClick={() => setCount(count + 1)}>
                    Count: {count}
                  </button>
                );
              }
            `,
            "src/routes/home.tsx": js`
              import Counter from "./home.client";

              export default function HomeRoute() {
                return <Counter />;
              }
            `,
          },
        });
      });

      test.afterAll(() => {
        stop?.();
      });

      test("adds the nonce to document scripts and hydrates under a strict CSP", async ({
        page,
      }) => {
        const response = await page.goto(`http://localhost:${port}`);
        const policy = response?.headers()["content-security-policy"];
        const nonce = policy?.match(/'nonce-([^']+)'/)?.[1];
        expect(nonce).toBeTruthy();
        await expectNonceSupport(page, nonce!);
      });
    });
  });
});
