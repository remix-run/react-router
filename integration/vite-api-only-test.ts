import { test, expect } from "@playwright/test";
import getPort from "get-port";
import {
  createRequestHandler,
  UNSAFE_ServerMode as ServerMode,
} from "react-router";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { dev, reactRouterConfig } from "./helpers/vite.js";
import { spawnTestServer } from "./helpers/create-fixture.js";

test.describe("API-only Mode", () => {
  test.describe.configure({ mode: "serial" });

  let fixture: Fixture;
  let appFixture: AppFixture | undefined;
  let stopDev: (() => unknown) | undefined;
  let stopServe: (() => unknown) | undefined;
  let devPort: number;
  let servePort: number;

  test.beforeAll(async () => {
    devPort = await getPort();
    fixture = await createFixture({
      port: devPort,
      files: {
        "react-router.config.ts": reactRouterConfig({
          ssr: "unstable_api-only",
        }),
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";

          export function loader() {
            return { server: "root-loader" };
          }

          export default function Index({ loaderData }) {
            return (
              <>
                <p data-root-loader>{loaderData.server}</p>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/loader-only">Loader only</Link>
              </>
            );
          }
        `,
        "app/routes/loader-only.tsx": js`
          export async function loader() {
            return { server: "loader-only" };
          }

          export default function LoaderOnly({ loaderData }) {
            return <p data-loader-only>{loaderData.server}</p>;
          }
        `,
        "app/routes/dashboard.tsx": js`
          import { Form, Link } from "react-router";

          export async function loader() {
            return { server: "server-loader" };
          }

          export async function action() {
            return { action: "server-action" };
          }

          export async function clientLoader({ serverLoader }) {
            let data = await serverLoader();
            return { ...data, client: "client-loader" };
          }

          export async function clientAction({ serverAction }) {
            let data = await serverAction();
            return { ...data, client: "client-action" };
          }

          export default function Dashboard({ loaderData, actionData }) {
            return (
              <>
                <p data-server>{loaderData.server}</p>
                <p data-client>{loaderData.client}</p>
                <p data-action>
                  {actionData?.action ?? ""}:{actionData?.client ?? ""}
                </p>
                <Form method="post">
                  <button type="submit">Submit</button>
                </Form>
                <Link to="/">Home</Link>
              </>
            );
          }
        `,
      },
    });
  });

  async function startServe() {
    servePort = await getPort();
    let serveServer = await spawnTestServer({
      cwd: fixture.projectDir,
      command: [
        process.argv[0],
        "node_modules/@react-router/serve/dist/cli.js",
        "build/server/index.js",
      ],
      env: {
        NODE_ENV: "production",
        PORT: String(servePort),
      },
      regex: new RegExp(`react-router-serve.*localhost:${servePort}\\s`),
    });
    stopServe = serveServer.stop;
  }

  async function startDev() {
    stopDev = await dev({
      cwd: fixture.projectDir,
      port: devPort,
    });
  }

  async function startApp() {
    appFixture = await createAppFixture(fixture);
  }

  async function stopServers() {
    stopServe?.();
    stopServe = undefined;
    stopDev?.();
    stopDev = undefined;
    await appFixture?.close();
    appFixture = undefined;
  }

  test.afterEach(stopServers);
  test.afterAll(stopServers);

  test("builds an API-only server with server APIs but no route UI exports", async () => {
    expect(fixture.build?.unstable_apiOnly).toBe(true);

    let route = fixture.build?.routes["routes/dashboard"];
    expect(route?.module.loader).toEqual(expect.any(Function));
    expect(route?.module.action).toEqual(expect.any(Function));
    expect(route?.module.default).toBeUndefined();
    expect(route?.module.clientLoader).toBeUndefined();
    expect(route?.module.clientAction).toBeUndefined();
  });

  test("handles server data requests and rejects document requests", async () => {
    await startServe();

    let loaderData = await fixture.requestSingleFetchData("/dashboard.data");
    expect(loaderData.status).toBe(200);
    expect(loaderData.data).toMatchObject({
      "routes/dashboard": { data: { server: "server-loader" } },
    });

    let actionData = await fixture.requestSingleFetchData("/dashboard.data", {
      method: "POST",
      body: new URLSearchParams(),
    });
    expect(actionData.status).toBe(200);
    expect(actionData.data).toMatchObject({
      data: { action: "server-action" },
    });

    let documentResponse = await fixture.requestDocument("/dashboard");
    expect(documentResponse.status).toBe(404);

    let serveDocumentResponse = await fetch(`http://localhost:${servePort}/`);
    expect(serveDocumentResponse.status).toBe(200);
    expect(await serveDocumentResponse.text()).toContain(
      "window.__reactRouterContext",
    );

    let serveAssetResponse = await fetch(
      `http://localhost:${servePort}${fixture.build!.assets.entry.module}`,
    );
    expect(serveAssetResponse.status).toBe(200);
  });

  test("handles document requests in development mode", async () => {
    let build = fixture.build;
    expect(build).not.toBeNull();

    let response = await createRequestHandler(
      build!,
      ServerMode.Development,
    )(new Request("http://localhost/"));
    expect(response.status).toBe(200);
  });

  test("does not produce a hydration error in development mode", async ({
    page,
  }) => {
    await startDev();

    let errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`http://localhost:${devPort}/`);
    await expect(page.locator("[data-root-loader]")).toHaveText("root-loader");
    await page.waitForTimeout(1000);
    expect(errors.filter((error) => error.includes("Hydration"))).toEqual([]);
  });

  test("navigates and runs clientLoader through serverLoader", async ({
    page,
  }) => {
    await startApp();

    let app = new PlaywrightFixture(appFixture!, page);
    await app.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await app.clickLink("/dashboard");

    await expect(page.locator("[data-server]")).toHaveText("server-loader");
    await expect(page.locator("[data-client]")).toHaveText("client-loader");
    await app.clickLink("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await app.clickLink("/loader-only");
    await expect(page.locator("[data-loader-only]")).toHaveText("loader-only");
  });

  test("submits a Form through clientAction to the server action", async ({
    page,
  }) => {
    await startApp();

    let app = new PlaywrightFixture(appFixture!, page);
    await app.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await app.clickLink("/dashboard");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.locator("[data-action]")).toHaveText(
      "server-action:client-action",
    );
  });
});
