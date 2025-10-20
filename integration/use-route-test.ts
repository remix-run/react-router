import tsx from "dedent";
import { expect } from "@playwright/test";

import { test } from "./helpers/fixtures";
import * as Stream from "./helpers/stream";
import getPort from "get-port";

test.use({
  files: {
    "app/expect-type.ts": tsx`
      export type Expect<T extends true> = T

      export type Equal<X, Y> =
        (<T>() => T extends X ? 1 : 2) extends
        (<T>() => T extends Y ? 1 : 2) ? true : false
    `,
    "app/routes.ts": tsx`
      import { type RouteConfig, route } from "@react-router/dev/routes"

      export default [
        route("parent", "routes/parent.tsx", [
          route("current", "routes/current.tsx")
        ]),
        route("other", "routes/other.tsx"),
      ] satisfies RouteConfig
    `,
    "app/root.tsx": tsx`
      import { Outlet } from "react-router"

      export const handle = { rootHandle: "root/handle" }
      export const loader = () => ({ rootLoader: "root/loader" })
      export const action = () => ({ rootAction: "root/action" })

      export default function Component() {
        return (
          <>
            <h1>Root</h1>
            <Outlet />
          </>
        )
      }
    `,
    "app/routes/parent.tsx": tsx`
      import { Outlet } from "react-router"

      export const handle = { parentHandle: "parent/handle" }
      export const loader = () => ({ parentLoader: "parent/loader" })
      export const action = () => ({ parentAction: "parent/action" })

      export default function Component() {
        return (
          <>
            <h2>Parent</h2>
            <Outlet />
          </>
        )
      }
    `,
    "app/routes/current.tsx": tsx`
      import { unstable_useRoute as useRoute } from "react-router"

      import type { Expect, Equal } from "../expect-type"

      export const handle = { currentHandle: "current/handle" }
      export const loader = () => ({ currentLoader: "current/loader" })
      export const action = () => ({ currentAction: "current/action" })

      export default function Component() {
        const current = useRoute()
        type Test1 = Expect<Equal<typeof current, {
          handle: unknown,
          loaderData: unknown,
          actionData: unknown,
        }>>

        const root = useRoute("root")
        type Test2 = Expect<Equal<typeof root, {
          handle: { rootHandle: string },
          loaderData: { rootLoader: string } | undefined,
          actionData: { rootAction: string } | undefined,
        }>>

        const parent = useRoute("routes/parent")
        type Test3 = Expect<Equal<typeof parent, {
          handle: { parentHandle: string },
          loaderData: { parentLoader: string } | undefined,
          actionData: { parentAction: string } | undefined
        } | undefined>>

        const other = useRoute("routes/other")
        type Test4 = Expect<Equal<typeof other, {
          handle: { otherHandle: string },
          loaderData: { otherLoader: string } | undefined,
          actionData: { otherAction: string } | undefined,
        } | undefined>>

        return (
          <>
            <pre data-root>{root.loaderData?.rootLoader}</pre>
            <pre data-parent>{parent?.loaderData?.parentLoader}</pre>
            {/* @ts-expect-error */}
            <pre data-current>{current?.loaderData?.currentLoader}</pre>
            <pre data-other>{other === undefined ? "undefined" : "something else"}</pre>
          </>
        )
      }
    `,
    "app/routes/other.tsx": tsx`
      export const handle = { otherHandle: "other/handle" }
      export const loader = () => ({ otherLoader: "other/loader" })
      export const action = () => ({ otherAction: "other/action" })

      export default function Component() {
        return <h2>Other</h2>
      }
    `,
  },
});

test("useRoute", async ({ $, page }) => {
  await $("pnpm typecheck");

  const port = await getPort();
  const url = `http://localhost:${port}`;

  const dev = $(`pnpm dev --port ${port}`);
  await Stream.match(dev.stdout, url);

  await page.goto(url + "/parent/current", { waitUntil: "networkidle" });

  await expect(page.locator("[data-root]")).toHaveText("root/loader");

  await expect(page.locator("[data-parent]")).toHaveText("parent/loader");

  await expect(page.locator("[data-current]")).toHaveText("current/loader");

  await expect(page.locator("[data-other]")).toHaveText("undefined");
});
