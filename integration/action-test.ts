import {
  createFixture,
  createAppFixture,
  selectHtml,
  js
} from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("actions", () => {
  let fixture: Fixture;
  let app: AppFixture;

  const FIELD_NAME = "message";
  const WAITING_VALUE = "Waiting...";
  const SUBMITTED_VALUE = "Submission";
  const THROWS_REDIRECT = "redirect-throw";
  const REDIRECT_TARGET = "page";
  const PAGE_TEXT = "PAGE_TEXT";

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/urlencoded.jsx": js`
          import { Form, useActionData } from "remix";

          export let action = async ({ request }) => {
            let formData = await request.formData();
            return formData.get("${FIELD_NAME}");
          };

          export default function Actions() {
            let data = useActionData()

            return (
              <Form method="post" id="form">
                <p id="text">
                  {data ? <span id="action-text">{data}</span> : "${WAITING_VALUE}"}
                </p>
                <p>
                  <input type="text" defaultValue="${SUBMITTED_VALUE}" name="${FIELD_NAME}" />
                  <button type="submit" id="submit">Go</button>
                </p>
              </Form>
            );
          }
        `,

        [`app/routes/${THROWS_REDIRECT}.jsx`]: js`
          import { Form, redirect } from "remix";

          export function action() {
            throw redirect("/${REDIRECT_TARGET}")
          }

          export default function () {
            return (
              <Form method="post">
                <button type="submit">Go</button>
              </Form>
            )
          }
        `,

        [`app/routes/${REDIRECT_TARGET}.jsx`]: js`
          export default function () {
            return <div>${PAGE_TEXT}</div>
          }
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("is not called on document GET requests", async () => {
    let res = await fixture.requestDocument("/urlencoded");
    let html = selectHtml(await res.text(), "#text");
    expect(html).toMatch(WAITING_VALUE);
  });

  it("is called on document POST requests", async () => {
    const FIELD_VALUE = "cheeseburger";

    let params = new URLSearchParams();
    params.append(FIELD_NAME, FIELD_VALUE);

    let res = await fixture.postDocument("/urlencoded", params);

    let html = selectHtml(await res.text(), "#text");
    expect(html).toMatch(FIELD_VALUE);
  });

  it("is called on script transition POST requests", async () => {
    await app.goto(`/urlencoded`);
    let html = await app.getHtml("#text");
    expect(html).toMatch(WAITING_VALUE);

    await app.page.click("button[type=submit]");
    await app.page.waitForSelector("#action-text");
    html = await app.getHtml("#text");
    expect(html).toMatch(SUBMITTED_VALUE);
  });

  it("redirects a thrown response on document requests", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(`/${THROWS_REDIRECT}`, params);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe(`/${REDIRECT_TARGET}`);
  });

  it("redirects a thrown response on script transitions", async () => {
    await app.goto(`/${THROWS_REDIRECT}`);
    let responses = app.collectDataResponses();
    await app.clickSubmitButton(`/${THROWS_REDIRECT}`);
    expect(responses.length).toBe(1);
    expect(responses[0].status()).toBe(204);
    expect(new URL(app.page.url()).pathname).toBe(`/${REDIRECT_TARGET}`);
    expect(await app.getHtml()).toMatch(PAGE_TEXT);
  });
});
