import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture";
import type { Fixture } from "./helpers/create-fixture";

let fixture: Fixture;

test.describe("rendering", () => {
  let ROOT_$ = "FLAT";
  let ROOT_INDEX = "ROOT_INDEX";
  let FLAT_$ = "FLAT";
  let PARENT = "PARENT";
  let NESTED_$ = "NESTED_$";
  let NESTED_INDEX = "NESTED_INDEX";
  let PARENTLESS_$ = "PARENTLESS_$";

  test.beforeAll(async () => {
    fixture = await createFixture({
      future: { v2_routeConvention: true },
      files: {
        "app/root.jsx": js`
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

        "app/routes/_index.jsx": js`
          export default function() {
            return <h2>${ROOT_INDEX}</h2>;
          }
        `,

        "app/routes/$.jsx": js`
          export default function() {
            return <h2>${ROOT_$}</h2>;
          }
        `,

        "app/routes/flat.$.jsx": js`
          export default function() {
            return <h2>${FLAT_$}</h2>
          }
        `,

        "app/routes/nested.jsx": js`
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

        "app/routes/nested.$.jsx": js`
          export default function() {
            return <h2>${NESTED_$}</h2>
          }
        `,

        "app/routes/nested._index.jsx": js`
          export default function() {
            return <h2>${NESTED_INDEX}</h2>
          }
        `,

        "app/routes/parentless.$.jsx": js`
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

test.describe("root splat route without index", () => {
  test("matches routes correctly (v1)", async ({ page }) => {
    fixture = await createFixture({
      future: { v2_routeConvention: false },
      files: {
        "app/routes/$.jsx": js`
          export default function Component() {
            return <h1>Hello Splat</h1>
          }
        `,
      },
    });

    let res = await fixture.requestDocument("/");
    expect(await res.text()).toMatch("Hello Splat");

    res = await fixture.requestDocument("/splat");
    expect(await res.text()).toMatch("Hello Splat");

    res = await fixture.requestDocument("/splat/deep/path");
    expect(await res.text()).toMatch("Hello Splat");
  });

  test("matches routes correctly (v2)", async ({ page }) => {
    fixture = await createFixture({
      future: { v2_routeConvention: true },
      files: {
        "app/routes/$.jsx": js`
          export default function Component() {
            return <h1>Hello Splat</h1>
          }
        `,
      },
    });

    let res = await fixture.requestDocument("/");
    expect(await res.text()).toMatch("Hello Splat");

    res = await fixture.requestDocument("/splat");
    expect(await res.text()).toMatch("Hello Splat");

    res = await fixture.requestDocument("/splat/deep/path");
    expect(await res.text()).toMatch("Hello Splat");
  });
});

test.describe("root splat route with index", () => {
  test("matches routes correctly (v1)", async ({ page }) => {
    fixture = await createFixture({
      future: { v2_routeConvention: false },
      files: {
        "app/routes/index.jsx": js`
          export default function Component() {
            return <h1>Hello Index</h1>
          }
        `,
        "app/routes/$.jsx": js`
          export default function Component() {
            return <h1>Hello Splat</h1>
          }
        `,
      },
    });

    let res = await fixture.requestDocument("/");
    expect(await res.text()).toMatch("Hello Index");

    res = await fixture.requestDocument("/splat");
    expect(await res.text()).toMatch("Hello Splat");

    res = await fixture.requestDocument("/splat/deep/path");
    expect(await res.text()).toMatch("Hello Splat");
  });

  test("matches routes correctly (v2)", async ({ page }) => {
    fixture = await createFixture({
      future: { v2_routeConvention: true },
      files: {
        "app/routes/_index.jsx": js`
          export default function Component() {
            return <h1>Hello Index</h1>
          }
        `,
        "app/routes/$.jsx": js`
          export default function Component() {
            return <h1>Hello Splat</h1>
          }
        `,
      },
    });

    let res = await fixture.requestDocument("/");
    expect(await res.text()).toMatch("Hello Index");

    res = await fixture.requestDocument("/splat");
    expect(await res.text()).toMatch("Hello Splat");

    res = await fixture.requestDocument("/splat/deep/path");
    expect(await res.text()).toMatch("Hello Splat");
  });
});
