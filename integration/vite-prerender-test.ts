import fs from "node:fs";
import path from "node:path";
import { PassThrough } from "node:stream";
import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { build, createProject, reactRouterConfig } from "./helpers/vite.js";

let files = {
  "react-router.config.ts": reactRouterConfig({
    prerender: true,
  }),
  "vite.config.ts": js`
    import { defineConfig } from "vite";
    import { reactRouter } from "@react-router/dev/vite";

    export default defineConfig({
      build: { manifest: true },
      plugins: [
        reactRouter()
      ],
    });
  `,
  "app/root.tsx": js`
    import * as React from "react";
    import { Link, Links, Meta, Outlet, Scripts, useRouteError } from "react-router";

    export function meta({ data }) {
      return [{
        title: "Root Title"
      }];
    }

    export function Layout({ children }) {
      const [mounted, setMounted] = React.useState(false);
      React.useEffect(() => setMounted(true), []);
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <h1>Root</h1>
            {!mounted ? <h3>Unmounted</h3> : <h3 data-mounted>Mounted</h3>}
            <nav>
            <Link to="/">Home</Link><br/>
            <Link to="/about">About</Link><br/>
            <Link to="/not-found">Not Found</Link><br/>
            </nav>
            {children}
            <Scripts />
          </body>
        </html>
      );
    }

    export default function Root() {
      return <Outlet />
    }

    export function ErrorBoundary() {
      let error = useRouteError();
      let msg = 'status' in error ?
        error.status + " " + error.statusText :
        error.message;
      return <p data-error>{msg}</p>;
    }

    export function HydrateFallback() {
      return <p>Loading...</p>;
    }
  `,
  "app/routes/_index.tsx": js`
    import * as React  from "react";
    import { useLoaderData } from "react-router";

    export function meta({ data }) {
      return [{
        title: "Index Title: " + data
      }];
    }

    export async function loader() {
      return "Index Loader Data";
    }

    export default function Component() {
      let data = useLoaderData();

      return (
        <>
          <h2 data-route>Index</h2>
          <p data-loader-data>{data}</p>
        </>
      );
    }
  `,
  "app/routes/about.tsx": js`
    import { useActionData, useLoaderData } from "react-router";

    export function meta({ data }) {
      return [{
        title: "About Title: " + data
      }];
    }

    export async function loader() {
      return "About Loader Data";
    }

    export default function Component() {
      let data = useLoaderData();

      return (
        <>
          <h2 data-route>About</h2>
          <p data-loader-data>{data}</p>
        </>
      );
    }
  `,
};

function listAllFiles(_dir: string) {
  let files: string[] = [];

  function recurse(dir: string) {
    fs.readdirSync(dir).forEach((file) => {
      // Join with posix separator for consistency
      const absolute = dir + "/" + file;
      if (fs.statSync(absolute).isDirectory()) {
        if (![".vite", "assets"].includes(file)) {
          return recurse(absolute);
        }
      } else {
        return files.push(absolute);
      }
    });
  }

  recurse(_dir);

  // Normalize *nix/windows paths
  return files.map((f) => f.replace(_dir, "").replace(/^\//, ""));
}

test.describe("Prerendering", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.afterAll(() => {
    appFixture?.close();
  });

  test.describe("prerendered file behavior (agnostic of ssr flag)", () => {
    test("Prerenders known static routes when true is specified", async () => {
      let buildStdio = new PassThrough();
      fixture = await createFixture({
        buildStdio,
        prerender: true,
        files: {
          ...files,
          "app/routes/parent.tsx": js`
          import { Outlet } from 'react-router'
          export default function Component() {
            return <Outlet/>
          }
        `,
          "app/routes/parent.child.tsx": js`
          import { Outlet } from 'react-router'
          export function loader() {
            return null;
          }
          export default function Component() {
            return <Outlet/>
          }
        `,
          "app/routes/$slug.tsx": js`
          import { Outlet } from 'react-router'
          export function loader() {
            return null;
          }
          export default function Component() {
            return <Outlet/>
          }
        `,
          "app/routes/$.tsx": js`
          import { Outlet } from 'react-router'
          export function loader() {
            return null;
          }
          export default function Component() {
            return <Outlet/>
          }
        `,
        },
      });

      appFixture = await createAppFixture(fixture);

      let clientDir = path.join(fixture.projectDir, "build", "client");
      expect(listAllFiles(clientDir).sort()).toEqual([
        "_root.data",
        "about.data",
        "about/index.html",
        "favicon.ico",
        "index.html",
        "parent/child.data",
        "parent/child/index.html",
        "parent/index.html",
      ]);

      let res = await fixture.requestDocument("/");
      let html = await res.text();
      expect(html).toMatch("<title>Index Title: Index Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">Index</h2>');
      expect(html).toMatch('<p data-loader-data="true">Index Loader Data</p>');

      res = await fixture.requestDocument("/about");
      html = await res.text();
      expect(html).toMatch("<title>About Title: About Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">About</h2>');
      expect(html).toMatch('<p data-loader-data="true">About Loader Data</p>');
    });

    test("Prerenders a static array of routes", async () => {
      fixture = await createFixture({
        prerender: true,
        files: {
          ...files,
          "react-router.config.ts": js`
          export default {
            async prerender() {
              await new Promise(r => setTimeout(r, 1));
              return ['/', '/about'];
            },
          }
        `,
          "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [
              reactRouter()
            ],
          });
        `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let clientDir = path.join(fixture.projectDir, "build", "client");
      expect(listAllFiles(clientDir).sort()).toEqual([
        "_root.data",
        "about.data",
        "about/index.html",
        "favicon.ico",
        "index.html",
      ]);

      let res = await fixture.requestDocument("/");
      let html = await res.text();
      expect(html).toMatch("<title>Index Title: Index Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">Index</h2>');
      expect(html).toMatch('<p data-loader-data="true">Index Loader Data</p>');

      res = await fixture.requestDocument("/about");
      html = await res.text();
      expect(html).toMatch("<title>About Title: About Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">About</h2>');
      expect(html).toMatch('<p data-loader-data="true">About Loader Data</p>');
    });

    test("Prerenders a dynamic array of routes based on the static routes", async () => {
      fixture = await createFixture({
        files: {
          ...files,
          "react-router.config.ts": js`
          export default {
            async prerender({ getStaticPaths }) {
              return [...getStaticPaths(), "/a", "/b"];
            },
          }
        `,
          "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [reactRouter()],
          });
        `,
          "app/routes/$slug.tsx": js`
          export function loader() {
            return null
          }
          export default function component() {
            return null;
          }
        `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let clientDir = path.join(fixture.projectDir, "build", "client");
      expect(listAllFiles(clientDir).sort()).toEqual([
        "_root.data",
        "a.data",
        "a/index.html",
        "about.data",
        "about/index.html",
        "b.data",
        "b/index.html",
        "favicon.ico",
        "index.html",
      ]);

      let res = await fixture.requestDocument("/");
      let html = await res.text();
      expect(html).toMatch("<title>Index Title: Index Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">Index</h2>');
      expect(html).toMatch('<p data-loader-data="true">Index Loader Data</p>');

      res = await fixture.requestDocument("/about");
      html = await res.text();
      expect(html).toMatch("<title>About Title: About Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">About</h2>');
      expect(html).toMatch('<p data-loader-data="true">About Loader Data</p>');
    });

    test("Skips action-only resource routes prerender:true", async () => {
      let buildStdio = new PassThrough();
      fixture = await createFixture({
        buildStdio,
        files: {
          "react-router.config.ts": reactRouterConfig({
            prerender: true,
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": files["app/root.tsx"],
          "app/routes/_index.tsx": files["app/routes/_index.tsx"],
          "app/routes/action.tsx": js`
            export function action() {
              return null
            }
          `,
        },
      });

      let buildOutput: string;
      let chunks: Buffer[] = [];
      buildOutput = await new Promise<string>((resolve, reject) => {
        buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        buildStdio.on("error", (err) => reject(err));
        buildStdio.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf8"))
        );
      });

      expect(buildOutput).toContain(
        "⚠️ Skipping prerendering for resource route without a loader: routes/action"
      );
      // Only logs once
      expect(buildOutput.match(/routes\/action/g)?.length).toBe(1);
    });

    test("Pre-renders resource routes with file extensions", async () => {
      const base64Png =
        "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";
      fixture = await createFixture({
        prerender: true,
        files: {
          ...files,
          "app/routes/text[.txt].tsx": js`
          export function loader() {
            return new Response("Hello, world");
          }
        `,
          "app/routes/json[.json].tsx": js`
          export function loader() {
            return new Response(JSON.stringify({ hello: 'world' }), {
              headers: {
                'Content-Type': 'application/json',
              }
            });
          }
        `,
          "app/routes/image[.png].tsx": js`
            export function loader() {
              return new Response(
                Buffer.from("${base64Png}", 'base64'),
                {
                  headers: {
                    'Content-Type': 'image/png',
                  }
                },
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let clientDir = path.join(fixture.projectDir, "build", "client");
      expect(listAllFiles(clientDir).sort()).toEqual([
        "_root.data",
        "about.data",
        "about/index.html",
        "favicon.ico",
        "image.png",
        "image.png.data",
        "index.html",
        "json.json",
        "json.json.data",
        "text.txt",
        "text.txt.data",
      ]);

      expect(
        await fs.promises.readFile(path.join(clientDir, "json.json"), "utf8")
      ).toEqual('{"hello":"world"}');
      expect(
        await fs.promises.readFile(path.join(clientDir, "text.txt"), "utf8")
      ).toEqual("Hello, world");
      expect(
        await fs.promises.readFile(path.join(clientDir, "image.png"), "base64")
      ).toEqual(base64Png);

      let res = await fixture.requestResource("/json.json");
      expect(await res.json()).toEqual({ hello: "world" });

      let dataRes = await fixture.requestSingleFetchData("/json.json.data");
      expect(dataRes.data).toEqual({
        "routes/json[.json]": {
          data: {
            hello: "world",
          },
        },
      });

      res = await fixture.requestResource("/text.txt");
      expect(await res.text()).toBe("Hello, world");

      dataRes = await fixture.requestSingleFetchData("/text.txt.data");
      expect(dataRes.data).toEqual({
        "routes/text[.txt]": {
          data: "Hello, world",
        },
      });

      res = await fixture.requestResource("/image.png");
      expect(Buffer.from(await res.arrayBuffer()).toString("base64")).toBe(
        base64Png
      );
    });

    test("Adds leading slashes if omitted in config", async () => {
      fixture = await createFixture({
        prerender: true,
        files: {
          ...files,
          "react-router.config.ts": js`
          export default {
            async prerender() {
              await new Promise(r => setTimeout(r, 1));
              return ['/', 'about'];
            },
          }
        `,
          "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [
              reactRouter()
            ],
          });
        `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let clientDir = path.join(fixture.projectDir, "build", "client");
      expect(listAllFiles(clientDir).sort()).toEqual([
        "_root.data",
        "about.data",
        "about/index.html",
        "favicon.ico",
        "index.html",
      ]);

      let res = await fixture.requestDocument("/");
      let html = await res.text();
      expect(html).toMatch("<title>Index Title: Index Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">Index</h2>');
      expect(html).toMatch('<p data-loader-data="true">Index Loader Data</p>');

      res = await fixture.requestDocument("/about");
      html = await res.text();
      expect(html).toMatch("<title>About Title: About Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">About</h2>');
      expect(html).toMatch('<p data-loader-data="true">About Loader Data</p>');
    });
  });

  test.describe("ssr: true", () => {
    test("Serves the prerendered HTML file alongside runtime routes", async ({
      page,
    }) => {
      fixture = await createFixture({
        files: {
          ...files,
          "react-router.config.ts": reactRouterConfig({
            // Don't prerender the /not-prerendered route
            prerender: ["/", "/about"],
          }),
          "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [reactRouter()],
          });
        `,
          "app/routes/about.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return "ABOUT-" + request.headers.has('X-React-Router-Prerender');
          }

          export default function Comp() {
            let data = useLoaderData();
            return <h1>About: <span>{data}</span></h1>
          }
        `,
          "app/routes/not-prerendered.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return "NOT-PRERENDERED-" + request.headers.has('X-React-Router-Prerender');
          }

          export default function Comp() {
            let data = useLoaderData();
            return <h1>Not-Prerendered: <span>{data}</span></h1>
          }
        `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/about");
      await page.waitForSelector("[data-mounted]");
      expect(await app.getHtml()).toContain("<span>ABOUT-true</span>");

      await app.goto("/not-prerendered");
      await page.waitForSelector("[data-mounted]");
      expect(await app.getHtml()).toContain(
        "<span>NOT-PRERENDERED-false</span>"
      );
    });

    test("Does not encounter header limits on large prerendered data", async ({
      page,
    }) => {
      fixture = await createFixture({
        files: {
          ...files,
          "react-router.config.ts": reactRouterConfig({
            prerender: ["/", "/about"],
          }),
          "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [reactRouter()],
          });
        `,
          "app/routes/about.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return {
              prerendered: request.headers.has('X-React-Router-Prerender') ? 'yes' : 'no',
              // 24999 characters
              data: new Array(5000).fill('test').join('-'),
            };
          }

          export default function Comp() {
            let data = useLoaderData();
            return (
              <>
                <h1 data-title>Large loader</h1>
                <p data-prerendered>{data.prerendered}</p>
                <p data-length>{data.data.length}</p>
              </>
            );
          }
        `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/about");
      await page.waitForSelector("[data-mounted]");
      expect(await app.getHtml("[data-title]")).toContain("Large loader");
      expect(await app.getHtml("[data-prerendered]")).toContain("yes");
      expect(await app.getHtml("[data-length]")).toBe(
        '<p data-length="true">24999</p>'
      );
    });

    test("Handles UTF-8 characters in prerendered and non-prerendered routes", async ({
      page,
    }) => {
      fixture = await createFixture({
        files: {
          ...files,
          "react-router.config.ts": reactRouterConfig({
            prerender: ["/", "/utf8-prerendered"],
          }),
          "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [reactRouter()],
          });
        `,
          "app/routes/utf8-prerendered.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return {
              prerendered: request.headers.has('X-React-Router-Prerender') ? 'yes' : 'no',
              data: "한글 데이터 - UTF-8 문자",
            };
          }

          export default function Comp() {
            let data = useLoaderData();
            return (
              <>
                <h1 data-title>UTF-8 Prerendered</h1>
                <p data-prerendered>{data.prerendered}</p>
                <p data-content>{data.data}</p>
              </>
            );
          }
        `,
          "app/routes/utf8-not-prerendered.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return {
              prerendered: request.headers.has('X-React-Router-Prerender') ? 'yes' : 'no',
              data: "非プリレンダリングデータ - UTF-8文字",
            };
          }

          export default function Comp() {
            let data = useLoaderData();
            return (
              <>
                <h1 data-title>UTF-8 Not Prerendered</h1>
                <p data-prerendered>{data.prerendered}</p>
                <p data-content>{data.data}</p>
              </>
            );
          }
        `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);

      // Test prerendered route with UTF-8 characters
      await app.goto("/utf8-prerendered");
      await page.waitForSelector("[data-mounted]");
      expect(await app.getHtml("[data-title]")).toContain("UTF-8 Prerendered");
      expect(await app.getHtml("[data-prerendered]")).toContain("yes");
      expect(await app.getHtml("[data-content]")).toContain(
        "한글 데이터 - UTF-8 문자"
      );

      // Test non-prerendered route with UTF-8 characters
      await app.goto("/utf8-not-prerendered");
      await page.waitForSelector("[data-mounted]");
      expect(await app.getHtml("[data-title]")).toContain(
        "UTF-8 Not Prerendered"
      );
      expect(await app.getHtml("[data-prerendered]")).toContain("no");
      expect(await app.getHtml("[data-content]")).toContain(
        "非プリレンダリングデータ - UTF-8文字"
      );
    });

    test("Renders down to the proper HydrateFallback", async ({ page }) => {
      fixture = await createFixture({
        files: {
          ...files,
          "react-router.config.ts": reactRouterConfig({
            prerender: ["/", "/parent", "/parent/child"],
          }),
          "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [reactRouter()],
          });
        `,
          "app/routes/parent.tsx": js`
          import { Outlet, useLoaderData } from 'react-router';
          export function loader() {
            return "PARENT";
          }
          export default function Comp() {
            let data = useLoaderData();
            return <><p>Parent: {data}</p><Outlet/></>
          }
        `,
          "app/routes/parent.child.tsx": js`
          import { Outlet, useLoaderData } from 'react-router';
          export function loader() {
            return "CHILD";
          }
          export function HydrateFallback() {
            return <p>Child loading...</p>
          }
          export default function Comp() {
            let data = useLoaderData();
            return <><p>Child: {data}</p><Outlet/></>
          }
        `,
          "app/routes/parent.child._index.tsx": js`
          import { Outlet, useLoaderData } from 'react-router';
          export function clientLoader() {
            return "INDEX";
          }
          export default function Comp() {
            let data = useLoaderData();
            return <><p>Index: {data}</p><Outlet/></>
          }
        `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let res = await fixture.requestDocument("/parent/child");
      let html = await res.text();
      expect(html).toContain("<p>Child loading...</p>");

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent/child");
      await page.waitForSelector("[data-mounted]");
      expect(await app.getHtml()).toMatch("Index: INDEX");
    });
  });

  test.describe("ssr: false", () => {
    function captureRequests(page: Page) {
      let requests: string[] = [];
      page.on("request", (request) => {
        let url = new URL(request.url());
        if (
          url.pathname.endsWith(".data") ||
          url.pathname.endsWith("__manifest")
        ) {
          requests.push(url.pathname + url.search);
        }
      });
      return requests;
    }

    test("Errors on headers/action functions in any route", async () => {
      let cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({
          ssr: false,
          prerender: ["/", "/a"],
        }),
        "app/routes/a.tsx": String.raw`
          // Invalid exports
          export function headers() {}
          export function action() {}

          // Valid exports
          export function loader() {}
          export function clientLoader() {}
          export function clientAction() {}
          export default function Component() {}
        `,
      });
      let result = build({ cwd });
      let stderr = result.stderr.toString("utf8");
      expect(stderr).toMatch(
        "Prerender: 2 invalid route export(s) in `routes/a` when pre-rendering " +
          "with `ssr:false`: `headers`, `action`.  " +
          "See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information."
      );
    });

    test("Errors on loader functions in non-prerendered routes", async () => {
      let cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({
          ssr: false,
          prerender: ["/", "/a"],
        }),
        "app/routes/a.tsx": String.raw`
          export function loader() {}
          export function clientLoader() {}
          export function clientAction() {}
          export default function Component() {}
        `,
        "app/routes/b.tsx": String.raw`
          export function loader() {}
          export function clientLoader() {}
          export function clientAction() {}
          export default function Component() {}
        `,
      });
      let result = build({ cwd });
      let stderr = result.stderr.toString("utf8");
      expect(stderr).toMatch(
        "Prerender: 1 invalid route export in `routes/b` when pre-rendering " +
          "with `ssr:false`: `loader`. " +
          "See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information."
      );
    });

    test("Errors on loader functions in parent routes with non-pre-rendered children", async () => {
      let cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({
          ssr: false,
          prerender: ["/", "/a"],
        }),
        "app/routes/a.tsx": String.raw`
          export function loader() {}
          export function clientAction() {}
          export default function Component() {}
        `,
        "app/routes/a.b.tsx": String.raw`
          export function clientLoader() {}
          export function clientAction() {}
          export default function Component() {}
        `,
      });
      let result = build({ cwd });
      let stderr = result.stderr.toString("utf8");
      expect(stderr).toMatch(
        "Prerender: 1 invalid route export in `routes/a` when pre-rendering " +
          "with `ssr:false`: `loader`. " +
          "See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information."
      );
    });

    test("Warns on parameterized routes with prerender:true + ssr:false", async () => {
      let buildStdio = new PassThrough();
      fixture = await createFixture({
        buildStdio,
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            prerender: true,
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": files["app/root.tsx"],
          "app/routes/_index.tsx": files["app/routes/_index.tsx"],
          "app/routes/$slug.tsx": js`
            import { Outlet } from 'react-router'
            export default function Component() {
              return <Outlet/>
            }
          `,
          "app/routes/$.tsx": js`
            import { Outlet } from 'react-router'
            export default function Component() {
              return <Outlet/>
            }
          `,
        },
      });

      let buildOutput: string;
      let chunks: Buffer[] = [];
      buildOutput = await new Promise<string>((resolve, reject) => {
        buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        buildStdio.on("error", (err) => reject(err));
        buildStdio.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf8"))
        );
      });

      expect(buildOutput).toContain(
        [
          "⚠️ Paths with dynamic/splat params cannot be prerendered when using `prerender: true`. " +
            "You may want to use the `prerender()` API to prerender the following paths:",
          "  - :slug",
          "  - *",
        ].join("\n")
      );
      // Only logs once
      expect(buildOutput.match(/with dynamic\/splat params/g)?.length).toBe(1);
    });

    test("Prerenders a spa fallback with prerender:['/'] + ssr:false", async () => {
      let buildStdio = new PassThrough();
      fixture = await createFixture({
        buildStdio,
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            prerender: ["/"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": files["app/root.tsx"],
          "app/routes/_index.tsx": files["app/routes/_index.tsx"],
          "app/routes/page.tsx": js`
            export function clientLoader() {
              return "PAGE DATA"
            }
            export default function Page({ loaderData }) {
              return <p>{loaderData}</p>
            }
          `,
        },
      });

      appFixture = await createAppFixture(fixture);

      let clientDir = path.join(fixture.projectDir, "build", "client");
      expect(listAllFiles(clientDir).sort()).toEqual([
        "__spa-fallback.html",
        "_root.data",
        "favicon.ico",
        "index.html",
      ]);

      let res = await fixture.requestDocument("/");
      let html = await res.text();
      expect(html).toMatch("<title>Index Title: Index Loader Data</title>");
      expect(html).toMatch("<h1>Root</h1>");
      expect(html).toMatch('<h2 data-route="true">Index</h2>');
      expect(html).toMatch('<p data-loader-data="true">Index Loader Data</p>');
      expect(html).not.toMatch("<p>Loading...</p>");

      res = await fixture.requestDocument("/page");
      html = await res.text();
      expect(html).toMatch("<p>Loading...</p>");
    });

    test("Hydrates into a navigable app", async ({ page }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          ...files,
          "react-router.config.ts": reactRouterConfig({
            ssr: false, // turn off fog of war since we're serving with a static server
            prerender: true,
          }),
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector("[data-mounted]");
      await app.clickLink("/about");
      await page.waitForSelector("[data-route]:has-text('About')");
      expect(requests).toEqual(["/about.data"]);
    });

    test("Hydrates into a navigable app from the spa fallback", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false, // turn off fog of war since we're serving with a static server
            prerender: ["/"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": files["app/root.tsx"],
          "app/routes/_index.tsx": files["app/routes/_index.tsx"],
          "app/routes/page.tsx": js`
            import { Link } from 'react-router';
            export async function clientLoader() {
              await new Promise(r => setTimeout(r, 1000));
              return "PAGE DATA"
            }
            export default function Page({ loaderData }) {
              return (
                <>
                  <p data-page>{loaderData}</p>
                  <Link to="/page2">Go to page2</Link>
                </>
              );
            }
          `,
          "app/routes/page2.tsx": js`
            export function clientLoader() {
              return "PAGE2 DATA"
            }
            export default function Page({ loaderData }) {
              return <p data-page2>{loaderData}</p>
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      // Load a path we didn't prerender, ensure it starts with the root fallback,
      // hydrates, and then lets you navigate
      await app.goto("/page");
      expect(await page.getByText("Loading...")).toBeVisible();
      await page.waitForSelector("[data-page]");
      await app.clickLink("/page2");
      await page.waitForSelector("[data-page2]");
      expect(await (await page.$("[data-page2]"))?.innerText()).toBe(
        "PAGE2 DATA"
      );
    });

    test("Navigates across SPA/prerender pages when starting from a SPA page", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false, // turn off fog of war since we're serving with a static server
            prerender: ["/page"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return <Outlet />
            }
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router';
            export default function Index() {
              return <Link to="/page">Go to page</Link>
            }
          `,
          "app/routes/page.tsx": js`
            import { Link, Form } from 'react-router';
            export async function loader() {
              return "PAGE DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page>{loaderData}</p>
                  {actionData ? <p data-page-action>{actionData}</p> : null}
                  <Link to="/page2">Go to page2</Link>
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
          "app/routes/page2.tsx": js`
            import { Form } from 'react-router';
            export function clientLoader() {
              return "PAGE2 DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE2 ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page2>{loaderData}</p>
                  {actionData ? <p data-page2-action>{actionData}</p> : null}
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await page.waitForSelector('a[href="/page"]');

      await app.clickLink("/page");
      await page.waitForSelector("[data-page]");
      expect(await (await page.$("[data-page]"))?.innerText()).toBe(
        "PAGE DATA"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 1"
      );

      await app.clickLink("/page2");
      await page.waitForSelector("[data-page2]");
      expect(await (await page.$("[data-page2]"))?.innerText()).toBe(
        "PAGE2 DATA"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 1"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 2"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 2"
      );

      // We should only make this call when navigating to the prerendered route
      // 2 calls (no revalidation after submission to self):
      // - ✅ Initial navigation
      // - ❌ No revalidation after submission to self
      // - ✅ After submission back from /page
      expect(requests).toEqual(["/page.data", "/page.data"]);
    });

    test("Navigates across SPA/prerender pages when starting from a prerendered page", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false, // turn off fog of war since we're serving with a static server
            prerender: ["/", "/page"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return <Outlet />;
            }
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router';
            export default function Index() {
              return <Link to="/page">Go to page</Link>
            }
          `,
          "app/routes/page.tsx": js`
            import { Link, Form } from 'react-router';
            export async function loader() {
              return "PAGE DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page>{loaderData}</p>
                  {actionData ? <p data-page-action>{actionData}</p> : null}
                  <Link to="/page2">Go to page2</Link>
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
          "app/routes/page2.tsx": js`
            import { Form } from 'react-router';
            export function clientLoader() {
              return "PAGE2 DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE2 ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page2>{loaderData}</p>
                  {actionData ? <p data-page2-action>{actionData}</p> : null}
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await page.waitForSelector('a[href="/page"]');

      await app.clickLink("/page");
      await page.waitForSelector("[data-page]");
      expect(await (await page.$("[data-page]"))?.innerText()).toBe(
        "PAGE DATA"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 1"
      );

      await app.clickLink("/page2");
      await page.waitForSelector("[data-page2]");
      expect(await (await page.$("[data-page2]"))?.innerText()).toBe(
        "PAGE2 DATA"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 1"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 2"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 2"
      );

      // We should only make this call when navigating to the prerendered route
      // 2 calls (no revalidation after submission to self):
      // - ✅ Initial navigation
      // - ❌ No revalidation after submission to self
      // - ✅ After submission back from /page
      expect(requests).toEqual(["/page.data", "/page.data"]);
    });

    test("Navigates across SPA/prerender pages when starting from a SPA page and a root loader exists", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false, // turn off fog of war since we're serving with a static server
            prerender: ["/page"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function loader() {
              return "ROOT DATA";
            }

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return (
                <>
                  <p data-root>{loaderData}</p>
                  <Outlet />
                </>
              );
            }
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router';
            export default function Index() {
              return <Link to="/page">Go to page</Link>
            }
          `,
          "app/routes/page.tsx": js`
            import { Link, Form } from 'react-router';
            export async function loader() {
              return "PAGE DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page>{loaderData}</p>
                  {actionData ? <p data-page-action>{actionData}</p> : null}
                  <Link to="/page2">Go to page2</Link>
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
          "app/routes/page2.tsx": js`
            import { Form } from 'react-router';
            export function clientLoader() {
              return "PAGE2 DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE2 ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page2>{loaderData}</p>
                  {actionData ? <p data-page2-action>{actionData}</p> : null}
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await page.waitForSelector("[data-root]");
      expect(await (await page.$("[data-root]"))?.innerText()).toBe(
        "ROOT DATA"
      );

      await app.clickLink("/page");
      await page.waitForSelector("[data-page]");
      expect(await (await page.$("[data-page]"))?.innerText()).toBe(
        "PAGE DATA"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 1"
      );

      await app.clickLink("/page2");
      await page.waitForSelector("[data-page2]");
      expect(await (await page.$("[data-page2]"))?.innerText()).toBe(
        "PAGE2 DATA"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 1"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 2"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 2"
      );

      // We should only make this call when navigating to the prerendered route
      // 2 calls (no revalidation after submission to self):
      // - ✅ Initial navigation
      // - ❌ No revalidation after submission to self
      // - ✅ After submission back from /page
      expect(requests).toEqual(["/page.data", "/page.data"]);
    });

    test("Navigates across SPA/prerender pages when starting from a prerendered page and a root loader exists", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false, // turn off fog of war since we're serving with a static server
            prerender: ["/", "/page"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function loader() {
              return "ROOT DATA";
            }

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return (
                <>
                  <p data-root>{loaderData}</p>
                  <Outlet />
                </>
              );
            }
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router';
            export default function Index() {
              return <Link to="/page">Go to page</Link>
            }
          `,
          "app/routes/page.tsx": js`
            import { Link, Form } from 'react-router';
            export async function loader() {
              return "PAGE DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page>{loaderData}</p>
                  {actionData ? <p data-page-action>{actionData}</p> : null}
                  <Link to="/page2">Go to page2</Link>
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
          "app/routes/page2.tsx": js`
            import { Form } from 'react-router';
            export function clientLoader() {
              return "PAGE2 DATA"
            }
            let count = 0;
            export function clientAction() {
              return "PAGE2 ACTION " + (++count)
            }
            export default function Page({ loaderData, actionData }) {
              return (
                <>
                  <p data-page2>{loaderData}</p>
                  {actionData ? <p data-page2-action>{actionData}</p> : null}
                  <Form method="post" action="/page">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/page2">
                    <button type="submit">Submit /page2</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await page.waitForSelector("[data-root]");
      expect(await (await page.$("[data-root]"))?.innerText()).toBe(
        "ROOT DATA"
      );

      await app.clickLink("/page");
      await page.waitForSelector("[data-page]");
      expect(await (await page.$("[data-page]"))?.innerText()).toBe(
        "PAGE DATA"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 1"
      );

      await app.clickLink("/page2");
      await page.waitForSelector("[data-page2]");
      expect(await (await page.$("[data-page2]"))?.innerText()).toBe(
        "PAGE2 DATA"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 1"
      );

      await app.clickSubmitButton("/page");
      await page.waitForSelector("[data-page-action]");
      expect(await (await page.$("[data-page-action]"))?.innerText()).toBe(
        "PAGE ACTION 2"
      );

      await app.clickSubmitButton("/page2");
      await page.waitForSelector("[data-page2-action]");
      expect(await (await page.$("[data-page2-action]"))?.innerText()).toBe(
        "PAGE2 ACTION 2"
      );

      // We should only make this call when navigating to the prerendered route
      // 2 calls (no revalidation after submission to self):
      // - ✅ Initial navigation
      // - ❌ No revalidation after submission to self
      // - ✅ After submission back from /page
      expect(requests).toEqual(["/page.data", "/page.data"]);
    });

    test("Navigates between prerendered parent and child SPA route", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            prerender: ["/", "/parent"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return <Outlet />
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Form, Outlet } from 'react-router';
            export async function loader() {
              return "PARENT DATA"
            }
            export async function clientLoader() {
              return "PARENT CLIENT DATA"
            }
            export function clientAction() {
              return "PARENT ACTION"
            }
            export default function Parent({ loaderData, actionData }) {
              return (
                <>
                  <p data-parent>{loaderData}</p>
                  {actionData ? <p data-parent-action>{actionData}</p> : null}
                  <Link to="/parent/child">Go to child</Link>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit child</button>
                  </Form>
                  <Outlet />
                </>
              );
            }
          `,
          "app/routes/parent.child.tsx": js`
            import { Link, Form } from 'react-router';
            export function clientLoader() {
              return "CHILD DATA"
            }
            export function clientAction() {
              return "CHILD ACTION"
            }
            export default function Child({ loaderData, actionData }) {
              return (
                <>
                  <p data-child>{loaderData}</p>
                  {actionData ? <p data-child-action>{actionData}</p> : null}
                  <Link to="/parent">Go to parent</Link>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit parent</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent", true);
      await expect(page.getByText("PARENT DATA")).toBeVisible();

      await app.clickLink("/parent/child");
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      // Submit to self
      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.goBack();
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Submit across routes
      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      // Submit to self
      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      // Submit across routes
      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Submit to self
      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // We should never make this call because we started on this route and it never unmounts
      expect(requests).toEqual([]);
    });

    test("Navigates between SPA parent and prerendered child route", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            prerender: ["/", "/parent/child"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return <Outlet />
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Form, Outlet } from 'react-router';
            export async function clientLoader() {
              return "PARENT DATA"
            }
            export function clientAction() {
              return "PARENT ACTION"
            }
            export default function Parent({ loaderData, actionData }) {
              return (
                <>
                  <p data-parent>{loaderData}</p>
                  {actionData ? <p data-parent-action>{actionData}</p> : null}
                  <Link to="/parent/child">Go to child</Link>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit child</button>
                  </Form>
                  <Outlet />
                </>
              );
            }
          `,
          "app/routes/parent.child.tsx": js`
            import { Link, Form } from 'react-router';
            export function loader() {
              return "CHILD DATA"
            }
            export function clientAction() {
              return "CHILD ACTION"
            }
            export default function Child({ loaderData, actionData }) {
              return (
                <>
                  <p data-child>{loaderData}</p>
                  {actionData ? <p data-child-action>{actionData}</p> : null}
                  <Link to="/parent">Go to parent</Link>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit parent</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent", true);
      await expect(page.getByText("PARENT DATA")).toBeVisible();

      await app.clickLink("/parent/child");
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.goBack();
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Initial navigation and submission from /parent
      expect(requests).toEqual(["/parent/child.data", "/parent/child.data"]);
      while (requests.length) requests.pop();

      await app.goto("/parent/child", true);
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.clickLink("/parent");
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Submission from /parent
      expect(requests).toEqual(["/parent/child.data"]);
    });

    test("Navigates between prerendered parent and child SPA route (with a root loader)", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            prerender: ["/", "/parent"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function loader() {
              return "ROOT DATA"
            }

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return (
                <>
                  <p data-root>{loaderData}</p>
                  <Outlet/>
                </>
              );
            }

            export function HydrateFallback() {
              return <p>Loading...</p>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Form, Outlet } from 'react-router';
            export async function loader() {
              return "PARENT DATA"
            }
            export async function clientLoader() {
              return "PARENT CLIENT DATA"
            }
            export function clientAction() {
              return "PARENT ACTION"
            }
            export default function Parent({ loaderData, actionData }) {
              return (
                <>
                  <p data-parent>{loaderData}</p>
                  {actionData ? <p data-parent-action>{actionData}</p> : null}
                  <Link to="/parent/child">Go to child</Link>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit child</button>
                  </Form>
                  <Outlet />
                </>
              );
            }
          `,
          "app/routes/parent.child.tsx": js`
            import { Link, Form } from 'react-router';
            export function clientLoader() {
              return "CHILD DATA"
            }
            export function clientAction() {
              return "CHILD ACTION"
            }
            export default function Child({ loaderData, actionData }) {
              return (
                <>
                  <p data-child>{loaderData}</p>
                  {actionData ? <p data-child-action>{actionData}</p> : null}
                  <Link to="/parent">Go to parent</Link>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit parent</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent", true);
      await expect(page.getByText("ROOT DATA")).toBeVisible();
      await expect(page.getByText("PARENT DATA")).toBeVisible();

      await app.clickLink("/parent/child");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      // Submit to self
      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.goBack();
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Submit across routes
      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      // Submit to self
      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      // Submit across routes
      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Submit to self
      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT CLIENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // We should never make this call because we started on this route and it never unmounts
      expect(requests).toEqual([]);
    });

    test("Navigates between SPA parent and prerendered child route (with a root loader)", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            prerender: ["/", "/parent/child"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Outlet, Scripts } from "react-router";

            export function loader() {
              return "ROOT DATA"
            }

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }


            export default function Root({ loaderData }) {
              return (
                <>
                  <p data-root>{loaderData}</p>
                  <Outlet/>
                </>
              );
            }          `,
          "app/routes/parent.tsx": js`
            import { Link, Form, Outlet } from 'react-router';
            export async function clientLoader() {
              return "PARENT DATA"
            }
            export function clientAction() {
              return "PARENT ACTION"
            }
            export default function Parent({ loaderData, actionData }) {
              return (
                <>
                  <p data-parent>{loaderData}</p>
                  {actionData ? <p data-parent-action>{actionData}</p> : null}
                  <Link to="/parent/child">Go to child</Link>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit child</button>
                  </Form>
                  <Outlet />
                </>
              );
            }
          `,
          "app/routes/parent.child.tsx": js`
            import { Link, Form } from 'react-router';
            export function loader() {
              return "CHILD DATA"
            }
            export function clientAction() {
              return "CHILD ACTION"
            }
            export default function Child({ loaderData, actionData }) {
              return (
                <>
                  <p data-child>{loaderData}</p>
                  {actionData ? <p data-child-action>{actionData}</p> : null}
                  <Link to="/parent">Go to parent</Link>
                  <Form method="post" action="/parent/child">
                    <button type="submit">Submit</button>
                  </Form>
                  <Form method="post" action="/parent">
                    <button type="submit">Submit parent</button>
                  </Form>
                </>
              );
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent", true);
      await expect(page.getByText("ROOT DATA")).toBeVisible();
      await expect(page.getByText("PARENT DATA")).toBeVisible();

      await app.clickLink("/parent/child");
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.goBack();
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Initial navigation and submission from /parent
      expect(requests).toEqual(["/parent/child.data", "/parent/child.data"]);
      while (requests.length) requests.pop();

      await app.goto("/parent/child", true);
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.clickLink("/parent");
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      await app.clickSubmitButton("/parent/child");
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD ACTION")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).toBeVisible();

      await app.clickSubmitButton("/parent");
      await expect(page.getByText("PARENT ACTION")).toBeVisible();
      await expect(page.getByText("PARENT DATA")).toBeVisible();
      await expect(page.getByText("CHILD DATA")).not.toBeVisible();

      // Submission from /parent
      expect(requests).toEqual(["/parent/child.data"]);
    });

    test("Navigates to prerendered parent with clientLoader calling loader", async ({
      page,
    }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            prerender: ["/", "/parent"],
          }),
          "vite.config.ts": files["vite.config.ts"],
          "app/root.tsx": js`
            import * as React from "react";
            import { Link, Outlet, Scripts } from "react-router";

            export function Layout({ children }) {
              return (
                <html lang="en">
                  <head />
                  <body>
                    {children}
                    <Scripts />
                  </body>
                </html>
              );
            }

            export default function Root({ loaderData }) {
              return (
                <>
                  <Link to="/parent">Go to parent</Link>
                  <Outlet/>
                </>
              );
            }

            export function HydrateFallback() {
              return <p>Loading...</p>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Form, Outlet } from 'react-router';
            export async function loader() {
              return "PARENT DATA"
            }
            export async function clientLoader({ serverLoader }) {
              let str = await serverLoader();
              return str + " - CLIENT"
            }
            export function clientAction() {
              return "PARENT ACTION"
            }
            export default function Parent({ loaderData, actionData }) {
              return <p data-parent>{loaderData}</p>;
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await expect(page.getByText("Go to parent")).toBeVisible();

      await app.clickLink("/parent");
      await expect(page.getByText("PARENT DATA - CLIENT")).toBeVisible();

      expect(requests).toEqual(["/parent.data?_routes=routes%2Fparent"]);
    });

    test("Handles 404s on data requests", async ({ page }) => {
      fixture = await createFixture({
        prerender: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false, // turn off fog of war since we're serving with a static server
            prerender: ["/", "/slug"],
          }),
          // Just bring in the root instead of all `files` since we can't have
          // loaders in non-prerendered routes
          "app/root.tsx": files["app/root.tsx"],
          "app/routes/$slug.tsx": js`
            import * as React  from "react";
            import { useLoaderData } from "react-router";

            export async function loader() {
              return null;
            }

            export default function Component() {
              return <h2>Slug</h2>
            }
          `,
        },
      });
      appFixture = await createAppFixture(fixture);

      let requests = captureRequests(page);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector("[data-mounted]");
      await app.clickLink("/not-found");
      await page.waitForSelector("[data-error]:has-text('404 Not Found')");
      expect(requests).toEqual(["/not-found.data"]);
    });
  });
});
