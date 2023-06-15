import { test, expect } from "@playwright/test";

import { createFixture, js, json } from "./helpers/create-fixture";
import type { Fixture } from "./helpers/create-fixture";
import { selectHtml } from "./helpers/playwright-fixture";

test.describe("Custom Server Entry", () => {
  let fixture: Fixture;

  let DATA_HEADER_NAME = "X-Macaroni-Salad";
  let DATA_HEADER_VALUE = "Smoked Mozarella";

  test.beforeAll(async () => {
    fixture = await createFixture({
      config: {
        future: { v2_routeConvention: true },
      },
      files: {
        "app/entry.server.jsx": js`
          export default function handleRequest() {
            return new Response("");
          }

          export function handleDataRequest(response) {
            response.headers.set("${DATA_HEADER_NAME}", "${DATA_HEADER_VALUE}");
            return response;
          }
        `,

        "app/routes/_index.jsx": js`
          export function loader() {
            return ""
          }
          export default function () {
            return <div/>
          }
        `,
      },
    });
  });

  test("can manipulate a data response", async () => {
    let response = await fixture.requestData("/", "routes/_index");
    expect(response.headers.get(DATA_HEADER_NAME)).toBe(DATA_HEADER_VALUE);
  });
});

test.describe("Default Server Entry", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/index.jsx": js`
          export default function () {
            return <p>Hello World</p>
          }
        `,
      },
    });
  });

  test("renders", async () => {
    let response = await fixture.requestDocument("/");
    expect(selectHtml(await response.text(), "p")).toBe("<p>Hello World</p>");
  });
});

test.describe("Default Server Entry (React 17)", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/index.jsx": js`
          export default function () {
            return <p>Hello World</p>
          }
        `,
        "package.json": json({
          name: "remix-template-remix",
          private: true,
          sideEffects: false,
          scripts: {
            build:
              "node ../../../build/node_modules/@remix-run/dev/dist/cli.js build",
            dev: "node ../../../build/node_modules/@remix-run/dev/dist/cli.js dev",
            start:
              "node ../../../build/node_modules/@remix-run/serve/dist/cli.js build",
          },
          dependencies: {
            "@remix-run/node": "0.0.0-local-version",
            "@remix-run/react": "0.0.0-local-version",
            "@remix-run/serve": "0.0.0-local-version",
            isbot: "0.0.0-local-version",
            react: "17.0.2",
            "react-dom": "17.0.2",
          },
          devDependencies: {
            "@remix-run/dev": "0.0.0-local-version",
            "@types/react": "0.0.0-local-version",
            "@types/react-dom": "0.0.0-local-version",
            typescript: "0.0.0-local-version",
          },
          engines: {
            node: ">=14.0.0",
          },
        }),
      },
    });
  });

  test("renders", async () => {
    let response = await fixture.requestDocument("/");
    expect(selectHtml(await response.text(), "p")).toBe("<p>Hello World</p>");
  });
});
