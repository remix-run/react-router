import path from "path";
import fse from "fs-extra";
import { test, expect } from "@playwright/test";
import { PassThrough } from "stream";

import {
  createFixture,
  createAppFixture,
  js,
  json,
  createFixtureProject,
  css,
} from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

test.describe("compiler", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      setup: "node",
      files: {
        // We need a custom config file here to test usage of `getDependenciesToBundle`
        // since this can't be serialized from the fixture object.
        "remix.config.js": js`
          let { getDependenciesToBundle } = require("@remix-run/dev");
          module.exports = {
            future: {
              v2_routeConvention: true,
            },
            serverDependenciesToBundle: [
              "esm-only-pkg",
              "esm-only-single-export",
              ...getDependenciesToBundle("esm-only-exports-pkg"),
            ],
          };
        `,
        "app/fake.server.js": js`
          export const hello = "server";
        `,
        "app/fake.client.js": js`
          export const hello = "client";
        `,
        "app/fake.js": js`
          import { hello as clientHello } from "./fake.client.js";
          import { hello as serverHello } from "./fake.server.js";
          export default clientHello || serverHello;
        `,
        "app/routes/_index.jsx": js`
          import fake from "~/fake.js";

          export default function Index() {
            let hasRightModule = fake === (typeof document === "undefined" ? "server" : "client");
            return <div id="index">{String(hasRightModule)}</div>
          }
        `,
        "app/routes/built-ins.jsx": js`
          import { useLoaderData } from "@remix-run/react";
          import * as path from "path";

          export let loader = () => {
            return path.join("test", "file.txt");
          }

          export default function BuiltIns() {
            return <div id="built-ins">{useLoaderData()}</div>
          }
        `,
        "app/routes/built-ins-polyfill.jsx": js`
          import { useLoaderData } from "@remix-run/react";
          import * as path from "path";

          export default function BuiltIns() {
            return <div id="built-ins-polyfill">{path.join("test", "file.txt")}</div>;
          }
        `,
        "app/routes/esm-only-pkg.jsx": js`
          import esmOnlyPkg from "esm-only-pkg";

          export default function EsmOnlyPkg() {
            return <div id="esm-only-pkg">{esmOnlyPkg}</div>;
          }
        `,
        "app/routes/esm-only-exports-pkg.jsx": js`
          import esmOnlyPkg from "esm-only-exports-pkg";

          export default function EsmOnlyPkg() {
            return <div id="esm-only-exports-pkg">{esmOnlyPkg}</div>;
          }
        `,
        "app/routes/esm-only-single-export.jsx": js`
          import esmOnlyPkg from "esm-only-single-export";

          export default function EsmOnlyPkg() {
            return <div id="esm-only-single-export">{esmOnlyPkg}</div>;
          }
        `,
        "app/routes/package-with-submodule.jsx": js`
          import { submodule } from "@org/package/sub-package";

          export default function PackageWithSubModule() {
            return <div id="package-with-submodule">{submodule()}</div>;
          }
        `,
        "app/routes/css.jsx": js`
          import stylesUrl from "@org/css/index.css";

          export function links() {
            return [{ rel: "stylesheet", href: stylesUrl }]
          }

          export default function PackageWithSubModule() {
            return <div id="package-with-submodule">{submodule()}</div>;
          }
        `,
        "node_modules/esm-only-pkg/package.json": json({
          name: "esm-only-pkg",
          version: "1.0.0",
          type: "module",
          main: "./esm-only-pkg.js",
        }),
        "node_modules/esm-only-pkg/esm-only-pkg.js": js`
          export default "esm-only-pkg";
        `,
        "node_modules/esm-only-exports-pkg/package.json": json({
          name: "esm-only-exports-pkg",
          version: "1.0.0",
          type: "module",
          exports: {
            ".": "./esm-only-exports-pkg.js",
          },
        }),
        "node_modules/esm-only-exports-pkg/esm-only-exports-pkg.js": js`
          export default "esm-only-exports-pkg";
        `,
        "node_modules/esm-only-single-export/package.json": json({
          name: "esm-only-exports-pkg",
          version: "1.0.0",
          type: "module",
          exports: "./esm-only-single-export.js",
        }),
        "node_modules/esm-only-single-export/esm-only-single-export.js": js`
          export default "esm-only-single-export";
        `,
        "node_modules/@org/package/package.json": json({
          name: "@org/package",
          version: "1.0.0",
        }),
        "node_modules/@org/package/sub-package/package.json": json({
          module: "./esm/index.js",
          sideEffects: false,
        }),
        "node_modules/@org/package/sub-package/index.js": js`
          module.exports.submodule = require("./submodule.js");
        `,
        "node_modules/@org/package/sub-package/submodule.js": js`
          module.exports = function submodule() {
            return "package-with-submodule";
          }
        `,
        "node_modules/@org/package/sub-package/esm/package.json": json({
          type: "module",
          sideEffects: false,
        }),
        "node_modules/@org/package/sub-package/esm/index.js": js`
          export { default as submodule } from "./submodule.js";
        `,
        "node_modules/@org/package/sub-package/esm/submodule.js": js`
          export default function submodule() {
            return "package-with-submodule";
          }
        `,
        "node_modules/@org/css/package.json": json({
          name: "@org/css",
          version: "1.0.0",
          main: "index.css",
        }),
        "node_modules/@org/css/font.woff2": "font",
        "node_modules/@org/css/index.css": css`
          body {
            background: red;
          }

          @font-face {
            font-family: "MyFont";
            src: url("./font.woff2");
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("removes server code with `*.server` files", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/", true);
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#index")).toBe('<div id="index">true</div>');
  });

  test("removes server code with `*.client` files", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/", true);
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#index")).toBe('<div id="index">true</div>');
  });

  test("removes node built-ins from client bundle when used in just loader", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/built-ins", true);
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#built-ins")).toBe(
      `<div id="built-ins">test${path.sep}file.txt</div>`
    );

    let routeModule = await fixture.getBrowserAsset(
      fixture.build.assets.routes["routes/built-ins"].module
    );
    // does not include `import bla from "path"` in the output bundle
    expect(routeModule).not.toMatch(/from\s*"path/);
  });

  test("bundles node built-ins polyfill for client bundle when used in client code", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/built-ins-polyfill", true);
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#built-ins-polyfill")).toBe(
      '<div id="built-ins-polyfill">test/file.txt</div>'
    );

    let routeModule = await fixture.getBrowserAsset(
      fixture.build.assets.routes["routes/built-ins-polyfill"].module
    );
    // does not include `import bla from "path"` in the output bundle
    expect(routeModule).not.toMatch(/from\s*"path/);
  });

  test("allows consumption of ESM modules in CJS builds with `serverDependenciesToBundle`", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/esm-only-pkg", true);
    expect(res.status()).toBe(200); // server rendered fine
    // rendered the page instead of the error boundary
    expect(await app.getHtml("#esm-only-pkg")).toBe(
      '<div id="esm-only-pkg">esm-only-pkg</div>'
    );
  });

  test("allows consumption of ESM modules in CJS builds with `serverDependenciesToBundle` when the package only exports a single file", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/esm-only-single-export", true);
    expect(res.status()).toBe(200); // server rendered fine
    // rendered the page instead of the error boundary
    expect(await app.getHtml("#esm-only-single-export")).toBe(
      '<div id="esm-only-single-export">esm-only-single-export</div>'
    );
  });

  test("allows consumption of ESM modules with exports in CJS builds with `serverDependenciesToBundle` and `getDependenciesToBundle`", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/esm-only-exports-pkg", true);
    expect(res.status()).toBe(200); // server rendered fine
    // rendered the page instead of the error boundary
    expect(await app.getHtml("#esm-only-exports-pkg")).toBe(
      '<div id="esm-only-exports-pkg">esm-only-exports-pkg</div>'
    );
  });

  test("allows consumption of packages with sub modules", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/package-with-submodule", true);
    expect(res.status()).toBe(200); // server rendered fine
    // rendered the page instead of the error boundary
    expect(await app.getHtml("#package-with-submodule")).toBe(
      '<div id="package-with-submodule">package-with-submodule</div>'
    );
  });

  test("copies imports in css files to assetsBuildDirectory", async () => {
    let buildDir = path.join(fixture.projectDir, "public", "build", "_assets");
    let files = await fse.readdir(buildDir);
    expect(files).toHaveLength(2);

    let cssFile = files.find((file) => file.match(/index-[a-z0-9]{8}\.css/i));
    let fontFile = files.find((file) => file.match(/font-[a-z0-9]{8}\.woff2/i));
    expect(cssFile).toBeTruthy();
    expect(fontFile).toBeTruthy();
  });

  // TODO: remove this when we get rid of that feature.
  test("magic imports still works", async () => {
    let magicExportsForNode = [
      "createCookie",
      "createCookieSessionStorage",
      "createFileSessionStorage",
      "createMemorySessionStorage",
      "createSessionStorage",
      "unstable_createFileUploadHandler",
      "unstable_createMemoryUploadHandler",
      "unstable_parseMultipartFormData",
      "createSession",
      "isCookie",
      "isSession",
      "json",
      "redirect",
      "Form",
      "Link",
      "Links",
      "LiveReload",
      "Meta",
      "NavLink",
      "Outlet",
      "PrefetchPageLinks",
      "RemixBrowser",
      "RemixServer",
      "Scripts",
      "ScrollRestoration",
      "useActionData",
      "useBeforeUnload",
      "useCatch",
      "useFetcher",
      "useFetchers",
      "useFormAction",
      "useHref",
      "useLoaderData",
      "useLocation",
      "useMatches",
      "useNavigate",
      "useNavigationType",
      "useOutlet",
      "useOutletContext",
      "useParams",
      "useResolvedPath",
      "useSearchParams",
      "useSubmit",
      "useTransition",
    ];
    let magicRemix = await fse.readFile(
      path.resolve(fixture.projectDir, "node_modules/remix/dist/index.js"),
      "utf8"
    );
    for (let name of magicExportsForNode) {
      expect(magicRemix).toContain(name);
    }
  });

  test.describe("serverBareModulesPlugin", () => {
    let ogConsole: typeof global.console;
    test.beforeEach(() => {
      ogConsole = global.console;
      // @ts-ignore
      global.console = {
        log() {},
        warn() {},
        error() {},
      };
    });
    test.afterEach(() => {
      global.console = ogConsole;
    });
    test("warns when a module isn't installed", async () => {
      let buildOutput: string;
      let buildStdio = new PassThrough();

      await expect(() =>
        createFixtureProject({
          config: {
            future: { v2_routeConvention: true },
          },
          buildStdio,
          files: {
            "app/routes/_index.jsx": js`
            import { json } from "@remix-run/node";
            import { useLoaderData } from "@remix-run/react";
            import notInstalledMain from "some-not-installed-module";
            import { notInstalledSub } from "some-not-installed-module/sub";

            export function loader() {
              return json({ main: notInstalledMain(), sub: notInstalledSub() });
            }

            export default function Index() {
                let data = useLoaderData();
                return null;
              }
              `,
          },
        })
      ).rejects.toThrowError("Build failed, check the output above");

      let chunks: Buffer[] = [];
      buildOutput = await new Promise<string>((resolve, reject) => {
        buildStdio.on("error", (error) => {
          reject(error);
        });
        buildStdio.on("data", (chunk) => {
          chunks.push(Buffer.from(chunk));
        });
        buildStdio.on("end", () => {
          resolve(Buffer.concat(chunks).toString("utf8"));
        });
      });

      let importer = path.join("app", "routes", "_index.jsx");

      expect(buildOutput).toContain(
        `could not resolve "some-not-installed-module"`
      );
      expect(buildOutput).toContain(
        `You imported "some-not-installed-module" in ${importer},`
      );
      expect(buildOutput).toContain(
        `could not resolve "some-not-installed-module/sub"`
      );
      expect(buildOutput).toContain(
        `You imported "some-not-installed-module/sub" in ${importer},`
      );
    });
  });
});
