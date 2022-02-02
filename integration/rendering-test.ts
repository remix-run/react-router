import {
  createAppFixture,
  createFixture,
  js,
  selectHtml
} from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("rendering", () => {
  let fixture: Fixture;
  let app: AppFixture;

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
                  <div id="content">
                    <h1>Root</h1>
                    <Outlet />
                  </div>
                  <Scripts />
                </body>
              </html>
            )
          }
        `,

        "app/routes/index.jsx": js`
          export default function() {
            return <h2>Index</h2>;
          }
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("server renders matching routes", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(selectHtml(await res.text(), "#content")).toMatchInlineSnapshot(`
      "<div id=\\"content\\">
        <h1>Root</h1>
        <h2>Index</h2>
      </div>"
    `);
  });

  it("hydrates", async () => {
    await app.goto("/");
    expect(await app.getHtml("#content")).toMatchInlineSnapshot(`
      "<div id=\\"content\\">
        <h1>Root</h1>
        <h2>Index</h2>
      </div>"
    `);
  });
});
