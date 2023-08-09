import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("meta", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  // disable JS for all tests in this file
  // to only disable them for some, add another test.describe()
  // and move the following line there
  test.use({ javaScriptEnabled: false });

  test.beforeAll(async () => {
    fixture = await createFixture({
      config: {
        ignoredRouteFiles: ["**/.*"],
      },
      files: {
        "app/root.tsx": js`
          import { json } from "@remix-run/node";
          import { Meta, Links, Outlet, Scripts } from "@remix-run/react";

          export const loader = async () =>
            json({
              description: "This is a meta page",
              title: "Meta Page",
            });

          export const meta = ({ data }) => [
            { charSet: "utf-8" },
            { name: "description", content: data.description },
            { property: "og:image", content: "https://picsum.photos/200/200" },
            { property: "og:type", content: data.contentType }, // undefined
            { title: data.title },
          ];

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

        "app/routes/_index.tsx": js`
          export const meta = ({ data, matches }) =>
            matches.flatMap((match) => match.meta);

          export default function Index() {
            return <div>This is the index file</div>;
          }
        `,

        "app/routes/no-meta-export.tsx": js`
          export default function NoMetaExport() {
            return <div>Parent meta here!</div>;
          }
        `,

        "app/routes/empty-meta-function.tsx": js`
          export const meta = () => [];
          export default function EmptyMetaFunction() {
            return <div>No meta here!</div>;
          }
        `,

        "app/routes/authors.$authorId.tsx": js`
          import { json } from "@remix-run/node";

          export async function loader({ params }) {
            return json({
              author: {
                id: params.authorId,
                name: "Sonny Day",
                address: {
                  streetAddress: "123 Sunset Cliffs Blvd",
                  city: "San Diego",
                  state: "CA",
                  zip: "92107",
                },
                emails: [
                  "sonnyday@fancymail.com",
                  "surfergal@veryprofessional.org",
                ],
              },
            });
          }

          export function meta({ data }) {
            let { author } = data;
            return [
              { title: data.name + " Profile" },
              {
                tagName: "link",
                rel: "canonical",
                href: "https://website.com/authors/" + author.id,
              },
              {
                "script:ld+json": {
                  "@context": "http://schema.org",
                  "@type": "Person",
                  "name": author.name,
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": author.address.streetAddress,
                    "addressLocality": author.address.city,
                    "addressRegion": author.address.state,
                    "postalCode": author.address.zip,
                  },
                  "email": author.emails,
                },
              },
            ];
          }
          export default function AuthorBio() {
            return <div>Bio here!</div>;
          }
        `,

        "app/routes/music.tsx": js`
          export function meta({ data, matches }) {
            let rootModule = matches.find(match => match.id === "root");
            let rootCharSet = rootModule.meta.find(meta => meta.charSet);
            return [
              rootCharSet,
              { title: "What's My Age Again?" },
              { property: "og:type", content: "music.song" },
              { property: "music:musician", content: "https://www.blink182.com/" },
              { property: "music:duration", content: 182 },
            ];
          }

          export default function Music() {
            return <h1>Music</h1>;
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("no meta export renders meta from nearest route meta in the tree", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/no-meta-export");
    expect(await app.getHtml('meta[name="description"]')).toBeTruthy();
  });

  test("empty meta array does not render a tag", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/empty-meta-function");
    await expect(app.getHtml("title")).rejects.toThrowError(
      'No element matches selector "title"'
    );
  });

  test("meta from `matches` renders meta tags", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/music");
    expect(await app.getHtml('meta[charset="utf-8"]')).toBeTruthy();
  });

  test("{ charSet } adds a <meta charset='utf-8' />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await app.getHtml('meta[charset="utf-8"]')).toBeTruthy();
  });

  test("{ title } adds a <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await app.getHtml("title")).toBeTruthy();
  });

  test("{ property: 'og:*', content: '*' } adds a <meta property='og:*' />", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await app.getHtml('meta[property="og:image"]')).toBeTruthy();
  });

  test("{ 'script:ld+json': {} } adds a <script type='application/ld+json' />", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/authors/1");
    let scriptTag = await app.getHtml('script[type="application/ld+json"]');
    let scriptContents = scriptTag
      .replace('<script type="application/ld+json">', "")
      .replace("</script>", "")
      .trim();

    expect(JSON.parse(scriptContents)).toEqual({
      "@context": "http://schema.org",
      "@type": "Person",
      name: "Sonny Day",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Sunset Cliffs Blvd",
        addressLocality: "San Diego",
        addressRegion: "CA",
        postalCode: "92107",
      },
      email: ["sonnyday@fancymail.com", "surfergal@veryprofessional.org"],
    });
  });

  test("{ tagName: 'link' } adds a <link />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/authors/1");
    expect(await app.getHtml('link[rel="canonical"]')).toBeTruthy();
  });
});
