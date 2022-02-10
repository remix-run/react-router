import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("rendering", () => {
  let fixture: Fixture;
  let app: AppFixture;

  const PAGE = "page";
  const PAGE_TEXT = "PAGE_TEXT";
  const PAGE_INDEX_TEXT = "PAGE_INDEX_TEXT";
  const CHILD = "child";
  const CHILD_TEXT = "CHILD_TEXT";
  const REDIRECT = "redirect";
  const REDIRECT_TARGET = "page";

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
                  <main>
                    <Outlet />
                  </main>
                  <Scripts />
                </body>
              </html>
            )
          }

        `,
        "app/routes/index.jsx": js`
          import { Link } from "remix";
          export default function() {
            return (
              <div>
                <h2>Index</h2>
                <Link to="/${PAGE}">${PAGE}</Link>
                <Link to="/${REDIRECT}">${REDIRECT}</Link>
              </div>
            );
          }
        `,

        [`app/routes/${PAGE}.jsx`]: js`
          import { Outlet, useLoaderData } from "remix";

          export function loader() {
            return "${PAGE_TEXT}"
          }

          export default function() {
            let text = useLoaderData();
            return (
              <>
                <h2>{text}</h2>
                <Outlet />
              </>
            );
          }
        `,

        [`app/routes/${PAGE}/index.jsx`]: js`
          import { useLoaderData, Link } from "remix";

          export function loader() {
            return "${PAGE_INDEX_TEXT}"
          }

          export default function() {
            let text = useLoaderData();
            return (
              <>
                <h3>{text}</h3>
                <Link to="/${PAGE}/${CHILD}">${CHILD}</Link>
              </>
            );
          }
        `,

        [`app/routes/${PAGE}/${CHILD}.jsx`]: js`
          import { useLoaderData } from "remix";

          export function loader() {
            return "${CHILD_TEXT}"
          }

          export default function() {
            let text = useLoaderData();
            return <h3>{text}</h3>;
          }
        `,

        [`app/routes/${REDIRECT}.jsx`]: js`
          import { redirect } from "remix";
          export function loader() {
            return redirect("/${REDIRECT_TARGET}")
          }
          export default function() {
            return null;
          }
        `,

        "app/routes/gh-1691.jsx": js`
          import { Form, redirect, useFetcher, useTransition} from "remix";

          export const action = async ({ request }) => {
            return redirect("/gh-1691");
          };

          export const loader = async ({ request }) => {
            return {};
          };

          export default function GitHubIssue1691() {
            const fetcher = useFetcher();

            return (
              <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
                <span>{fetcher.state}</span>
                <fetcher.Form method="post">
                  <input type="hidden" name="source" value="fetcher" />
                  <button type="submit" name="_action" value="add">
                    Submit
                  </button>
                </fetcher.Form>
              </div>
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

  it("calls all loaders for new routes", async () => {
    await app.goto("/");
    let responses = app.collectDataResponses();
    await app.clickLink(`/${PAGE}`);

    expect(
      responses.map(res => new URL(res.url()).searchParams.get("_data"))
    ).toEqual([`routes/${PAGE}`, `routes/${PAGE}/index`]);

    let html = await app.getHtml("main");
    expect(html).toMatch(PAGE_TEXT);
    expect(html).toMatch(PAGE_INDEX_TEXT);
  });

  it("calls only loaders for changing routes", async () => {
    await app.goto(`/${PAGE}`);
    let responses = app.collectDataResponses();
    await app.clickLink(`/${PAGE}/${CHILD}`);

    expect(
      responses.map(res => new URL(res.url()).searchParams.get("_data"))
    ).toEqual([`routes/${PAGE}/${CHILD}`]);

    let html = await app.getHtml("main");
    expect(html).toMatch(PAGE_TEXT);
    expect(html).toMatch(CHILD_TEXT);
  });

  test("loader redirect", async () => {
    await app.goto("/");

    let responses = app.collectDataResponses();
    await app.clickLink(`/${REDIRECT}`);
    expect(new URL(app.page.url()).pathname).toBe(`/${REDIRECT_TARGET}`);

    expect(
      responses.map(res => new URL(res.url()).searchParams.get("_data"))
    ).toEqual([`routes/${REDIRECT}`, `routes/${PAGE}`, `routes/${PAGE}/index`]);

    let html = await app.getHtml("main");
    expect(html).toMatch(PAGE_TEXT);
    expect(html).toMatch(PAGE_INDEX_TEXT);
  });

  it("calls changing routes on POP", async () => {
    await app.goto(`/${PAGE}`);
    await app.clickLink(`/${PAGE}/${CHILD}`);

    let responses = app.collectDataResponses();
    await app.goBack();

    expect(
      responses.map(res => new URL(res.url()).searchParams.get("_data"))
    ).toEqual([`routes/${PAGE}/index`]);

    let html = await app.getHtml("main");
    expect(html).toMatch(PAGE_TEXT);
    expect(html).toMatch(PAGE_INDEX_TEXT);
  });

  it("useFetcher state should return to the idle when redirect from an action", async () => {
    await app.goto("/gh-1691");
    expect(await app.getHtml("span")).toMatch("idle");

    await app.clickSubmitButton("/gh-1691");
    expect(await app.getHtml("span")).toMatch("idle");
  });
});
