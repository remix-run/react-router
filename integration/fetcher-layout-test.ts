import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/layout-action.tsx": js`
        import { Outlet, useFetcher, useFormAction } from "react-router";

        export let action = ({ params }) => "layout action data";

        export default function ActionLayout() {
          let fetcher = useFetcher();
          let action = useFormAction();

          let invokeFetcher = () => {
            fetcher.submit({}, { method: "post", action });
          };

          return (
            <div>
              <h1>Layout</h1>
              <button id="layout-fetcher" onClick={invokeFetcher}>Invoke Fetcher</button>
              {!!fetcher.data && <p id="layout-fetcher-data">{fetcher.data}</p>}
              <Outlet />
            </div>
          );
        }
      `,

      "app/routes/layout-action._index.tsx": js`
        import {
          useFetcher,
          useFormAction,
          useLoaderData,
        } from "react-router";

        export let loader = ({ params }) => "index data";

        export let action = ({ params }) => "index action data";

        export default function ActionLayoutIndex() {
          let data = useLoaderData();
          let fetcher = useFetcher();
          let action = useFormAction();

          let invokeFetcher = () => {
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

      "app/routes/layout-action.$param.tsx": js`
        import {
          useFetcher,
          useFormAction,
          useLoaderData,
        } from "react-router";

        export let loader = ({ params }) => params.param;

        export let action = ({ params }) => "param action data";

        export default function ActionLayoutChild() {
          let data = useLoaderData();
          let fetcher = useFetcher();
          let action = useFormAction();

          let invokeFetcher = () => {
            fetcher.submit({}, { method: "post", action })
          };

          return (
            <>
              <p id="child-data">{data}</p>
              <button id="param-fetcher" onClick={invokeFetcher}>Invoke Param Fetcher</button>
              {!!fetcher.data && <p id="param-fetcher-data">{fetcher.data}</p>}
            </>
          );
        }
      `,

      "app/routes/layout-loader.tsx": js`
        import { Outlet, useFetcher, useFormAction } from "react-router";

        export let loader = () => "layout loader data";

        export default function LoaderLayout() {
          let fetcher = useFetcher();
          let action = useFormAction();

          let invokeFetcher = () => {
            fetcher.load(action);
          };

          return (
            <div>
              <h1>Layout</h1>
              <button id="layout-fetcher" onClick={invokeFetcher}>Invoke Fetcher</button>
              {!!fetcher.data && <p id="layout-fetcher-data">{fetcher.data}</p>}
              <Outlet />
            </div>
          );
        }
      `,

      "app/routes/layout-loader._index.tsx": js`
        import {
          useFetcher,
          useFormAction,
          useLoaderData,
        } from "react-router";

        export let loader = ({ params }) => "index data";

        export default function ActionLayoutIndex() {
          let fetcher = useFetcher();
          let action = useFormAction();

          let invokeFetcher = () => {
            fetcher.load(action);
          };

          return (
            <>
              <button id="index-fetcher" onClick={invokeFetcher}>Invoke Index Fetcher</button>
              {!!fetcher.data && <p id="index-fetcher-data">{fetcher.data}</p>}
            </>
          );
        }
      `,

      "app/routes/layout-loader.$param.tsx": js`
        import {
          useFetcher,
          useFormAction,
          useLoaderData,
        } from "react-router";

        export let loader = ({ params }) => params.param;

        export default function ActionLayoutChild() {
          let fetcher = useFetcher();
          let action = useFormAction();

          let invokeFetcher = () => {
            fetcher.load(action);
          };

          return (
            <>
              <button id="param-fetcher" onClick={invokeFetcher}>Invoke Param Fetcher</button>
              {!!fetcher.data && <p id="param-fetcher-data">{fetcher.data}</p>}
            </>
          );
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("fetcher calls layout route action when at index route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-action");
  await app.clickElement("#layout-fetcher");
  await page.waitForSelector("#layout-fetcher-data");
  let dataElement = await app.getElement("#layout-fetcher-data");
  expect(dataElement.text()).toBe("layout action data");
  dataElement = await app.getElement("#child-data");
  expect(dataElement.text()).toBe("index data");
});

test("fetcher calls layout route loader when at index route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-loader");
  await app.clickElement("#layout-fetcher");
  await page.waitForSelector("#layout-fetcher-data");
  let dataElement = await app.getElement("#layout-fetcher-data");
  expect(dataElement.text()).toBe("layout loader data");
});

test("fetcher calls index route action when at index route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-action");
  await app.clickElement("#index-fetcher");
  await page.waitForSelector("#index-fetcher-data");
  let dataElement = await app.getElement("#index-fetcher-data");
  expect(dataElement.text()).toBe("index action data");
  dataElement = await app.getElement("#child-data");
  expect(dataElement.text()).toBe("index data");
});

test("fetcher calls index route loader when at index route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-loader");
  await app.clickElement("#index-fetcher");
  await page.waitForSelector("#index-fetcher-data");
  let dataElement = await app.getElement("#index-fetcher-data");
  expect(dataElement.text()).toBe("index data");
});

test("fetcher calls layout route action when at parameterized route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-action/foo");
  await app.clickElement("#layout-fetcher");
  await page.waitForSelector("#layout-fetcher-data");
  let dataElement = await app.getElement("#layout-fetcher-data");
  expect(dataElement.text()).toBe("layout action data");
  dataElement = await app.getElement("#child-data");
  expect(dataElement.text()).toBe("foo");
});

test("fetcher calls layout route loader when at parameterized route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-loader/foo");
  await app.clickElement("#layout-fetcher");
  await page.waitForSelector("#layout-fetcher-data");
  let dataElement = await app.getElement("#layout-fetcher-data");
  expect(dataElement.text()).toBe("layout loader data");
});

test("fetcher calls parameterized route route action", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-action/foo");
  await app.clickElement("#param-fetcher");
  await page.waitForSelector("#param-fetcher-data");
  let dataElement = await app.getElement("#param-fetcher-data");
  expect(dataElement.text()).toBe("param action data");
  dataElement = await app.getElement("#child-data");
  expect(dataElement.text()).toBe("foo");
});

test("fetcher calls parameterized route route loader", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/layout-loader/foo");
  await app.clickElement("#param-fetcher");
  await page.waitForSelector("#param-fetcher-data");
  let dataElement = await app.getElement("#param-fetcher-data");
  expect(dataElement.text()).toBe("foo");
});
