import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { AppFixture } from "./helpers/create-fixture";

describe("loader in an app", () => {
  let app: AppFixture;

  beforeAll(async () => {
    app = await createAppFixture(
      await createFixture({
        files: {
          "app/routes/index.jsx": js`
            import { Form, Link } from "@remix-run/react";

            export default () => (
              <>
                <Link to="/redirect">Redirect</Link>
                <Form action="/redirect-to" method="post">
                  <input name="destination" defaultValue="/redirect-destination" />
                  <button type="submit">Redirect</button>
                </Form>
              </>
            )
          `,
          "app/routes/redirected.jsx": js`
            export default () => <div data-testid="redirected">You were redirected</div>;
          `,
          "app/routes/redirect.jsx": js`
            import { redirect } from "@remix-run/node";

            export let loader = () => redirect("/redirected");
          `,
          "app/routes/redirect-to.jsx": js`
            import { redirect } from "@remix-run/node";

            export let action = async ({ request }) => {
              let formData = await request.formData();
              return redirect(formData.get('destination'));
            }
          `,
          "app/routes/redirect-destination.jsx": js`
            export default () => <div data-testid="redirect-destination">You made it!</div>
          `,
          "app/routes/data[.]json.jsx": js`
            import { json } from "@remix-run/node";
            export let loader = () => json({hello: "world"});
          `,
        },
      })
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  describe("with JavaScript", () => {
    runTests();
  });

  describe("without JavaScript", () => {
    let restore: Awaited<ReturnType<typeof app.disableJavaScript>>;
    beforeEach(async () => {
      restore = await app.disableJavaScript();
    });
    afterEach(async () => {
      await restore();
    });

    runTests();
  });

  function runTests() {
    it("should redirect to redirected", async () => {
      await app.goto("/");
      await app.page.click("a[href='/redirect']");
      await app.page.waitForSelector("[data-testid='redirected']");
    });

    it("should handle post to destination", async () => {
      await app.goto("/");
      await app.page.click("button[type='submit']");
      await app.page.waitForSelector("[data-testid='redirect-destination']");
    });

    it("should handle reloadDocument to resource route", async () => {
      await app.goto("/data.json");
      expect(await app.page.content()).toContain('{"hello":"world"}');
    });
  }
});
