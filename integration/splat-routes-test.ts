import { createFixture, js } from "./helpers/create-fixture";
import type { Fixture } from "./helpers/create-fixture";

describe("rendering", () => {
  let fixture: Fixture;

  const ROOT_$ = "FLAT";
  const ROOT_INDEX = "ROOT_INDEX";
  const FLAT_$ = "FLAT";
  const PARENT = "PARENT";
  const NESTED_$ = "NESTED_$";
  const NESTED_INDEX = "NESTED_INDEX";
  const PARENTLESS_$ = "PARENTLESS_$";

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Outlet, Scripts } from "remix";
          export default function Root() {
            return (
              <html>
                <head />
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            )
          }
        `,

        "app/routes/index.jsx": js`
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
          import { Outlet } from "remix";
          export default function() {
            return (
              <div>
                <h2>${PARENT}</h2>
                <Outlet/>
              </div>
            )
          }
        `,

        "app/routes/nested/$.jsx": js`
          export default function() {
            return <h2>${NESTED_$}</h2>
          }
        `,

        "app/routes/nested/index.jsx": js`
          export default function() {
            return <h2>${NESTED_INDEX}</h2>
          }
        `,

        "app/routes/parentless/$.jsx": js`
          export default function() {
            return <h2>${PARENTLESS_$}</h2>
          }
        `
      }
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

  it("prioritizes index over root splat", async () => {
    let res = await fixture.requestDocument("/");
    expect(await res.text()).toMatch(ROOT_INDEX);
  });

  it("matches root splat", async () => {
    let res = await fixture.requestDocument("/twisted/sugar");
    expect(await res.text()).toMatch(ROOT_$);
  });

  it("prioritizes index over splat for parent route match", async () => {
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
