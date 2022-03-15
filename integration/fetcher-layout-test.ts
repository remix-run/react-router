import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

let fixture: Fixture;
let app: AppFixture;

beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/layout.jsx": js`
        import { json, Outlet, useFetcher, useFormAction } from "remix";

        export let action = ({ params }) => json("layout action data");

        export default function Layout() {
          let fetcher = useFetcher();
          let action = useFormAction();

          let invokeFetcher = () => {
            fetcher.submit({}, { method: "post", action })
          };

          return (
            <div>
              <h1>Layout</h1>
              <button onClick={invokeFetcher}>Invoke Fetcher</button>
              {!!fetcher.data && <p id="layout-fetcher-data">{fetcher.data}</p>}
              <Outlet />
            </div>
          );
        }
      `,

      "app/routes/layout/index.jsx": js`
        import { json, useFetcher, useFormAction, useLoaderData } from "remix";

        export let loader = ({ params }) => json("index data");

        export let action = ({ params }) => json("index action data");

        export default function LayoutIndex() {
          let data = useLoaderData();
          let fetcher = useFetcher();
          let action = useFormAction(".", "post");

          
          let invokeFetcher = () => {
            console.log({action});
            fetcher.submit({}, { method: "post", action })
          };

          return (
            <>
              <p id="child-data">{data}</p>
              <button id="index-fetcher" onClick={invokeFetcher}>Invoke Index Fetcher</button>
              {!!fetcher.data && <p id="index-fetcher-data">{fetcher.data}</p>}
            </>
          );
        }
      `,

      "app/routes/layout/$param.jsx": js`
        import { json, useLoaderData } from "remix";

        export let loader = ({ params }) => json(params.param);

        export default function LayoutChild() {
          let data = useLoaderData();

          return <p id="child-data">{data}</p>;
        }
      `,
    },
  });

  app = await createAppFixture(fixture);
});

afterAll(async () => app.close());

it("fetcher calls layout route action when at index route", async () => {
  await app.goto("/layout");
  await app.clickElement("button");
  let dataElement = await app.getElement("#layout-fetcher-data");
  expect(dataElement.text()).toBe("layout action data");
  dataElement = await app.getElement("#child-data");
  expect(dataElement.text()).toBe("index data");
});

it("fetcher calls index route action when at index route", async () => {
  await app.goto("/layout");
  await app.clickElement("#index-fetcher");
  let dataElement = await app.getElement("#index-fetcher-data");
  expect(dataElement.text()).toBe("index action data");
  dataElement = await app.getElement("#child-data");
  expect(dataElement.text()).toBe("index data");
});

it("fetcher calls layout route action when at paramaterized route", async () => {
  await app.goto("/layout/foo");
  await app.clickElement("button");
  let dataElement = await app.getElement("#layout-fetcher-data");
  expect(dataElement.text()).toBe("layout action data");
  dataElement = await app.getElement("#child-data");
  expect(dataElement.text()).toBe("foo");
});
