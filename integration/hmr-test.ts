import fs from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";
import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";
import execa from "execa";
import getPort from "get-port";

import type { FixtureInit } from "./helpers/create-fixture.js";
import { createFixtureProject, css, js } from "./helpers/create-fixture.js";
import { killtree } from "./helpers/killtree.js";

test.setTimeout(150_000);

let files = {
  "postcss.config.cjs": js`
      module.exports = {
        plugins: {
          "postcss-import": {}, // Testing PostCSS cache invalidation
          tailwindcss: {},
        }
      };
    `,

  "tailwind.config.js": js`
      /** @type {import('tailwindcss').Config} */
      export default {
        content: ["./app/**/*.{ts,tsx,jsx,js}"],
        theme: {
          extend: {},
        },
        plugins: [],
      };
    `,

  "app/tailwind.css": css`
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `,

  "app/stylesWithImport.css": css`
    @import "./importedStyle.css";
  `,

  "app/importedStyle.css": css`
    .importedStyle {
      font-weight: normal;
    }
  `,

  "app/sideEffectStylesWithImport.css": css`
    @import "./importedSideEffectStyle.css";
  `,

  "app/importedSideEffectStyle.css": css`
    .importedSideEffectStyle {
      font-size: initial;
    }
  `,

  "app/style.module.css": css`
    .test {
      composes: color from "./composedStyle.module.css";
    }
  `,

  "app/composedStyle.module.css": css`
    .color {
      color: initial;
    }
  `,

  "app/root.tsx": js`
      import type { LinksFunction } from "@remix-run/node";
      import { Link, Links, LiveReload, Meta, Outlet, Scripts } from "@remix-run/react";
      import { cssBundleHref } from "@remix-run/css-bundle";

      import Counter from "./components/counter";
      import tailwindStyles from "./tailwind.css";
      import stylesWithImport from "./stylesWithImport.css";
      import "./sideEffectStylesWithImport.css";

      export const links: LinksFunction = () => [
        { rel: "stylesheet", href: tailwindStyles },
        { rel: "stylesheet", href: stylesWithImport },
        ...cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : [],
      ];

      // dummy loader to make sure that HDR is granular
      export const loader = () => {
        return null;
      };

      export default function Root() {
        return (
          <html lang="en" className="h-full">
            <head>
              <Meta />
              <Links />
            </head>
            <body className="h-full">
              <header>
                <label htmlFor="root-input">Root Input</label>
                <input id="root-input" />
                <Counter id="root-counter" />
                <nav>
                  <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/mdx">MDX</Link></li>
                  </ul>
                </nav>
              </header>
              <Outlet />
              <Scripts />
              <LiveReload />
            </body>
          </html>
        );
      }
    `,

  "app/routes/_index.tsx": js`
      import { useLoaderData } from "@remix-run/react";
      export function shouldRevalidate(args) {
        return true;
      }
      export default function Index() {
        const t = useLoaderData();
        return (
          <main>
            <h1>Index Title</h1>
          </main>
        )
      }
    `,

  "app/routes/about.tsx": js`
      import Counter from "../components/counter";
      export default function About() {
        return (
          <main>
            <h1>About Title</h1>
            <Counter id="about-counter" />
          </main>
        )
      }
    `,
  "app/routes/mdx.mdx": `import { useLoaderData } from '@remix-run/react'
export const loader = () => "crazy"
export const Component = () => {
  const data = useLoaderData()
  return <h1 id={data}>{data}</h1>
}

# heyo
whatsup

<Component/>
`,
  "app/components/counter.tsx": js`
      import * as React from "react";
      export default function Counter({ id }) {
        let [count, setCount] = React.useState(0);
        return (
          <p>
            <button id={id} onClick={() => setCount(count + 1)}>inc {count}</button>
          </p>
        );
      }
    `,
};

let customServer = (options: { appPort: number; devReady: string }) => {
  return js`
      import path from "node:path";
      import url from "node:url";
      import express from "express";
      import { createRequestHandler } from "@remix-run/express";
      import { ${options.devReady}, installGlobals } from "@remix-run/node";

      installGlobals();

      const app = express();
      app.use(express.static("public", { immutable: true, maxAge: "1y" }));

      const BUILD_PATH = url.pathToFileURL(path.join(process.cwd(), "build", "index.js"));

      app.all(
        "*",
        createRequestHandler({
          build: await import(BUILD_PATH),
          mode: process.env.NODE_ENV,
        })
      );

      let port = ${options.appPort};
      app.listen(port, async () => {
        let build = await import(BUILD_PATH);
        console.log('✅ app ready: http://localhost:' + port);
        if (process.env.NODE_ENV === 'development') {
          ${options.devReady}(build);
        }
      });
  `;
};

let HMR_TIMEOUT_MS = 30_000;

let remix = "node ./node_modules/@remix-run/dev/dist/cli.js";
let serve = "node ./node_modules/@remix-run/serve/dist/cli.js";

test("HMR for remix-serve", async ({ page }) => {
  await dev(page, (appPort) => ({
    files,
    devScript: `PORT=${appPort} ${remix} dev --manual -c "${serve} ./build/index.js"`,
    appReadyPattern: /\[remix-serve\] /,
  }));
});

test("HMR for custom server with broadcast", async ({ page }) => {
  await dev(page, (appPort) => ({
    files: {
      ...files,
      "server.js": customServer({
        appPort,
        devReady: "broadcastDevReady",
      }),
    },
    devScript: `${remix} dev -c "node ./server.js"`,
    appReadyPattern: /✅ app ready: /,
  }));
});

test("HMR for custom server with log", async ({ page }) => {
  await dev(page, (appPort) => ({
    files: {
      ...files,
      "server.js": customServer({
        appPort,
        devReady: "logDevReady",
      }),
    },
    devScript: `${remix} dev -c "node ./server.js"`,
    appReadyPattern: /✅ app ready: /,
  }));
});

async function dev(
  page: Page,
  getOptions: (appPort: number) => {
    files: Record<string, string>;
    devScript: string;
    appReadyPattern: RegExp;
  }
) {
  // uncomment for debugging
  // page.on("console", (msg) => console.log(msg.text()));
  page.on("pageerror", logConsoleError);
  let dataRequests = 0;
  page.on("request", (request) => {
    let url = new URL(request.url());
    if (url.searchParams.has("_data")) {
      dataRequests++;
    }
  });

  let appPort = await getPort();
  let devPort = await getPort();

  let options = getOptions(appPort);

  let fixture: FixtureInit = {
    compiler: "remix",
    config: {
      dev: {
        port: devPort,
      },
    },
    files: options.files,
  };

  let projectDir = await createFixtureProject(fixture);

  // inject dev script
  let pkgJson = JSON.parse(
    fs.readFileSync(path.join(projectDir, "package.json"), "utf8")
  );
  pkgJson.scripts.dev = options.devScript;
  fs.writeFileSync(
    path.join(projectDir, "package.json"),
    JSON.stringify(pkgJson, null, 2)
  );

  let devProc = execa("pnpm", ["run", "dev"], { cwd: projectDir });
  let devStdout = bufferize(devProc.stdout!);
  let devStderr = bufferize(devProc.stderr!);

  try {
    await wait(
      () => {
        if (devProc.exitCode) throw Error("Dev server exited early");
        return options.appReadyPattern.test(devStdout());
      },
      { timeoutMs: HMR_TIMEOUT_MS }
    );
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: "networkidle",
    });

    // `<input />` value as page state that
    // would be wiped out by a full page refresh
    // but should be persisted by hmr
    let input = page.getByLabel("Root Input");
    expect(input).toBeVisible();
    await input.type("asdfasdf");

    let counter = await page.waitForSelector("#root-counter");
    await counter.click();
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    let indexPath = path.join(projectDir, "app", "routes", "_index.tsx");
    let originalIndex = fs.readFileSync(indexPath, "utf8");
    let counterPath = path.join(projectDir, "app", "components", "counter.tsx");
    let originalCounter = fs.readFileSync(counterPath, "utf8");
    let importedStylePath = path.join(projectDir, "app", "importedStyle.css");
    let originalImportedStyle = fs.readFileSync(importedStylePath, "utf8");
    let composedCssModulePath = path.join(
      projectDir,
      "app",
      "composedStyle.module.css"
    );
    let originalComposedCssModule = fs.readFileSync(
      composedCssModulePath,
      "utf8"
    );
    let mdxPath = path.join(projectDir, "app", "routes", "mdx.mdx");
    let originalMdx = fs.readFileSync(mdxPath, "utf8");
    let importedSideEffectStylePath = path.join(
      projectDir,
      "app",
      "importedSideEffectStyle.css"
    );
    let originalImportedSideEffectStyle = fs.readFileSync(
      importedSideEffectStylePath,
      "utf8"
    );

    // make content and style changed to index route
    let newComposedCssModule = `
      .color {
        background: black;
        color: white;
      }
    `;
    fs.writeFileSync(composedCssModulePath, newComposedCssModule);

    // make changes to imported styles
    let newImportedStyle = `
      .importedStyle {
        font-weight: 800;
      }
    `;
    fs.writeFileSync(importedStylePath, newImportedStyle);

    // // make changes to imported side effect styles
    let newImportedSideEffectStyle = `
      .importedSideEffectStyle {
        font-size: 32px;
      }
    `;
    fs.writeFileSync(importedSideEffectStylePath, newImportedSideEffectStyle);

    // change text, add updated styles, add new Tailwind class ("italic")
    let newIndex = `
      import { useLoaderData } from "@remix-run/react";
      import styles from "~/style.module.css";
      export function shouldRevalidate(args) {
        return true;
      }
      export default function Index() {
        const t = useLoaderData();
        return (
          <main>
            <h1 className={styles.test + ' italic importedStyle importedSideEffectStyle'}>Changed</h1>
          </main>
        )
      }
    `;
    fs.writeFileSync(indexPath, newIndex);

    // detect HMR'd content and style changes
    await page.waitForLoadState("networkidle");

    let h1 = page.getByText("Changed");
    await h1.waitFor({ timeout: HMR_TIMEOUT_MS });
    expect(h1).toHaveCSS("color", "rgb(255, 255, 255)");
    expect(h1).toHaveCSS("background-color", "rgb(0, 0, 0)");
    expect(h1).toHaveCSS("font-style", "italic");
    expect(h1).toHaveCSS("font-weight", "800");
    expect(h1).toHaveCSS("font-size", "32px");

    // verify that `<input />` value was persisted (i.e. hmr, not full page refresh)
    expect(await page.getByLabel("Root Input").inputValue()).toBe("asdfasdf");
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    // undo change
    fs.writeFileSync(indexPath, originalIndex);
    fs.writeFileSync(importedStylePath, originalImportedStyle);
    fs.writeFileSync(composedCssModulePath, originalComposedCssModule);
    fs.writeFileSync(
      importedSideEffectStylePath,
      originalImportedSideEffectStyle
    );
    await page.getByText("Index Title").waitFor({ timeout: HMR_TIMEOUT_MS });
    expect(await page.getByLabel("Root Input").inputValue()).toBe("asdfasdf");
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    // We should not have done any revalidation yet as only UI has changed
    expect(dataRequests).toBe(0);

    // add loader
    let withLoader1 = `
      import { json } from "@remix-run/node";
      import { useLoaderData } from "@remix-run/react";

      export let loader = () => json({ hello: "world" });

      export function shouldRevalidate(args) {
        return true;
      }
      export default function Index() {
        let { hello } = useLoaderData<typeof loader>();
        return (
          <main>
            <h1>Hello, {hello}</h1>
          </main>
        )
      }
    `;
    fs.writeFileSync(indexPath, withLoader1);
    await expect.poll(() => dataRequests, { timeout: HMR_TIMEOUT_MS }).toBe(1);
    await page.waitForLoadState("networkidle");

    await page.getByText("Hello, world").waitFor({ timeout: HMR_TIMEOUT_MS });
    expect(await page.getByLabel("Root Input").inputValue()).toBe("asdfasdf");
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    let withLoader2 = `
      import { json } from "@remix-run/node";
      import { useLoaderData } from "@remix-run/react";

      export function loader() {
        return json({ hello: "planet" })
      }

      export function shouldRevalidate(args) {
        return true;
      }
      export default function Index() {
        let { hello } = useLoaderData<typeof loader>();
        return (
          <main>
            <h1>Hello, {hello}</h1>
          </main>
        )
      }
    `;
    fs.writeFileSync(indexPath, withLoader2);

    await expect.poll(() => dataRequests, { timeout: HMR_TIMEOUT_MS }).toBe(2);

    await page.waitForLoadState("networkidle");

    await page.getByText("Hello, planet").waitFor({ timeout: HMR_TIMEOUT_MS });
    expect(await page.getByLabel("Root Input").inputValue()).toBe("asdfasdf");
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    // change shared component
    let updatedCounter = `
      import * as React from "react";
      export default function Counter({ id }) {
        let [count, setCount] = React.useState(0);
        return (
          <p>
            <button id={id} onClick={() => setCount(count - 1)}>dec {count}</button>
          </p>
        );
      }
    `;
    fs.writeFileSync(counterPath, updatedCounter);
    await page.waitForSelector(`#root-counter:has-text("dec 1")`);
    counter = await page.waitForSelector("#root-counter");
    await counter.click();
    await counter.click();
    await page.waitForSelector(`#root-counter:has-text("dec -1")`);

    await page.click(`a[href="/about"]`);
    let aboutCounter = await page.waitForSelector(
      `#about-counter:has-text("dec 0")`
    );
    await aboutCounter.click();
    await page.waitForSelector(`#about-counter:has-text("dec -1")`);

    // undo change
    fs.writeFileSync(counterPath, originalCounter);

    counter = await page.waitForSelector(`#root-counter:has-text("inc -1")`);
    await counter.click();
    counter = await page.waitForSelector(`#root-counter:has-text("inc 0")`);

    aboutCounter = await page.waitForSelector(
      `#about-counter:has-text("inc -1")`
    );
    await aboutCounter.click();
    aboutCounter = await page.waitForSelector(
      `#about-counter:has-text("inc 0")`
    );

    expect(dataRequests).toBe(2);

    // mdx
    await page.click(`a[href="/mdx"]`);
    await page.waitForSelector(`#crazy`);
    let mdx = `import { useLoaderData } from '@remix-run/react'
export const loader = () => "hot"
export const Component = () => {
  const data = useLoaderData()
  return <h1 id={data}>{data}</h1>
}

# heyo
whatsup

<Component/>
`;
    fs.writeFileSync(mdxPath, mdx);
    await expect.poll(() => dataRequests, { timeout: HMR_TIMEOUT_MS }).toBe(4);
    await page.waitForSelector(`#hot`);

    fs.writeFileSync(mdxPath, originalMdx);
    await expect.poll(() => dataRequests, { timeout: HMR_TIMEOUT_MS }).toBe(5);
    await page.waitForSelector(`#crazy`);

    // dev server doesn't crash when rebuild fails
    await page.click(`a[href="/"]`);
    await page.getByText("Hello, planet").waitFor({ timeout: HMR_TIMEOUT_MS });
    await page.waitForLoadState("networkidle");

    let stderr = devStderr();
    let withSyntaxError = `
      import { useLoaderData } from "@remix-run/react";
      export function shouldRevalidate(args) {
        return true;
      }
      eport efault functio Index() {
        const t = useLoaderData();
        return (
          <mai>
            <h1>With Syntax Error</h1>
          </main>
        )
      }
    `;
    fs.writeFileSync(indexPath, withSyntaxError);
    await wait(
      () =>
        devStderr()
          .replace(stderr, "")
          .includes('Expected ";" but found "efault"'),
      {
        timeoutMs: HMR_TIMEOUT_MS,
      }
    );

    // React Router integration w/ React Refresh has a bug where sometimes rerenders happen with old UI and new data
    // in this case causing `TypeError: Cannot destructure property`.
    // Need to fix that bug, but it only shows a harmless console error in the browser in dev
    page.removeListener("pageerror", logConsoleError);
    // let expectedErrorCount = 0;
    let expectDestructureTypeError = expectConsoleError((error) => {
      let expectedMessage = new Set([
        // chrome, msedge
        "Cannot destructure property 'hello' of 'useLoaderData(...)' as it is null.",
        // firefox
        "(intermediate value)() is null",
        // webkit
        "Right side of assignment cannot be destructured",
      ]);
      let isExpected =
        error.name === "TypeError" && expectedMessage.has(error.message);
      // if (isExpected) expectedErrorCount += 1;
      return isExpected;
    });
    page.on("pageerror", expectDestructureTypeError);

    let withFix = `
      import { useLoaderData } from "@remix-run/react";
      export function shouldRevalidate(args) {
        return true;
      }
      export default function Index() {
        // const t = useLoaderData();
        return (
          <main>
            <h1>With Fix</h1>
          </main>
        )
      }
    `;
    fs.writeFileSync(indexPath, withFix);
    await page.waitForLoadState("networkidle");
    await page.getByText("With Fix").waitFor({ timeout: HMR_TIMEOUT_MS });

    // Restore normal console error handling
    page.removeListener("pageerror", expectDestructureTypeError);
    // expect(expectedErrorCount).toBe(browserName === "webkit" ? 1 : 2);
    page.addListener("pageerror", logConsoleError);
  } catch (e) {
    console.log("stdout begin -----------------------");
    console.log(devStdout());
    console.log("stdout end -------------------------");

    console.log("stderr begin -----------------------");
    console.log(devStderr());
    console.log("stderr end -------------------------");
    throw e;
  } finally {
    devProc.pid && (await killtree(devProc.pid));
  }
}

let sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let wait = async (
  callback: () => boolean,
  { timeoutMs = 1000, intervalMs = 250 } = {}
) => {
  let start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    if (callback()) {
      return;
    }
    await sleep(intervalMs);
  }
  throw Error(`wait: timeout ${timeoutMs}ms`);
};

let bufferize = (stream: Readable): (() => string) => {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
};

let logConsoleError = (error: Error) => {
  console.error(`[console] ${error.name}: ${error.message}`);
};

let expectConsoleError = (
  isExpected: (error: Error) => boolean,
  unexpected = logConsoleError
) => {
  return (error: Error) => {
    if (isExpected(error)) {
      return;
    }
    unexpected(error);
  };
};
