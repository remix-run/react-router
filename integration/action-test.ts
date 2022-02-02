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
      `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns undefined for action data on GET", async () => {
    let res = await fixture.requestDocument("/urlencoded");
    let html = selectHtml(await res.text(), "#text");
    expect(html).toMatch(WAITING_VALUE);
  });

  it("returns data from the action after POST", async () => {
    const FIELD_VALUE = "cheeseburger";

    let params = new URLSearchParams();
    params.append(FIELD_NAME, FIELD_VALUE);

    let res = await fixture.postDocument("/urlencoded", params);

    let html = selectHtml(await res.text(), "#text");
    expect(html).toMatch(FIELD_VALUE);
  });

  it("returns data after a form submission with JavaScript", async () => {
    await app.goto(`/urlencoded`);
    let html = await app.getHtml("#text");
    expect(html).toMatch(WAITING_VALUE);

    await app.page.click("button[type=submit]");
    await app.page.waitForSelector("#action-text");
    html = await app.getHtml("#text");
    expect(html).toMatch(SUBMITTED_VALUE);
  });
});
