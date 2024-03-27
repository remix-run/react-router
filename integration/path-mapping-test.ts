import { test, expect } from "@playwright/test";

import { createFixture, js, json, mdx } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

let fixture: Fixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/components/my-lib/index.ts": js`
        export const pizza = "this is a pizza";
      `,

      "app/routes/_index.tsx": js`
        import { pizza } from "@mylib";
        import { json } from "@remix-run/node";
        import { useLoaderData, Link } from "@remix-run/react";

        export function loader() {
          return json(pizza);
        }

        export default function Index() {
          let data = useLoaderData();
          return (
            <div>
              {data}
            </div>
          )
        }
      `,

      "app/routes/tilde-alias.tsx": js`
        import { pizza } from "~/components/my-lib";
        import { json } from "@remix-run/node";
        import { useLoaderData, Link } from "@remix-run/react";

        export function loader() {
          return json(pizza);
        }

        export default function Index() {
          let data = useLoaderData();
          return (
            <div>
              {data}
            </div>
          )
        }
      `,

      "app/components/component.tsx": js`
        export function PizzaComponent() {
          return <span>this is a pizza</span>
        }
      `,

      "app/routes/mdx.mdx": mdx`
        ---
        meta:
          title: My First Post
          description: Isn't this awesome?
        headers:
          Cache-Control: no-cache
        ---

        import { PizzaComponent } from "@component";

        # Hello MDX!

        This is my first post.

        <PizzaComponent />
      `,

      "tsconfig.json": json({
        include: ["remix.env.d.ts", "**/*.ts", "**/*.tsx"],
        compilerOptions: {
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          isolatedModules: true,
          esModuleInterop: true,
          jsx: "react-jsx",
          moduleResolution: "node",
          resolveJsonModule: true,
          target: "ES2022",
          strict: true,
          baseUrl: ".",
          paths: {
            "~/*": ["./app/*"],
            "@mylib": ["./app/components/my-lib/index"],
            "@component": ["./app/components/component.tsx"],
          },

          // Remix takes care of building everything in \`remix build\`.
          noEmit: true,
        },
      }),
    },
  });
});

test("import internal library via alias other than ~", async () => {
  // test for https://github.com/remix-run/remix/issues/2298
  let response = await fixture.requestDocument("/");
  expect(await response.text()).toMatch("this is a pizza");
});

test("import internal library via ~ alias", async () => {
  let response = await fixture.requestDocument("/tilde-alias");
  expect(await response.text()).toMatch("this is a pizza");
});

test("works for mdx files", async () => {
  let response = await fixture.requestDocument("/mdx");
  expect(await response.text()).toMatch("this is a pizza");
});
