import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";
import { selectHtml } from "./helpers/playwright-fixture.js";

test.describe("Custom Server Entry", () => {
  let fixture: Fixture;

  let DATA_HEADER_NAME = "X-Macaroni-Salad";
  let DATA_HEADER_VALUE = "Smoked Mozarella";

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/entry.server.tsx": js`
          export default function handleRequest() {
            return new Response("");
          }

          export function handleDataRequest(response) {
            response.headers.set("${DATA_HEADER_NAME}", "${DATA_HEADER_VALUE}");
            return response;
          }
        `,

        "app/routes/_index.tsx": js`
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
        "app/routes/_index.tsx": js`
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
