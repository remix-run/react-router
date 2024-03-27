import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

test.describe("rendering", () => {
  let fixture: Fixture;

  let ROOT_$ = "FLAT";
  let ROOT_INDEX = "ROOT_INDEX";
  let FLAT_$ = "FLAT";
  let PARENT = "PARENT";
  let NESTED_$ = "NESTED_$";
  let NESTED_INDEX = "NESTED_INDEX";
  let PARENTLESS_$ = "PARENTLESS_$";

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,

        "app/routes/_index.tsx": js`
          export default function() {
            return <h2>${ROOT_INDEX}</h2>;
          }
        `,

        "app/routes/$.tsx": js`
          export default function() {
            return <h2>${ROOT_$}</h2>;
          }
        `,

        "app/routes/flat.$.tsx": js`
          export default function() {
            return <h2>${FLAT_$}</h2>
          }
        `,

        "app/routes/nested.tsx": js`
          import { Outlet } from "@remix-run/react";
          export default function() {
            return (
              <div>
                <h2>${PARENT}</h2>
                <Outlet/>
              </div>
            )
          }
        `,

        "app/routes/nested.$.tsx": js`
          export default function() {
            return <h2>${NESTED_$}</h2>
          }
        `,

        "app/routes/nested._index.tsx": js`
          export default function() {
            return <h2>${NESTED_INDEX}</h2>
          }
        `,

        "app/routes/parentless.$.tsx": js`
          export default function() {
            return <h2>${PARENTLESS_$}</h2>
          }
        `,
      },
    });
  });

  test("flat exact match", async () => {
    let res = await fixture.requestDocument("/flat");
    expect(await res.text()).toMatch(FLAT_$);
  });

  test("flat deep match", async () => {
    let res = await fixture.requestDocument("/flat/swig");
    expect(await res.text()).toMatch(FLAT_$);
  });

  test("prioritizes index over root splat", async () => {
    let res = await fixture.requestDocument("/");
    expect(await res.text()).toMatch(ROOT_INDEX);
  });

  test("matches root splat", async () => {
    let res = await fixture.requestDocument("/twisted/sugar");
    expect(await res.text()).toMatch(ROOT_$);
  });

  test("prioritizes index over splat for parent route match", async () => {
    let res = await fixture.requestDocument("/nested");
    expect(await res.text()).toMatch(NESTED_INDEX);
  });

  test("nested child", async () => {
    let res = await fixture.requestDocument("/nested/sodalicious");
    expect(await res.text()).toMatch(NESTED_$);
  });

  test("parentless exact match", async () => {
    let res = await fixture.requestDocument("/parentless");
    expect(await res.text()).toMatch(PARENTLESS_$);
  });

  test("parentless deep match", async () => {
    let res = await fixture.requestDocument("/parentless/chip");
    expect(await res.text()).toMatch(PARENTLESS_$);
  });
});
