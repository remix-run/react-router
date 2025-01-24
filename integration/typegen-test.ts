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

const expectType = tsx`
  export type Expect<T extends true> = T

  export type Equal<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? true : false
`;

test.describe("typegen", () => {
  test("basic", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/expect-type.ts": expectType,
      "app/routes.ts": tsx`
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export default [
          route("products/:id", "routes/product.tsx")
        ] satisfies RouteConfig;
      `,
      "app/routes/product.tsx": tsx`
        import type { Expect, Equal } from "../expect-type"
        import type { Route } from "./+types/product"

        export function loader({ params }: Route.LoaderArgs) {
          type Assert = Expect<Equal<typeof params, { id: string }>>
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          type Assert = Expect<Equal<typeof loaderData, { planet: string }>>
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
        "app/expect-type.ts": expectType,
        "app/routes.ts": tsx`
          import { type RouteConfig, route } from "@react-router/dev/routes";

          export default [
            route("repeated-params/:id/:id?/:id", "routes/repeated-params.tsx")
          ] satisfies RouteConfig;
        `,
        "app/routes/repeated-params.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/repeated-params"

          export function loader({ params }: Route.LoaderArgs) {
            type Assert = Expect<Equal<typeof params, { id: string }>>
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
        "app/expect-type.ts": expectType,
        "app/routes.ts": tsx`
          import { type RouteConfig, route } from "@react-router/dev/routes";

          export default [
            route("splat/*", "routes/splat.tsx")
          ] satisfies RouteConfig;
        `,
        "app/routes/splat.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/splat"

          export function loader({ params }: Route.LoaderArgs) {
            type Assert = Expect<Equal<typeof params, { "*": string }>>
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
        "app/expect-type.ts": expectType,
        "app/routes.ts": tsx`
          import { type RouteConfig, route } from "@react-router/dev/routes";

          export default [
            route(":lang.xml", "routes/param-with-ext.tsx"),
            route(":user?.pdf", "routes/optional-param-with-ext.tsx"),
          ] satisfies RouteConfig;
        `,
        "app/routes/param-with-ext.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/param-with-ext"

          export function loader({ params }: Route.LoaderArgs) {
            type Assert = Expect<Equal<typeof params, { "lang": string }>>
            return null
          }
        `,
        "app/routes/optional-param-with-ext.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/optional-param-with-ext"

          export function loader({ params }: Route.LoaderArgs) {
            type Assert = Expect<Equal<typeof params, { user?: string }>>
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
      "app/expect-type.ts": expectType,
      "app/routes/_index.tsx": tsx`
        import type { Expect, Equal } from "../expect-type"
        import type { Route } from "./+types/_index"

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
          type Assert = Expect<Equal<typeof loaderData, { client: string }>>
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
      "vite.config.ts": viteConfig,
      "react-router.config.ts": tsx`
        export default {
          appDirectory: "src/myapp",
        }
      `,
      "app/expect-type.ts": expectType,
      "app/routes/products.$id.tsx": tsx`
        import type { Expect, Equal } from "../expect-type"
        import type { Route } from "./+types/products.$id"

        export function loader({ params }: Route.LoaderArgs) {
          type Assert = Expect<Equal<typeof params, { id: string }>>
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          type Assert = Expect<Equal<typeof loaderData, { planet: string }>>
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

  test("matches", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/expect-type.ts": expectType,
      "app/routes.ts": tsx`
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export default [
          route("parent1/:parent1", "routes/parent1.tsx", [
            route("parent2/:parent2", "routes/parent2.tsx", [
              route("current", "routes/current.tsx", [
                route("childA/:a", "routes/childA.tsx"),
                route("childB/:b?", "routes/childB.tsx"),
              ])
            ])
          ])
        ] satisfies RouteConfig;
      `,
      "app/routes/parent1.tsx": tsx`
        import { Outlet } from "react-router"

        export function loader() {
          return { parent1: 1 }
        }

        export default function Component() {
          return (
            <section>
              <h1>Parent1</h1>
              <Outlet />
            </section>
          )
        }
      `,
      "app/routes/parent2.tsx": tsx`
        import { Outlet } from "react-router"

        export function loader() {
          return { parent2: 2 }
        }

        export default function Component() {
          return (
            <section>
              <h2>Parent2</h2>
              <Outlet />
            </section>
          )
        }
      `,
      "app/routes/current.tsx": tsx`
        import type { Expect, Equal } from "../expect-type"
        import type { Route } from "./+types/current"

        export function loader() {
          return { current: 3 }
        }

        type Expected = [
          {
            id: "root";
            params:
              | { parent1: string }
              | {
                  parent1: string;
                  parent2: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  a: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  b?: string;
                };
            data: undefined;
          },
          {
            id: "routes/parent1";
            params:
              | {
                  parent1: string;
                  parent2: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  a: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  b?: string;
                };
            data: {
              parent1: number;
            };
          },
          {
            id: "routes/parent2";
            params:
              | {
                  parent1: string;
                  parent2: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  a: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  b?: string;
                };
          },
          {
            id: "routes/current";
            params:
              | {
                  parent1: string;
                  parent2: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  a: string;
                }
              | {
                  parent1: string;
                  parent2: string;
                  b?: string;
                };
            data: {
              current: number;
            };
          },
          (
            | {
                id: "routes/childA";
                params: {
                  parent1: string;
                  parent2: string;
                  a: string;
                };
                data: {
                  childA: number;
                };
              }
            | {
                id: "routes/childB";
                params: {
                  parent1: string;
                  parent2: string;
                  b?: string;
                };
                data: {
                  childB: number;
                };
              }
          )
        ]

        export function meta({ matches }: Route.MetaArgs) {
          type Test = Expect<typeof matches extends Expected ? true : false>
          return []
        }

        export default function Component({ matches }: Route.ComponentProps) {
          type Test = Expect<typeof matches extends Expected ? true : false>
        }
      `,
      "app/routes/childA.tsx": tsx`
        export function loader() {
          return { childA: 4 }
        }

        export default function Component() {}
      `,
      "app/routes/childB.tsx": tsx`
        export function loader() {
          return { childB: 4 }
        }

        export default function Component() {}
      `,
    });
    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });

  test("route files with absolute paths", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/expect-type.ts": expectType,
      "app/routes.ts": tsx`
        import path from "node:path";
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export default [
          route("absolute/:id", path.resolve(__dirname, "routes/absolute.tsx")),
        ] satisfies RouteConfig;
      `,
      "app/routes/absolute.tsx": tsx`
        import type { Expect, Equal } from "../expect-type"
        import type { Route } from "./+types/absolute"

        export function loader({ params }: Route.LoaderArgs) {
          type Assert = Expect<Equal<typeof params, { id: string }>>
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          type Assert = Expect<Equal<typeof loaderData, { planet: string }>>
          return <h1>Hello, {loaderData.planet}!</h1>
        }
      `,
    });

    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });
});
