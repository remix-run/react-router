import { spawnSync } from "node:child_process";
import { mkdirSync, renameSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { expect, test } from "@playwright/test";
import dedent from "dedent";

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
          type Test = Expect<Equal<typeof params, { id: string} >>
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          type Test = Expect<Equal<typeof loaderData.planet, string>>
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
            route("only-required/:id/:id", "routes/only-required.tsx"),
            route("only-optional/:id?/:id?", "routes/only-optional.tsx"),
            route("optional-then-required/:id?/:id", "routes/optional-then-required.tsx"),
            route("required-then-optional/:id/:id?", "routes/required-then-optional.tsx"),
          ] satisfies RouteConfig;
        `,
        "app/routes/only-required.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/only-required"
          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { id: string }>>
            return null
          }
        `,
        "app/routes/only-optional.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/only-optional"
          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params.id, string | undefined>>
            return null
          }
        `,
        "app/routes/optional-then-required.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/optional-then-required"
          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params.id,  string>>
            return null
          }
        `,
        "app/routes/required-then-optional.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/required-then-optional"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params.id, string>>
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
            type Test = Expect<Equal<typeof params, { "*": string }>>
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
            type Test = Expect<Equal<typeof params, { lang: string }>>
            return null
          }
        `,
        "app/routes/optional-param-with-ext.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/optional-param-with-ext"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { user?: string }>>
            return null
          }
        `,
      });
      const proc = typecheck(cwd);
      expect(proc.stdout.toString()).toBe("");
      expect(proc.stderr.toString()).toBe("");
      expect(proc.status).toBe(0);
    });

    test("normalized params", async () => {
      const cwd = await createProject({
        "vite.config.ts": viteConfig,
        "app/expect-type.ts": expectType,
        "app/routes.ts": tsx`
          import { type RouteConfig, route, layout } from "@react-router/dev/routes";

          export default [
            route("parent/:p", "routes/parent.tsx", [
              route("route/:r", "routes/route.tsx", [
                route("child1/:c1a/:c1b", "routes/child1.tsx"),
                route("child2/:c2a/:c2b", "routes/child2.tsx")
              ]),
            ]),
            layout("routes/layout.tsx", [
              route("in-layout1/:id", "routes/in-layout1.tsx"),
              route("in-layout2/:id/:other", "routes/in-layout2.tsx")
            ])
          ] satisfies RouteConfig;
        `,
        "app/routes/parent.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/parent"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params,
              | { p: string, r?: undefined, c1a?: undefined,  c1b?: undefined, c2a?: undefined, c2b?: undefined }
              | { p: string, r: string, c1a?: undefined,  c1b?: undefined, c2a?: undefined, c2b?: undefined }
              | { p: string, r: string, c1a: string,  c1b: string, c2a?: undefined, c2b?: undefined }
              | { p: string, r: string, c1a?: undefined,  c1b?: undefined, c2a: string, c2b: string }
            >>
            return null
          }
        `,
        "app/routes/route.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/route"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params,
              | { p: string, r: string, c1a?: undefined,  c1b?: undefined, c2a?: undefined, c2b?: undefined }
              | { p: string, r: string, c1a: string,  c1b: string, c2a?: undefined, c2b?: undefined }
              | { p: string, r: string, c1a?: undefined,  c1b?: undefined, c2a: string, c2b: string }
            >>
            return null
          }
        `,
        "app/routes/child1.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/child1"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { p: string, r: string, c1a: string,  c1b: string }>>
            return null
          }
        `,
        "app/routes/child2.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/child2"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { p: string, r: string, c2a: string, c2b: string }>>
            return null
          }
        `,
        "app/routes/layout.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/layout"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { id: string, other?: undefined } | { id: string, other: string } >>
            return null
          }
        `,
        "app/routes/in-layout1.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/in-layout1"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { id: string }>>
            return null
          }
        `,
        "app/routes/in-layout2.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/in-layout2"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { id: string, other: string }>>
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
          type Test = Expect<Equal<typeof loaderData, { client: string }>>
          return <h1>Hello from {loaderData.client}!</h1>
        }
      `,
    });
    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });

  test("clientLoader data should not be serialized", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/expect-type.ts": expectType,
      "app/routes/_index.tsx": tsx`
        import { useRouteLoaderData } from "react-router"

        import type { Expect, Equal } from "../expect-type"
        import type { Route } from "./+types/_index"

        export function clientLoader({}: Route.ClientLoaderArgs) {
          return { fn: () => 0 }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          type Test1 = Expect<Equal<typeof loaderData, { fn: () => number }>>

          const routeLoaderData = useRouteLoaderData<typeof clientLoader>("routes/_index")
          type Test2 = Expect<Equal<typeof routeLoaderData, { fn: () => number} | undefined>>

          return <h1>Hello, world!</h1>
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
          type Test = Expect<Equal<typeof params, { id: string }>>
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          type Test = Expect<Equal<typeof loaderData.planet, string>>
          return <h1>Hello, {loaderData.planet}!</h1>
        }
      `,
    });
    mkdirSync(path.join(cwd, "src"));
    renameSync(path.join(cwd, "app"), path.join(cwd, "src/myapp"));

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
              route("current", "routes/current.tsx")
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

        export function meta({ matches }: Route.MetaArgs) {
          const parent1 = matches[1]
          type Test1 = Expect<Equal<typeof parent1.data, { parent1: number }>>

          const parent2 = matches[2]
          type Test2 = Expect<Equal<typeof parent2.data, { parent2: number }>>

          const current = matches[3]
          type Test3 = Expect<Equal<typeof current.data, { current: number }>>

          const child1 = matches[4]
          type Test4a = Expect<undefined extends typeof child1 ? true : false>
          if (child1) {
            type Test4b = Expect<Equal<typeof child1.data, unknown>>
          }
          return []
        }

        export default function Component({ matches }: Route.ComponentProps) {
          const parent1 = matches[1]
          type Test1 = Expect<Equal<typeof parent1.data, { parent1: number }>>

          const parent2 = matches[2]
          type Test2 = Expect<Equal<typeof parent2.data, { parent2: number }>>

          const current = matches[3]
          type Test3 = Expect<Equal<typeof current.data, { current: number }>>

          const child1 = matches[4]
          type Test4a = Expect<undefined extends typeof child1 ? true : false>
          if (child1) {
            type Test4b = Expect<Equal<typeof child1.data, unknown>>
          }
        }
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
          type Test = Expect<Equal<typeof params, { id: string }>>
          return { planet: "world" }
        }

        export default function Component({ loaderData }: Route.ComponentProps) {
          type Test = Expect<Equal<typeof loaderData.planet, string>>
          return <h1>Hello, {loaderData.planet}!</h1>
        }
      `,
    });

    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });

  test("href", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/expect-type.ts": expectType,
      "app/routes.ts": tsx`
        import path from "node:path";
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export default [
          route("optional-static/opt?", "routes/optional-static.tsx"),
          route("no-params", "routes/no-params.tsx"),
          route("required-param/:req", "routes/required-param.tsx"),
          route("optional-param/:opt?", "routes/optional-param.tsx"),
          route("/leading-and-trailing-slash/", "routes/leading-and-trailing-slash.tsx"),
          route("some-other-route", "routes/some-other-route.tsx"),
        ] satisfies RouteConfig;
      `,
      "app/routes/optional-static.tsx": tsx`
        export default function Component() {}
      `,
      "app/routes/no-params.tsx": tsx`
        export default function Component() {}
      `,
      "app/routes/required-param.tsx": tsx`
        export default function Component() {}
      `,
      "app/routes/optional-param.tsx": tsx`
        export default function Component() {}
      `,
      "app/routes/leading-and-trailing-slash.tsx": tsx`
        export default function Component() {}
      `,
      "app/routes/some-other-route.tsx": tsx`
        import { href } from "react-router"

        // @ts-expect-error
        href("/does-not-exist")

        href("/optional-static")
        href("/optional-static/opt")
        // @ts-expect-error
        href("/optional-static/opt?")

        href("/no-params")

        // @ts-expect-error
        href("/required-param/:req")
        href("/required-param/:req", { req: "hello" })

        // @ts-expect-error
        href("/optional-param")
        // @ts-expect-error
        href("/optional-param/:opt", { opt: "hello" })
        href("/optional-param/:opt?")
        href("/optional-param/:opt?", { opt: "hello" })

        href("/leading-and-trailing-slash")
        // @ts-expect-error
        href("/leading-and-trailing-slash/")

        export default function Component() {}
      `,
    });
    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });

  test.describe("virtual:react-router/server-build", async () => {
    test("static import matches 'createRequestHandler' argument type", async () => {
      const cwd = await createProject({
        "vite.config.ts": viteConfig,
        "app/routes.ts": tsx`
          import { type RouteConfig } from "@react-router/dev/routes";
          export default [] satisfies RouteConfig;
        `,
        "app/handler.ts": tsx`
          import { createRequestHandler } from "react-router";
          import * as serverBuild from "virtual:react-router/server-build";
          export default createRequestHandler(serverBuild);
        `,
      });

      const proc = typecheck(cwd);
      expect(proc.stdout.toString()).toBe("");
      expect(proc.stderr.toString()).toBe("");
      expect(proc.status).toBe(0);
    });

    test("works with tsconfig 'moduleDetection' set to 'force'", async () => {
      const cwd = await createProject({
        "vite.config.ts": viteConfig,
        "app/routes.ts": tsx`
          import { type RouteConfig } from "@react-router/dev/routes";
          export default [] satisfies RouteConfig;
        `,
        "app/handler.ts": tsx`
          import { createRequestHandler } from "react-router";
          import * as serverBuild from "virtual:react-router/server-build";
          export default createRequestHandler(serverBuild);
        `,
      });

      const tsconfig = JSON.parse(
        await readFile(path.join(cwd, "tsconfig.json"), "utf-8")
      );
      tsconfig.compilerOptions.moduleDetection = "force";
      await writeFile(
        path.join(cwd, "tsconfig.json"),
        JSON.stringify(tsconfig),
        "utf-8"
      );

      const proc = typecheck(cwd);
      expect(proc.stdout.toString()).toBe("");
      expect(proc.stderr.toString()).toBe("");
      expect(proc.status).toBe(0);
    });

    test("dynamic import matches 'createRequestHandler' function argument type", async () => {
      const cwd = await createProject({
        "vite.config.ts": viteConfig,
        "app/routes.ts": tsx`
          import { type RouteConfig } from "@react-router/dev/routes";
          export default [] satisfies RouteConfig;
        `,
        "app/handler.ts": tsx`
          import { createRequestHandler } from "react-router";
          export default createRequestHandler(
            () => import("virtual:react-router/server-build")
          );
        `,
      });

      const proc = typecheck(cwd);
      expect(proc.stdout.toString()).toBe("");
      expect(proc.stderr.toString()).toBe("");
      expect(proc.status).toBe(0);
    });
  });

  test("reuse route file at multiple paths", async () => {
    const cwd = await createProject({
      "vite.config.ts": viteConfig,
      "app/expect-type.ts": expectType,
      "app/routes.ts": tsx`
        import { type RouteConfig, route } from "@react-router/dev/routes";
        export default [
          route("base/:base", "routes/base.tsx", [
            route("home/:home", "routes/route.tsx", { id: "home" }),
            route("changelog/:changelog", "routes/route.tsx", { id: "changelog" }),
            route("splat/*", "routes/route.tsx", { id: "splat" }),
          ]),
          route("other/:other", "routes/route.tsx", { id: "other" })
        ] satisfies RouteConfig;
      `,
      "app/routes/base.tsx": tsx`
        import { Outlet } from "react-router"
        import type { Route } from "./+types/base"

        export function loader() {
          return { base: "hello" }
        }

        export default function Component() {
          return (
            <>
              <h1>Layout</h1>
              <Outlet/>
            </>
          )
        }
      `,
      "app/routes/route.tsx": tsx`
        import type { Expect, Equal } from "../expect-type"
        import type { Route } from "./+types/route"

        export function loader() {
          return { route: "world" }
        }

        export default function Component({ params, matches }: Route.ComponentProps) {
          type Test = Expect<Equal<typeof params,
            | {
                  base: string;
                  home: string;
                  changelog?: undefined;
                  "*"?: undefined;
                  other?: undefined;
                }
              | {
                  base: string;
                  home?: undefined;
                  changelog: string;
                  "*"?: undefined;
                  other?: undefined;
                }
              | {
                  base: string;
                  home?: undefined;
                  changelog?: undefined;
                  "*": string;
                  other?: undefined;
                }
              | {
                  base?: undefined;
                  home?: undefined;
                  changelog?: undefined;
                  "*"?: undefined;
                  other: string;
                }
          >>
          return <h1>Hello, world!</h1>
        }
      `,
    });

    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });
});
