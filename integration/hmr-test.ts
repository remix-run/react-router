import { test, expect } from "@playwright/test";
import execa from "execa";
import fs from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";
import getPort, { makeRange } from "get-port";

import { createFixtureProject, css, js, json } from "./helpers/create-fixture";

let fixture = (options: { port: number; appServerPort: number }) => ({
  future: {
    unstable_dev: {
      port: options.port,
      appServerPort: options.appServerPort,
    },
    unstable_tailwind: true,
    v2_routeConvention: true,
    v2_errorBoundary: true,
  },
  files: {
    "package.json": json({
      private: true,
      sideEffects: false,
      scripts: {
        "dev:remix": `cross-env NODE_ENV=development node ./node_modules/@remix-run/dev/dist/cli.js dev`,
        "dev:app": `cross-env NODE_ENV=development nodemon --watch build/ ./server.js`,
      },
      dependencies: {
        "@remix-run/node": "0.0.0-local-version",
        "@remix-run/react": "0.0.0-local-version",
        "cross-env": "0.0.0-local-version",
        express: "0.0.0-local-version",
        isbot: "0.0.0-local-version",
        nodemon: "0.0.0-local-version",
        react: "0.0.0-local-version",
        "react-dom": "0.0.0-local-version",
        tailwindcss: "0.0.0-local-version",
      },
      devDependencies: {
        "@remix-run/dev": "0.0.0-local-version",
        "@types/react": "0.0.0-local-version",
        "@types/react-dom": "0.0.0-local-version",
        typescript: "0.0.0-local-version",
      },
      engines: {
        node: ">=14",
      },
    }),

    "server.js": js`
      let path = require("path");
      let express = require("express");
      let { createRequestHandler } = require("@remix-run/express");

      const app = express();
      app.use(express.static("public", { immutable: true, maxAge: "1y" }));

      const MODE = process.env.NODE_ENV;
      const BUILD_DIR = path.join(process.cwd(), "build");

      app.all(
        "*",
        createRequestHandler({
          build: require(BUILD_DIR),
          mode: MODE,
        })
      );

      let port = ${options.appServerPort};
      app.listen(port, () => {
        require(BUILD_DIR);
        console.log('✅ app ready: http://localhost:' + port);
      });
    `,

    "tailwind.config.js": js`
      /** @type {import('tailwindcss').Config} */
      module.exports = {
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

    "app/root.tsx": js`
      import type { LinksFunction } from "@remix-run/node";
      import { Link, Links, LiveReload, Meta, Outlet, Scripts } from "@remix-run/react";

      import Counter from "./components/counter";
      import styles from "./tailwind.css";

      export const links: LinksFunction = () => [
        { rel: "stylesheet", href: styles },
      ];

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
  },
});

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

test("HMR", async ({ page }) => {
  // uncomment for debugging
  // page.on("console", (msg) => console.log(msg.text()));
  page.on("pageerror", (err) => console.log(err.message));

  let appServerPort = await getPort({ port: makeRange(3080, 3089) });
  let port = await getPort({ port: makeRange(3090, 3099) });
  let projectDir = await createFixtureProject(fixture({ port, appServerPort }));

  // spin up dev server
  let dev = execa("npm", ["run", "dev:remix"], { cwd: projectDir });
  let devStdout = bufferize(dev.stdout!);
  let devStderr = bufferize(dev.stderr!);
  await wait(
    () => {
      let stderr = devStderr();
      if (stderr.length > 0) throw Error(stderr);
      return /💿 Built in /.test(devStdout());
    },
    { timeoutMs: 10_000 }
  );

  // spin up app server
  let app = execa("npm", ["run", "dev:app"], { cwd: projectDir });
  let appStdout = bufferize(app.stdout!);
  let appStderr = bufferize(app.stderr!);
  await wait(
    () => {
      let stderr = appStderr();
      if (stderr.length > 0) throw Error(stderr);
      return /✅ app ready: /.test(appStdout());
    },
    {
      timeoutMs: 10_000,
    }
  );

  try {
    await page.goto(`http://localhost:${appServerPort}`, {
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

    // make content and style changed to index route
    let newIndex = `
      import { useLoaderData } from "@remix-run/react";
      export default function Index() {
        const t = useLoaderData();
        return (
          <main>
            <h1 className="text-white bg-black">Changed</h1>
          </main>
        )
      }
    `;
    fs.writeFileSync(indexPath, newIndex);

    // detect HMR'd content and style changes
    await page.waitForLoadState("networkidle");
    let h1 = page.getByText("Changed");
    await h1.waitFor({ timeout: 2000 });
    expect(h1).toHaveCSS("color", "rgb(255, 255, 255)");
    expect(h1).toHaveCSS("background-color", "rgb(0, 0, 0)");

    // verify that `<input />` value was persisted (i.e. hmr, not full page refresh)
    expect(await page.getByLabel("Root Input").inputValue()).toBe("asdfasdf");
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    // undo change
    fs.writeFileSync(indexPath, originalIndex);
    await page.getByText("Index Title").waitFor({ timeout: 2000 });
    expect(await page.getByLabel("Root Input").inputValue()).toBe("asdfasdf");
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    // add loader
    let withLoader1 = `
      import { json } from "@remix-run/node";
      import { useLoaderData } from "@remix-run/react";

      export let loader = () => json({ hello: "world" })

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
    await page.getByText("Hello, world").waitFor({ timeout: 2000 });
    expect(await page.getByLabel("Root Input").inputValue()).toBe("asdfasdf");
    await page.waitForSelector(`#root-counter:has-text("inc 1")`);

    let withLoader2 = `
      import { json } from "@remix-run/node";
      import { useLoaderData } from "@remix-run/react";

      export function loader() {
        return json({ hello: "planet" })
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
    await page.getByText("Hello, planet").waitFor({ timeout: 2000 });
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
  } finally {
    dev.kill();
    app.kill();
    console.log(devStderr());
    console.log(appStderr());
  }
});
