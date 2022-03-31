import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

let fixture: Fixture;
let app: AppFixture;

beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "node_modules/has-side-effects/package.json": `{
        "name": "has-side-effects",
        "version": "1.0.0",
        "main": "index.js"
      }`,
      "node_modules/has-side-effects/index.js": js`
        let message;
        (() => { message = process.env.___SOMETHING___ || "hello, world"; })();
        module.exports = () => message;
      `,
      "app/routes/index.jsx": js`
        import { json, useLoaderData, Link } from "remix";
        import sideEffectModules from "has-side-effects";

        export let loader = () => json(sideEffectModules());

        export default function Index() {
          let data = useLoaderData();

          return (
            <div>
              {data}
              <Link to="/burgers">Other Route</Link>
            </div>
          )
        }
      `,
    },
  });

  app = await createAppFixture(fixture);
});

afterAll(async () => app.close());

it("should log relevant error message", async () => {
  await app.goto("/");
  expect(await app.getHtml()).toMatch(
    "https://remix.run/pages/gotchas#server-code-in-client-bundles"
  );
});
