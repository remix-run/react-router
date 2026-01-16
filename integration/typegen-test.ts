import fs from "node:fs/promises";

import tsx from "dedent";
import * as Path from "pathe";

import { test } from "./helpers/fixtures";
import { reactRouterConfig } from "./helpers/vite";

const viteConfig = ({ rsc }: { rsc: boolean }) => {
  const reactRouterImportSpecifier = rsc
    ? "unstable_reactRouterRSC as reactRouter"
    : "reactRouter";
  return tsx`
    import { ${reactRouterImportSpecifier} } from "@react-router/dev/vite";

    export default {
      plugins: [reactRouter()],
    };
  `;
};

test.use({
  files: {
    "vite.config.ts": viteConfig({ rsc: false }),
    "app/expect-type.ts": tsx`
      export type Expect<T extends true> = T

      export type Equal<X, Y> =
        (<T>() => T extends X ? 1 : 2) extends
        (<T>() => T extends Y ? 1 : 2) ? true : false
    `,
  },
});

test.describe("typegen", () => {
  test("basic", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("repeated params", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("params with extension", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("normalized param", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("splat", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("clientLoader.hydrate = true", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("clientLoader data should not be serialized", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("custom app dir", async ({ cwd, edit, $ }) => {
    await edit({
      "react-router.config.ts": reactRouterConfig({
        appDirectory: "src/myapp",
      }),
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
    await fs.mkdir(Path.join(cwd, "src"));
    await fs.rename(Path.join(cwd, "app"), Path.join(cwd, "src/myapp"));
    await $("pnpm typecheck");
  });

  test("matches", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("route files with absolute paths", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("route files with paths outside of app directory", async ({
    cwd,
    edit,
    $,
  }) => {
    await fs.mkdir(Path.join(cwd, "node_modules/external_dependency"), {
      recursive: true,
    });
    await edit({
      "app/routes.ts": tsx`
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export default [
          route("outside/:id", "../node_modules/external_dependency/index.js"),
        ] satisfies RouteConfig;
      `,
      "node_modules/external_dependency/index.js": tsx`
        export default function Component() {
          return <div>External Dependency</div>
        }
      `,
    });
    await $("pnpm typecheck");
  });

  test("href", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test("reuse route file at multiple paths", async ({ edit, $ }) => {
    await edit({
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
    await $("pnpm typecheck");
  });

  test.describe("virtual:react-router/server-build", async () => {
    test("static import matches 'createRequestHandler' argument type", async ({
      edit,
      $,
    }) => {
      await edit({
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
      await $("pnpm typecheck");
    });

    test("works with tsconfig 'moduleDetection' set to 'force'", async ({
      edit,
      $,
    }) => {
      await edit({
        "app/routes.ts": tsx`
          import { type RouteConfig } from "@react-router/dev/routes";
          export default [] satisfies RouteConfig;
        `,
        "app/handler.ts": tsx`
          import { createRequestHandler } from "react-router";
          import * as serverBuild from "virtual:react-router/server-build";
          export default createRequestHandler(serverBuild);
        `,
        "tsconfig.json": (contents) => {
          const tsconfig = JSON.parse(contents);
          tsconfig.compilerOptions.moduleDetection = "force";
          return JSON.stringify(tsconfig, null, 2);
        },
      });
      await $("pnpm typecheck");
    });

    test("dynamic import matches 'createRequestHandler' function argument type", async ({
      edit,
      $,
    }) => {
      await edit({
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
      await $("pnpm typecheck");
    });
  });

  test.describe("server-first route component detection", () => {
    test.describe("ServerComponent export", () => {
      test("when RSC Framework Mode plugin is present", async ({ edit, $ }) => {
        await edit({
          "vite.config.ts": viteConfig({ rsc: true }),
          "app/routes.ts": tsx`
            import { type RouteConfig, route } from "@react-router/dev/routes";

            export default [
              route("server-component/:id", "routes/server-component.tsx")
            ] satisfies RouteConfig;
          `,
          "app/routes/server-component.tsx": tsx`
            import type { Expect, Equal } from "../expect-type"
            import type { Route } from "./+types/server-component"

            export function loader({ params }: Route.LoaderArgs) {
              type Test = Expect<Equal<typeof params, { id: string} >>
              return { server: "server" }
            }

            export function clientLoader() {
              return { client: "client" }
            }

            export function action() {
              return { server: "server" }
            }

            export function clientAction() {
              return { client: "client" }
            }

            export function ServerComponent({
              loaderData,
              actionData
            }: Route.ComponentProps) {
              type TestLoaderData = Expect<Equal<typeof loaderData, { server: string }>>
              type TestActionData = Expect<Equal<typeof actionData, { server: string } | undefined>>

              return (
                <>
                  <h1>ServerComponent</h1>
                  <p>Loader data: {loaderData.server}</p>
                  <p>Action data: {actionData?.server}</p>
                </>
              )
            }

            export function ErrorBoundary({
              loaderData,
              actionData
            }: Route.ErrorBoundaryProps) {
              type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | undefined>>
              type TestActionData = Expect<Equal<typeof actionData, { server: string } | undefined>>

              return (
                <>
                  <h1>ErrorBoundary</h1>
                  <p>Loader data: {loaderData?.server}</p>
                  <p>Action data: {actionData?.server}</p>
                </>
              )
            }

            export function HydrateFallback({
              loaderData,
              actionData
            }: Route.HydrateFallbackProps) {
              type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | undefined>>
              type TestActionData = Expect<Equal<typeof actionData, { server: string } | undefined>>

              return (
                <>
                  <h1>HydrateFallback</h1>
                  <p>Loader data: {loaderData?.server}</p>
                  <p>Action data: {actionData?.server}</p>
                </>
              )
            }
          `,
        });
        await $("pnpm typecheck");
      });

      test("when RSC Framework Mode plugin is not present", async ({
        edit,
        $,
      }) => {
        await edit({
          "vite.config.ts": viteConfig({ rsc: false }),
          "app/routes.ts": tsx`
            import { type RouteConfig, route } from "@react-router/dev/routes";

            export default [
              route("server-component/:id", "routes/server-component.tsx")
            ] satisfies RouteConfig;
          `,
          "app/routes/server-component.tsx": tsx`
            import type { Expect, Equal } from "../expect-type"
            import type { Route } from "./+types/server-component"

            export function loader({ params }: Route.LoaderArgs) {
              type Test = Expect<Equal<typeof params, { id: string} >>
              return { server: "server" }
            }

            export function clientLoader() {
              return { client: "client" }
            }

            export function action() {
              return { server: "server" }
            }

            export function clientAction() {
              return { client: "client" }
            }

            // This export is not used in standard Framework Mode. This is just
            // to test that the typegen is unaffected by this export outside of
            // RSC Framework Mode.
            export function ServerComponent({
              loaderData,
              actionData
            }: Route.ComponentProps) {
              type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | { client: string }>>
              type TestActionData = Expect<Equal<typeof actionData, { server: string } | { client: string } | undefined>>

              return (
                <>
                  <h1>ServerComponent (unused)</h1>
                  <p>Loader data: {"server" in loaderData ? loaderData.server : loaderData.client}</p>
                  {actionData && <p>Action data: {"server" in actionData ? actionData.server : actionData.client}</p>}
                </>
              )
            }

            export function ErrorBoundary({
              loaderData,
              actionData
            }: Route.ErrorBoundaryProps) {
              type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | { client: string } | undefined>>
              type TestActionData = Expect<Equal<typeof actionData, { server: string } | { client: string } | undefined>>

              return (
                <>
                  <h1>ErrorBoundary</h1>
                  {loaderData && <p>Loader data: {"server" in loaderData ? loaderData.server : loaderData.client}</p>}
                  {actionData && <p>Action data: {"server" in actionData ? actionData.server : actionData.client}</p>}
                </>
              )
            }

            export function HydrateFallback({
              loaderData,
              actionData
            }: Route.HydrateFallbackProps) {
              type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | { client: string } | undefined>>
              type TestActionData = Expect<Equal<typeof actionData, { server: string } | { client: string } | undefined>>

              return (
                <>
                  <h1>HydrateFallback</h1>
                  {loaderData && <p>Loader data: {"server" in loaderData ? loaderData.server : loaderData.client}</p>}
                  {actionData && <p>Action data: {"server" in actionData ? actionData.server : actionData.client}</p>}
                </>
              )
            }
          `,
        });
        await $("pnpm typecheck");
      });
    });

    test.describe("default export", () => {
      const clientFirstRouteFiles = {
        "app/routes.ts": tsx`
          import { type RouteConfig, route } from "@react-router/dev/routes";

          export default [
            route("client-component/:id", "routes/client-component.tsx")
          ] satisfies RouteConfig;
        `,
        "app/routes/client-component.tsx": tsx`
          import type { Expect, Equal } from "../expect-type"
          import type { Route } from "./+types/client-component"

          export function loader({ params }: Route.LoaderArgs) {
            type Test = Expect<Equal<typeof params, { id: string} >>
            return { server: "server" }
          }

          export function clientLoader() {
            return { client: "client" }
          }

          export function action() {
            return { server: "server" }
          }

          export function clientAction() {
            return { client: "client" }
          }

          export default function ClientComponent({
            loaderData,
            actionData
          }: Route.ComponentProps) {
            type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | { client: string }>>
            type TestActionData = Expect<Equal<typeof actionData, { server: string } | { client: string } | undefined>>

            return (
              <>
                <h1>default (Component)</h1>
                <p>Loader data: {"server" in loaderData ? loaderData.server : loaderData.client}</p>
                {actionData && <p>Action data: {"server" in actionData ? actionData.server : actionData.client}</p>}
              </>
            )
          }

          export function ErrorBoundary({
            loaderData,
            actionData
          }: Route.ErrorBoundaryProps) {
            type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | { client: string } | undefined>>
            type TestActionData = Expect<Equal<typeof actionData, { server: string } | { client: string } | undefined>>

            return (
              <>
                <h1>ErrorBoundary</h1>
                {loaderData && <p>Loader data: {"server" in loaderData ? loaderData.server : loaderData.client}</p>}
                {actionData && <p>Action data: {"server" in actionData ? actionData.server : actionData.client}</p>}
              </>
            )
          }

          export function HydrateFallback({
            loaderData,
            actionData
          }: Route.HydrateFallbackProps) {
            type TestLoaderData = Expect<Equal<typeof loaderData, { server: string } | { client: string } | undefined>>
            type TestActionData = Expect<Equal<typeof actionData, { server: string } | { client: string } | undefined>>

            return (
              <>
                <h1>HydrateFallback</h1>
                {loaderData && <p>Loader data: {"server" in loaderData ? loaderData.server : loaderData.client}</p>}
                {actionData && <p>Action data: {"server" in actionData ? actionData.server : actionData.client}</p>}
              </>
            )
          }
        `,
      };

      test("when RSC Framework Mode plugin is present", async ({ edit, $ }) => {
        await edit({
          "vite.config.ts": viteConfig({ rsc: true }),
          ...clientFirstRouteFiles,
        });
        await $("pnpm typecheck");
      });

      test("when RSC Framework Mode plugin is not present", async ({
        edit,
        $,
      }) => {
        await edit({
          "vite.config.ts": viteConfig({ rsc: false }),
          ...clientFirstRouteFiles,
        });
        await $("pnpm typecheck");
      });
    });
  });

  test("md/mdx route", async () => {
    const cwd = await createProject({
      "vite.config.ts": tsx`
        import mdx from "@mdx-js/rollup";
        import { reactRouter } from "@react-router/dev/vite";

        export default {
          plugins: [mdx(), reactRouter()],
        };
      `,
      "app/routes.ts": tsx`
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export default [
          route("home", "routes/home.md"),
          route("changelog", "routes/changelog.mdx"),
        ] satisfies RouteConfig;
      `,
      "app/routes/home.md": tsx`
        # Lorem ipsum
      `,
      "app/routes/changelog.mdx": tsx`
        # Lorem ipsum
      `,
    });

    const proc = typecheck(cwd);
    expect(proc.stdout.toString()).toBe("");
    expect(proc.stderr.toString()).toBe("");
    expect(proc.status).toBe(0);
  });
});
