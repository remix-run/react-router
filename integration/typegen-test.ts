import { spawnSync } from "node:child_process";
import * as path from "node:path";

import { expect, test } from "@playwright/test";
import dedent from "dedent";
import fse from "fs-extra";

import { createProject } from "./helpers/vite";

const tsx = dedent;

const nodeBin = process.argv[0];
const reactRouterBin = "node_modules/@react-router/dev/dist/cli/index.js";
const tscBin = "node_modules/typescript/bin/tsc";

function typecheck(cwd: string) {
  const typegen = spawnSync(nodeBin, [reactRouterBin, "typegen"], { cwd });
  expect(typegen.stdout.toString()).toBe("");
  expect(typegen.stderr.toString()).toBe("");
  expect(typegen.status).toBe(0);

  return spawnSync(nodeBin, [tscBin], { cwd });
}

const viteConfig = tsx`
  import { reactRouter } from "@react-router/dev/vite";

  export default {
    plugins: [reactRouter()],
  };
`;

const assertType = tsx`
  export function assertType<T>(t: T) {}
`;

test.describe("typegen", () => {
  test("basic", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/assertType.ts": assertType,
      "app/routes.ts": tsx`
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export const routes: RouteConfig = [
          route("products/:id", "routes/product.tsx")
        ]
      `,
      "app/routes/product.tsx": tsx`
        import { assertType } from "../assertType"
        import type { Route } from "./+types.product"

        export function loader({ params }: Route.LoaderArgs) {
          assertType<string>(params.id)
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          assertType<string>(loaderData.planet)
          return <h1>Hello, {loaderData.planet}!</h1>
        }
      `,
    });

    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });

  test.describe("params", () => {
    test("repeated", async () => {
      const cwd = await createProject({
        "vite.config.ts": viteConfig,
        "app/assertType.ts": assertType,
        "app/routes.ts": tsx`
          import { type RouteConfig, route } from "@react-router/dev/routes";

          export const routes: RouteConfig = [
            route("repeated-params/:id/:id?/:id", "routes/repeated-params.tsx")
          ]
        `,
        "app/routes/repeated-params.tsx": tsx`
          import { assertType } from "../assertType"
          import type { Route } from "./+types.repeated-params"

          export function loader({ params }: Route.LoaderArgs) {
            assertType<[string, string | undefined, string]>(params.id)
            return null
          }
        `,
      });
      const proc = typecheck(cwd);
      expect(proc.stdout.toString()).toBe("");
      expect(proc.stderr.toString()).toBe("");
      expect(proc.status).toBe(0);
    });

    test("splat", async () => {
      const cwd = await createProject({
        "vite.config.ts": viteConfig,
        "app/assertType.ts": assertType,
        "app/routes.ts": tsx`
          import { type RouteConfig, route } from "@react-router/dev/routes";

          export const routes: RouteConfig = [
            route("splat/*", "routes/splat.tsx")
          ]
        `,
        "app/routes/splat.tsx": tsx`
          import { assertType } from "../assertType"
          import type { Route } from "./+types.splat"

          export function loader({ params }: Route.LoaderArgs) {
            assertType<string>(params["*"])
            return null
          }
        `,
      });
      const proc = typecheck(cwd);
      expect(proc.stdout.toString()).toBe("");
      expect(proc.stderr.toString()).toBe("");
      expect(proc.status).toBe(0);
    });

    test("with extension", async () => {
      const cwd = await createProject({
        "vite.config.ts": viteConfig,
        "app/assertType.ts": assertType,
        "app/routes.ts": tsx`
          import { type RouteConfig, route } from "@react-router/dev/routes";

          export const routes: RouteConfig = [
            route(":lang.xml", "routes/param-with-ext.tsx"),
            route(":user?.pdf", "routes/optional-param-with-ext.tsx"),
          ]
        `,
        "app/routes/param-with-ext.tsx": tsx`
          import { assertType } from "../assertType"
          import type { Route } from "./+types.param-with-ext"

          export function loader({ params }: Route.LoaderArgs) {
            assertType<string>(params["lang"])
            return null
          }
        `,
        "app/routes/optional-param-with-ext.tsx": tsx`
          import { assertType } from "../assertType"
          import type { Route } from "./+types.optional-param-with-ext"

          export function loader({ params }: Route.LoaderArgs) {
            assertType<string | undefined>(params["user"])
            return null
          }
        `,
      });
      const proc = typecheck(cwd);
      expect(proc.stdout.toString()).toBe("");
      expect(proc.stderr.toString()).toBe("");
      expect(proc.status).toBe(0);
    });
  });

  test("clientLoader.hydrate = true", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/assertType.ts": assertType,
      "app/routes/_index.tsx": tsx`
        import { assertType } from "../assertType"
        import type { Route } from "./+types._index"

        export function loader() {
          return { server: "server" }
        }

        export function clientLoader() {
          return { client: "client" }
        }
        clientLoader.hydrate = true as const

        export function HydrateFallback() {
          return <h1>Loading...</h1>
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          assertType<{ client: string }>(loaderData)
          return <h1>Hello from {loaderData.client}!</h1>
        }
      `,
    });
    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });

  test("custom app dir", async () => {
    const cwd = await createProject({
      "react-router.config.ts": tsx`
        export default {
          appDirectory: "src/myapp",
        }
      `,
      "app/assertType.ts": assertType,
      "app/routes/products.$id.tsx": tsx`
        import { assertType } from "../assertType"
        import type { Route } from "./+types.products.$id"

        export function loader({ params }: Route.LoaderArgs) {
          assertType<string>(params.id)
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          assertType<string>(loaderData.planet)
          return <h1>Hello, {loaderData.planet}!</h1>
        }
      `,
    });
    fse.moveSync(path.join(cwd, "app"), path.join(cwd, "src/myapp"));

    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });
});
