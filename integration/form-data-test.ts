import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

let fixture: Fixture;

test.describe("multi fetch", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
          import { json } from "@remix-run/node";

          export async function action({ request }) {
            try {
              await request.formData()
            } catch {
              return json("no pizza");
            }
            return json("pizza");
          }
        `,
      },
    });
  });

  test("invalid content-type does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "application/json" },
    });
    expect(await response.text()).toMatch("no pizza");
  });

  test("invalid urlencoded body does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "$rofl this is totally invalid$",
    });
    expect(await response.text()).toMatch("pizza");
  });

  test("invalid multipart content-type does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "multipart/form-data" },
      body: "$rofl this is totally invalid$",
    });
    expect(await response.text()).toMatch("pizza");
  });

  test("invalid multipart body does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "multipart/form-data; boundary=abc" },
      body: "$rofl this is totally invalid$",
    });
    expect(await response.text()).toMatch("pizza");
  });
});

// Duplicate suite of the tests above running with single fetch enabled
// TODO(v3): remove the above suite of tests and just keep these
test.describe("single fetch", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      singleFetch: true,
      files: {
        "app/routes/_index.tsx": js`
          import { json } from "@remix-run/node";

          export async function action({ request }) {
            try {
              await request.formData()
            } catch {
              return json("no pizza");
            }
            return json("pizza");
          }
        `,
      },
    });
  });

  test("invalid content-type does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "application/json" },
    });
    expect(await response.text()).toMatch("no pizza");
  });

  test("invalid urlencoded body does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "$rofl this is totally invalid$",
    });
    expect(await response.text()).toMatch("pizza");
  });

  test("invalid multipart content-type does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "multipart/form-data" },
      body: "$rofl this is totally invalid$",
    });
    expect(await response.text()).toMatch("pizza");
  });

  test("invalid multipart body does not crash server", async () => {
    let response = await fixture.requestDocument("/", {
      method: "post",
      headers: { "content-type": "multipart/form-data; boundary=abc" },
      body: "$rofl this is totally invalid$",
    });
    expect(await response.text()).toMatch("pizza");
  });
});
