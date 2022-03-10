import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("useFetcher", () => {
  let fixture: Fixture;
  let app: AppFixture;

  let CHEESESTEAK = "CHEESESTEAK";
  let LUNCH = "LUNCH";

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/resource-route.jsx": js`
          export function loader() {
            return "${LUNCH}"
          }
          export function action() {
            return "${CHEESESTEAK}"
          }
        `,

        "app/routes/index.jsx": js`
          import { useFetcher } from "remix";
          export default function Index() {
            let fetcher = useFetcher();
            return (
              <>
                <fetcher.Form action="/resource-route">
                  <button type="submit" formMethod="get">get</button>
                  <button type="submit" formMethod="post">post</button>
                </fetcher.Form>
                <button id="fetcher-load" type="button" onClick={() => {
                  fetcher.load('/resource-route')
                }}>
                  load
                </button>
                <button id="fetcher-submit" type="button" onClick={() => {
                  fetcher.submit(new URLSearchParams(), {
                    method: 'post',
                    action: '/resource-route'
                  })
                }}>
                  submit
                </button>
                <pre>{fetcher.data}</pre>
              </>
            )
          }
        `,
      },
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  test("Form can hit a loader", async () => {
    let enableJavaScript = await app.disableJavaScript();
    await app.goto("/");
    await app.clickSubmitButton("/resource-route", {
      wait: false,
      method: "get",
    });
    await app.page.waitForNavigation();
    expect(await app.getHtml("pre")).toMatch(LUNCH);
    await enableJavaScript();
  });

  test("Form can hit an action", async () => {
    let enableJavaScript = await app.disableJavaScript();
    await app.goto("/");
    await app.clickSubmitButton("/resource-route", {
      wait: false,
      method: "post",
    });
    await app.page.waitForNavigation();
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
    await enableJavaScript();
  });

  test("load can hit a loader", async () => {
    await app.goto("/");
    await app.clickElement("#fetcher-load");
    expect(await app.getHtml("pre")).toMatch(LUNCH);
  });

  test("submit can hit an action", async () => {
    await app.goto("/");
    await app.clickElement("#fetcher-submit");
    expect(await app.getHtml("pre")).toMatch(CHEESESTEAK);
  });
});
