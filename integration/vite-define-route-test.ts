import { expect } from "@playwright/test";

import type { Files } from "./helpers/vite";
import { test, build, createProject, viteConfig } from "./helpers/vite";
import dedent from "dedent";
import stripAnsi from "strip-ansi";

// TODO: passing test for object literal
// TODO: passing test for `defineRoute`

test.describe("defineRoute", () => {
  test("fails when used outside of route modules", async () => {
    let cwd = await createProject({
      "app/non-route.ts": dedent`
        import { defineRoute } from "react-router"
        export const planet = "world"
      `,
      "app/routes/_index.tsx": dedent`
        import { planet } from "../non-route"
        export default function Route() {
          return "Hello, " + planet + "!"
        }
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch(
      "`defineRoute` cannot be used outside of route modules"
    );
    expect(stderr).toMatch(
      dedent(
        `
        > 1 | import { defineRoute } from "react-router"
            |          ^^^^^^^^^^^
        `
      )
    );
  });

  test("fails if referenced outside of `export default` call expression", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        import { defineRoute } from "react-router"
        let x = defineRoute
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch(
      "`defineRoute` must be a function call immediately after `export default`"
    );
    expect(stderr).toMatch(
      dedent(
        `
        > 2 | let x = defineRoute
            |         ^^^^^^^^^^^
        `
      )
    );
  });

  test("fails if default export is an arbitrary value", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        // defineRoute : hack to trigger 'defineRoute' detection, remove this once old style routes are unsupported
        const thing = "stuff"
        export default thing
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch(
      "Default export of a route module must be either a literal object or a call to `defineRoute`"
    );
    expect(stderr).toMatch(
      dedent(
        `
        > 3 | export default thing
            |                ^^^^^
        `
      )
    );
  });

  test("fails if default export is a call to an arbitrary function", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        // defineRoute : hack to trigger 'defineRoute' detection, remove this once old style routes are unsupported
        const thing = () => "stuff"
        export default thing()
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch(
      "Default export of a route module must be either a literal object or a call to `defineRoute`"
    );
    expect(stderr).toMatch(
      dedent(
        `
        > 3 | export default thing()
            |                ^^^^^^^
        `
      )
    );
  });

  test("fails if wrong number of args", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        import { defineRoute } from "react-router"
        export default defineRoute()
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch("`defineRoute` must take exactly one argument");
    expect(stderr).toMatch(
      dedent(
        `
        > 2 | export default defineRoute()
            |                ^^^^^^^^^^^^^
        `
      )
    );
  });

  test("fails if route is not an object literal", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        import { defineRoute } from "react-router"
        const route = {}
        export default defineRoute(route)
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch("`defineRoute` argument must be a literal object");
    expect(stderr).toMatch(
      dedent(
        `
        > 3 | export default defineRoute(route)
            |                            ^^^^^
        `
      )
    );
  });

  test("fails if route has spread properties", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        import { defineRoute } from "react-router"
        const dynamic = {
          serverLoader: null
        }
        export default defineRoute({
          ...dynamic,
        })
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch("Properties cannot be spread into route");
    expect(stderr).toMatch(
      dedent(
        `
        > 6 |   ...dynamic,
            |   ^^^^^^^^^^
        `
      )
    );
  });

  test("fails if route has computed keys", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        import { defineRoute } from "react-router"
        const dynamic = "serverLoader"
        export default defineRoute({
          [dynamic]: null,
        })
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch("Route cannot have computed keys");
    expect(stderr).toMatch(
      dedent(
        `
        > 4 |   [dynamic]: null,
            |   ^^^^^^^^^^^^^^^
        `
      )
    );
  });

  test("fails if route params is not an array literal", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        import { defineRoute } from "react-router"
        const dynamic = ["id", "brand?"]
        export default defineRoute({
          params: dynamic,
        })
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch("Route params must be a literal array");
    expect(stderr).toMatch(
      dedent(
        `
        > 4 |   params: dynamic,
            |   ^^^^^^^^^^^^^^^
        `
      )
    );
  });

  test("fails if route param is not a literal string", async () => {
    let cwd = await createProject({
      "app/routes/_index.tsx": dedent`
        import { defineRoute } from "react-router"
        const dynamic = "id"
        export default defineRoute({
          params: [dynamic, "brand?"],
        })
      `,
    });
    let result = build({ cwd });
    expect(result.status).not.toBe(0);
    let stderr = stripAnsi(result.stderr.toString("utf8"));
    expect(stderr).toMatch("Route param must be a literal string");
    expect(stderr).toMatch(
      dedent(
        `
        > 4 |   params: [dynamic, "brand?"],
            |            ^^^^^^^
        `
      )
    );
  });

  let files: Files = async ({ port }) => ({
    "vite.config.ts": dedent`
      import { vitePlugin as reactRouter } from "@react-router/dev";

      export default {
        ${await viteConfig.server({ port })}
        plugins: [reactRouter()],
      }
    `,
    "app/routes/_index.tsx": dedent`
      import { defineRoute } from "react-router"
      export default defineRoute({
        Component() {
          return <h1 data-title>Hello, world!</h1>
        }
      })
    `,
  });

  test("react-router dev", async ({ page, dev }) => {
    let { port } = await dev(files);
    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("[data-title]")).toHaveText("Hello, world!");
    expect(page.errors).toEqual([]);
  });

  test("build + react-router-serve", async ({ page, reactRouterServe }) => {
    let { port } = await reactRouterServe(files);
    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("[data-title]")).toHaveText("Hello, world!");
    expect(page.errors).toEqual([]);
  });
});
