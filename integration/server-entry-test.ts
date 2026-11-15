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
    let response = await fixture.requestSingleFetchData("/.data");
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
    expect(await selectHtml(await response.text(), "p")).toBe(
      "<p>Hello World</p>",
    );
  });
});

test.describe("Server Entry unstable_validateActionOrigin", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/entry.server.tsx": js`
          export default function handleRequest(request, status, headers) {
            return new Response("", { status, headers });
          }

          export function unstable_validateActionOrigin({ request, allowed }) {
            return allowed || request.headers.get("X-Forwarded-Proto") === "https";
          }
        `,

        "app/routes/_index.tsx": js`
          export function action() {
            return null;
          }
          export default function () {
            return <div/>
          }
        `,
      },
    });
  });

  // The fixture serves `test://test`, whose origin never matches a browser
  // `https:` origin, so only the exported function can let a submission through
  let submit = (headers: Record<string, string>) =>
    fixture.requestDocument("/?index", {
      method: "POST",
      headers: { Origin: "https://test", ...headers },
    });

  test("runs an action the exported function allows", async () => {
    let response = await submit({ "X-Forwarded-Proto": "https" });
    expect(response.status).toBe(200);
  });

  test("rejects an action the exported function does not allow", async () => {
    let response = await submit({});
    expect(response.status).toBe(400);
  });
});
