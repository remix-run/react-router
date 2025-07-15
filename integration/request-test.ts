import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import getPort from "get-port";
import { createProject, customDev, viteConfig } from "./helpers/vite.js";

let fixture: Fixture;
let appFixture: AppFixture;

const sharedFiles = {
  "app/routes/_index.tsx": js`
      import { Form, useLoaderData, useActionData } from "react-router";

      async function requestToJson(request) {
        let body = null;

        if (request.body) {
          let fd = await request.formData();
          body = Object.fromEntries(fd.entries());
        }

        return {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
          body,
        };
      }
      export async function loader({ request }) {
        return requestToJson(request);
      }
      export function action({ request }) {
        return requestToJson(request);
      }
      export default function Index() {
        let loaderData = useLoaderData();
        let actionData = useActionData();
        return (
          <div>
            <button id="set-cookie" onClick={() => {
              document.cookie = 'cookie=nomnom; path=/';
            }}>
              Set Cookie
            </button>
            <Form method="get" reloadDocument>
              <button type="submit" id="submit-get-ssr" name="type" value="ssr">
                SSR GET
              </button>
            </Form>
            <Form method="get">
              <button type="submit" id="submit-get-csr" name="type" value="csr">
                CSR GET
              </button>
            </Form>
            <Form method="post" reloadDocument>
              <button type="submit" id="submit-post-ssr" name="type" value="ssr">
                SSR POST
              </button>
            </Form>
            <Form method="post">
              <button type="submit" id="submit-post-csr" name="type" value="csr">
                CSR POST
              </button>
            </Form>
            <pre id="loader-data">{JSON.stringify(loaderData)}</pre>
            {actionData ?
              <pre id="action-data">{JSON.stringify(actionData)}</pre> :
              null}
          </div>
        )
      }
    `,
};

test.describe("Request Tests", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        ...sharedFiles,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture.close());

  test("loader request on SSR GET requests", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#set-cookie");

    let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(loaderData.headers.cookie).toEqual(undefined);
    expect(loaderData.body).toEqual(null);

    await app.clickElement("#submit-get-ssr");

    loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/\?type=ssr$/);
    expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
    expect(loaderData.body).toEqual(null);
  });

  test("loader request on CSR GET requests", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#set-cookie");

    let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(loaderData.headers.cookie).toEqual(undefined);
    expect(loaderData.body).toEqual(null);

    await app.clickElement("#submit-get-csr");

    loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/\?type=csr$/);
    expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
    expect(loaderData.body).toEqual(null);
  });

  test("action + loader requests SSR POST requests", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#set-cookie");

    let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(loaderData.headers.cookie).toEqual(undefined);
    expect(loaderData.body).toEqual(null);

    await app.clickElement("#submit-post-ssr");

    let actionData = JSON.parse(await page.locator("#action-data").innerHTML());
    expect(actionData.method).toEqual("POST");
    expect(actionData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(actionData.headers.cookie).toEqual("cookie=nomnom");
    expect(actionData.body).toEqual({ type: "ssr" });

    loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
    expect(loaderData.body).toEqual(null);
  });

  test("action + loader requests on CSR POST requests", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#set-cookie");

    let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(loaderData.headers.cookie).toEqual(undefined);
    expect(loaderData.body).toEqual(null);

    await app.clickElement("#submit-post-csr");

    let actionData = JSON.parse(await page.locator("#action-data").innerHTML());
    expect(actionData.method).toEqual("POST");
    expect(actionData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(actionData.headers.cookie).toEqual("cookie=nomnom");
    expect(actionData.body).toEqual({ type: "csr" });

    loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
    expect(loaderData.method).toEqual("GET");
    expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
    expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
    expect(loaderData.body).toEqual(null);
  });
});

test.describe("Request stream already closed", () => {
  let port: number;
  let cwd: string;
  let stop: () => void;

  test.beforeAll(async () => {
    port = await getPort();
    cwd = await createProject({
      ...sharedFiles,
      "vite.config.ts": await viteConfig.basic({ port }),
      "server.mjs": String.raw`
        import { createRequestHandler } from "@react-router/express";
        import express from "express";

        let viteDevServer =
          process.env.NODE_ENV === "production"
            ? undefined
            : await import("vite").then((vite) =>
                vite.createServer({
                  server: { middlewareMode: true },
                })
              );

        const app = express();

        app.use(express.json());
        app.use(express.urlencoded());

        if (viteDevServer) {
          app.use(viteDevServer.middlewares);
        } else {
          app.use(
            "/assets",
            express.static("build/client/assets", { immutable: true, maxAge: "1y" })
          );
        }
        app.use(express.static("build/client", { maxAge: "1h" }));

        app.all(
          "*",
          createRequestHandler({
            build: viteDevServer
              ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
              : await import("./build/index.js"),
            getLoadContext: () => ({}),
          })
        );

        const port = ${port};
        app.listen(port, () => console.log('http://localhost:' + port));
      `,
    });
    stop = await customDev({ cwd, port });
  });

  test.afterAll(() => stop());

  test("action with formData read", async ({ page }) => {
    await page.goto(`http://localhost:${port}`, {
      waitUntil: "networkidle",
    });

    await page.locator("#submit-post-csr").click();

    let actionData = JSON.parse(await page.locator("#action-data").innerHTML());
    expect(actionData.body).toEqual({ type: "csr" });
  });
});
