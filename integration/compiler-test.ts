import { createFixture, createAppFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("compiler", () => {
  let fixture: Fixture;
  let app: AppFixture;

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/fake.server.js": js`
          export default { hello: "world" };
        `,

        "app/routes/index.jsx": js`
          import fake from "~/fake.server.js";

          export default function Index() {
            return <div id="index">{Object.keys(fake).length}</div>
          }
        `,
        "app/routes/built-ins.jsx": js`
          import { useLoaderData } from "remix";
          import * as path from "path";

          export let loader = () => {
            return path.join("test", "file.txt");
          }

          export default function BuiltIns() {
            return <div id="built-ins">{useLoaderData()}</div>
          }
        `,
        "app/routes/built-ins-polyfill.jsx": js`
          import { useLoaderData } from "remix";
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
        "remix.config.js": js`
          module.exports = {
            serverDependenciesToBundle: ["esm-only-pkg"],
          };
        `,
        "node_modules/esm-only-pkg/package.json": `{
          "name": "esm-only-pkg",
          "version": "1.0.0",
          "type": "module",
          "main": "./esm-only-pkg.js"
        }`,
        "node_modules/esm-only-pkg/esm-only-pkg.js": js`
          export default "esm-only-pkg";
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("removes server code with `*.server` files", async () => {
    let res = await app.goto("/", true);
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#index")).toMatchInlineSnapshot(
      `"<div id=\\"index\\">0</div>"`
    );
  });

  it("removes node built-ins from client bundle when used in just loader", async () => {
    let res = await app.goto("/built-ins", true);
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#built-ins")).toMatchInlineSnapshot(
      `"<div id=\\"built-ins\\">test/file.txt</div>"`
    );

    let routeModule = await fixture.getBrowserAsset(
      fixture.build.assets.routes["routes/built-ins"].module
    );
    // does not include `import bla from "path"` in the output bundle
    expect(routeModule).not.toMatch(/from\s*"path/);
  });

  it("bundles node built-ins polyfill for client bundle when used in client code", async () => {
    let res = await app.goto("/built-ins-polyfill", true);
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#built-ins-polyfill")).toMatchInlineSnapshot(
      `"<div id=\\"built-ins-polyfill\\">test/file.txt</div>"`
    );

    let routeModule = await fixture.getBrowserAsset(
      fixture.build.assets.routes["routes/built-ins-polyfill"].module
    );
    // does not include `import bla from "path"` in the output bundle
    expect(routeModule).not.toMatch(/from\s*"path/);
  });

  it("allows consumption of ESM modules in CJS builds with `serverDependenciesToBundle`", async () => {
    let res = await app.goto("/esm-only-pkg", true);
    expect(res.status()).toBe(200); // server rendered fine
    // rendered the page instead of the error boundary
    expect(await app.getHtml("#esm-only-pkg")).toMatchInlineSnapshot(
      `"<div id=\\"esm-only-pkg\\">esm-only-pkg</div>"`
    );
  });
});
