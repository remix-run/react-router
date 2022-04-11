import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture";
import type { Fixture } from "./helpers/create-fixture";

test.describe("Server Entry", () => {
  let fixture: Fixture;

  let DATA_HEADER_NAME = "X-Macaroni-Salad";
  let DATA_HEADER_VALUE = "Smoked Mozarella";

  test.beforeAll(async () => {
    fixture = await createFixture({
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

        "app/routes/index.jsx": js`
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
    let response = await fixture.requestData("/", "routes/index");
    expect(response.headers.get(DATA_HEADER_NAME)).toBe(DATA_HEADER_VALUE);
  });
});
