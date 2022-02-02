import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("Forms", () => {
  let fixture: Fixture;
  let app: AppFixture;

  const KEYBOARD_INPUT = "KEYBOARD_INPUT";
  const CHECKBOX_BUTTON = "CHECKBOX_BUTTON";
  const ORPHAN_BUTTON = "ORPHAN_BUTTON";
  const FORM_WITH_ORPHAN = "FORM_WITH_ORPHAN";
  const LUNCH = "LUNCH";
  const CHEESESTEAK = "CHEESESTEAK";
  const LAKSA = "LAKSA";
  const SQUID_INK_HOTDOG = "SQUID_INK_HOTDOG";

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Outlet, Scripts } from "remix";
          export default function Root() {
            return (
              <html>
                <head />
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            )
          }
        `,

        "app/routes/get-submission.jsx": js`
          import { Fragment } from "react"
          import { useLoaderData, Form } from "remix";

          export function loader({ request }) {
            let url = new URL(request.url);
            return url.searchParams.toString()
          }

          export default function() {
            let data = useLoaderData();
            return (
              <>
                <Form>
                  <input type="text" name="${LUNCH}" defaultValue="${CHEESESTEAK}" />
                  <button type="submit">Go</button>
                </Form>

                <Form id="${FORM_WITH_ORPHAN}">
                  <input id="${KEYBOARD_INPUT}" type="text" />
                  <button
                    id="buttonWithValue"
                    type="submit"
                    name="${LUNCH}"
                    value="${LAKSA}"
                  >Go</button>
                </Form>

                <button
                  type="submit"
                  id="${ORPHAN_BUTTON}"
                  form="${FORM_WITH_ORPHAN}"
                  name="${LUNCH}"
                  value="${SQUID_INK_HOTDOG}"
                >Orphan</button>

                <Form>
                  <input
                    defaultChecked={true}
                    type="checkbox"
                    name="${LUNCH}"
                    defaultValue="${CHEESESTEAK}"
                  />
                  <input
                    defaultChecked={true}
                    type="checkbox"
                    name="${LUNCH}"
                    defaultValue="${LAKSA}"
                  />

                  <button
                    id="${CHECKBOX_BUTTON}"
                    type="submit"
                  >Go</button>
                </Form>

                <pre>{data}</pre>
              </>
            )
          }
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("posts to a loader without JavaScript", async () => {
    let enableJavaScript = await app.disableJavaScript();
    await app.goto("/get-submission");
    await app.clickSubmitButton("/get-submission", { wait: false });
    await app.page.waitForNavigation();
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
    await enableJavaScript();
  });

  it("posts to a loader", async () => {
    await app.goto("/get-submission");
    await app.clickSubmitButton("/get-submission");
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
  });

  it("posts to a loader with button data with click", async () => {
    await app.goto("/get-submission");
    await app.clickElement("#buttonWithValue");
    expect(await app.getHtml("pre")).toMatch(LAKSA);
  });

  it("posts to a loader with button data with keyboard", async () => {
    await app.goto("/get-submission");
    await app.waitForNetworkAfter(async () => {
      await app.page.focus(`#${KEYBOARD_INPUT}`);
      await app.page.keyboard.press("Enter");
    });
    expect(await app.getHtml("pre")).toMatch(LAKSA);
  });

  it("posts with the correct checkbox data", async () => {
    await app.goto("/get-submission");
    await app.clickElement(`#${CHECKBOX_BUTTON}`);
    expect(await app.getHtml("pre")).toMatchInlineSnapshot(
      `"<pre>LUNCH=CHEESESTEAK&amp;LUNCH=LAKSA</pre>"`
    );
  });

  it("posts button data from outside the form", async () => {
    await app.goto("/get-submission");
    await app.clickElement(`#${ORPHAN_BUTTON}`);
    expect(await app.getHtml("pre")).toMatch(SQUID_INK_HOTDOG);
  });
});
