import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

test.describe("`useSubmit()` returned function", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/index.jsx": js`
        import { useLoaderData, useSubmit } from "@remix-run/react";

        export function loader({ request }) {
          let url = new URL(request.url);
          return url.searchParams.toString()
        }

        export default function Index() {
          let submit = useSubmit();
          let handleClick = event => {
            event.preventDefault()
            submit(event.nativeEvent.submitter || event.currentTarget)
          }
          let data = useLoaderData();
          return (
            <form>
              <input type="text" name="tasks" defaultValue="first" />
              <input type="text" name="tasks" defaultValue="second" />

              <button onClick={handleClick} name="tasks" value="third">
                Prepare Third Task
              </button>

              <pre>{data}</pre>
            </form>
          )
        }
      `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("submits the submitter's value appended to the form data", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("text=Prepare Third Task");
    await page.waitForLoadState("load");
    expect(await app.getHtml("pre")).toBe(
      `<pre>tasks=first&amp;tasks=second&amp;tasks=third</pre>`
    );
  });
});
