import type { HTTPResponse } from "puppeteer";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { AppFixture } from "./helpers/create-fixture";

describe("pathless layout routes", () => {
  let app: AppFixture;

  beforeAll(async () => {
    app = await createAppFixture(
      await createFixture({
        files: {
          "app/routes/index.jsx": js`
            import { redirect, json } from "@remix-run/node";
            import { Form, useActionData } from "@remix-run/react";

            export let loader = async () => {
              let headers = new Headers();
              headers.append("Set-Cookie", "foo=bar");
              headers.append("Set-Cookie", "bar=baz");
              return json({}, { headers });
            };

            export let action = async () => {
              let headers = new Headers();
              headers.append("Set-Cookie", "another=one");
              headers.append("Set-Cookie", "how-about=two");
              return json({success: true}, { headers });
            };

            export default function MultipleSetCookiesPage() {
              let actionData = useActionData();
              return (
                <>
                  <p>👋</p>
                  <Form method="post">
                    <button type="submit">Add cookies</button>
                  </Form>
                  {actionData?.success && <p data-testid="action-success">Success!</p>}
                </>
              );
            };
          `,
        },
      })
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  let responses: Array<HTTPResponse>;

  beforeAll(() => {
    responses = app.collectResponses((url) => url.pathname === "/");
  });

  let clearResponses = () => responses.splice(0, responses.length);

  beforeEach(() => {
    clearResponses();
  });

  it("should get multiple cookies from the loader", async () => {
    await app.goto("/");
    expect(responses[0].headers()["set-cookie"]).toBe(
      `
foo=bar
bar=baz
      `.trim()
    );
    expect(responses).toHaveLength(1);
  });

  it("should get multiple cookies from the action", async () => {
    await app.goto("/");
    clearResponses();
    await app.page.click("button[type=submit]");
    await app.page.waitForSelector(`[data-testid="action-success"]`);
    expect(responses[0].headers()["set-cookie"]).toBe(
      `
another=one
how-about=two
      `.trim()
    );
    // one for the POST and one for the GET
    expect(responses).toHaveLength(2);
  });
});
