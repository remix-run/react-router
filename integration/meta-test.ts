import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("meta", () => {
  let fixture: Fixture;
  let app: AppFixture;

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { json, Meta, Links, Outlet, Scripts } from "remix";

          export const loader = async () =>
            json({
              description: "This is a meta page",
              title: "Meta Page",
            });

          export const meta = ({ data }) => ({
            charset: "utf-8",
            description: data.description,
            "og:image": "https://picsum.photos/200/200",
            "og:type": data.contentType, // undefined
            refresh: {
              httpEquiv: "refresh",
              content: "3;url=https://www.mozilla.org",
            },
            title: data.title,
          });

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,

        "app/routes/index.jsx": js`
          export default function Index() {
            return <div>This is the index file</div>;
          }
        `,
      },
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => await app.close());

  test("empty meta does not render a tag", async () => {
    let enableJavaScript = await app.disableJavaScript();

    await app.goto("/");

    await expect(app.getHtml('meta[property="og:type"]')).rejects.toThrowError(
      'No element matches selector "meta[property="og:type"]"'
    );
    await enableJavaScript();
  });

  test("meta { charset } adds a <meta charset='utf-8' />", async () => {
    let enableJavaScript = await app.disableJavaScript();

    await app.goto("/");

    expect(await app.getHtml('meta[charset="utf-8"]')).toBeTruthy();
    await enableJavaScript();
  });

  test("meta { title } adds a <title />", async () => {
    let enableJavaScript = await app.disableJavaScript();

    await app.goto("/");

    expect(await app.getHtml("title")).toBeTruthy();
    await enableJavaScript();
  });

  test("meta { 'og:*' } adds a <meta property='og:*' />", async () => {
    let enableJavaScript = await app.disableJavaScript();

    await app.goto("/");

    expect(await app.getHtml('meta[property="og:image"]')).toBeTruthy();
    await enableJavaScript();
  });

  test("meta { description } adds a <meta name='description' />", async () => {
    let enableJavaScript = await app.disableJavaScript();

    await app.goto("/");

    expect(await app.getHtml('meta[name="description"]')).toBeTruthy();
    await enableJavaScript();
  });

  test("meta { refresh } adds a <meta http-equiv='refresh' content='3;url=https://www.mozilla.org' />", async () => {
    let enableJavaScript = await app.disableJavaScript();

    await app.goto("/");

    expect(
      await app.getHtml(
        'meta[http-equiv="refresh"][content="3;url=https://www.mozilla.org"]'
      )
    ).toBeTruthy();
    await enableJavaScript();
  });
});
