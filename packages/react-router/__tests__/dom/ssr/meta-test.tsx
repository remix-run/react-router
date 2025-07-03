import { prettyDOM, render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import * as React from "react";

import { Meta, Outlet, createRoutesStub } from "../../../index";

const getDocumentHtmlForElement = (c: HTMLElement) =>
  prettyDOM(c.ownerDocument, undefined, { highlight: false });

describe("meta", () => {
  it("no meta export renders meta from nearest route meta in the tree", () => {
    let RoutesStub = createRoutesStub([
      {
        id: "root",
        path: "/",
        meta: ({ data }) => [
          { name: "description", content: data.description },
          { title: data.title },
        ],
        Component() {
          return (
            <>
              <Meta />
              <Outlet />
            </>
          );
        },
        children: [
          {
            index: true,
            Component() {
              return <div>Parent meta here!</div>;
            },
          },
        ],
      },
    ]);

    let { container } = render(
      <RoutesStub
        hydrationData={{
          loaderData: {
            root: {
              description: "This is a meta page",
              title: "Meta Page",
            },
          },
        }}
      />
    );

    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <meta
            content="This is a meta page"
            name="description"
          />
          <title>
            Meta Page
          </title>
        </head>
        <body>
          <div>
            <div>
              Parent meta here!
            </div>
          </div>
        </body>
      </html>"
    `);
  });

  it("empty meta array does not render a tag", () => {
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        meta: () => [],
        Component() {
          return (
            <>
              <Meta />
              <p>No meta here!</p>
            </>
          );
        },
      },
    ]);

    let { container } = render(<RoutesStub />);

    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head />
        <body>
          <div>
            <p>
              No meta here!
            </p>
          </div>
        </body>
      </html>"
    `);
  });

  it("meta from `matches` renders meta tags", () => {
    let RoutesStub = createRoutesStub([
      {
        id: "root",
        path: "/",
        meta: () => [{ charSet: "utf-8" }],
        Component() {
          return (
            <>
              <Meta />
              <Outlet />
            </>
          );
        },
        children: [
          {
            index: true,
            meta({ matches }) {
              let rootModule = matches.find((match) => match.id === "root");
              // @ts-expect-error
              let rootCharSet = rootModule?.meta.find((meta) => meta.charSet);
              return [rootCharSet, { title: "Child title" }];
            },
            Component() {
              return <p>Matches Meta</p>;
            },
          },
        ],
      },
    ]);

    let { container } = render(<RoutesStub />);

    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <meta
            charset="utf-8"
          />
          <title>
            Child title
          </title>
        </head>
        <body>
          <div>
            <p>
              Matches Meta
            </p>
          </div>
        </body>
      </html>"
    `);
  });

  it("{ charSet } adds a <meta charset='utf-8' />", () => {
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        meta: () => [{ charSet: "utf-8" }],
        Component: Meta,
      },
    ]);

    let { container } = render(<RoutesStub />);

    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <meta
            charset="utf-8"
          />
        </head>
        <body>
          <div />
        </body>
      </html>"
    `);
  });

  it("{ title } adds a <title />", () => {
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        meta: () => [{ title: "Document Title" }],
        Component: Meta,
      },
    ]);

    let { container } = render(<RoutesStub />);

    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <title>
            Document Title
          </title>
        </head>
        <body>
          <div />
        </body>
      </html>"
    `);
  });

  it("{ property: 'og:*', content: '*' } adds a <meta property='og:*' />", () => {
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        meta: () => [
          { property: "og:image", content: "https://picsum.photos/200/200" },
          { property: "og:type", content: undefined },
        ],
        Component: Meta,
      },
    ]);

    let { container } = render(<RoutesStub />);
    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <meta
            content="https://picsum.photos/200/200"
            property="og:image"
          />
          <meta
            property="og:type"
          />
        </head>
        <body>
          <div />
        </body>
      </html>"
    `);
  });

  it("{ 'script:ld+json': {} } adds a <script type='application/ld+json' />", () => {
    let jsonLd = {
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
    };

    let RoutesStub = createRoutesStub([
      {
        path: "/",
        meta: () => [
          {
            "script:ld+json": jsonLd,
          },
        ],
        Component: Meta,
      },
    ]);

    let { container } = render(<RoutesStub />);

    // For some reason, prettyDOM strips the script tag (maybe because of
    // dangerouslySetInnerHTML), so we just parse the HTML out into JSON and assert that way
    let scriptTagContents =
      container.querySelector('script[type="application/ld+json"]')
        ?.innerHTML || "{}";
    expect(JSON.parse(scriptTagContents)).toEqual(jsonLd);
  });

  it("{ tagName: 'link' } adds a <link />", () => {
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        meta: () => [
          {
            tagName: "link",
            rel: "canonical",
            href: "https://website.com/authors/1",
          },
        ],
        Component: Meta,
      },
    ]);

    let { container } = render(<RoutesStub />);
    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <link
            href="https://website.com/authors/1"
            rel="canonical"
          />
        </head>
        <body>
          <div />
        </body>
      </html>"
    `);
  });

  it("does not mutate meta when using tagName", async () => {
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        meta: ({ data }) => data?.meta,
        loader: () => ({
          meta: [
            {
              tagName: "link",
              rel: "canonical",
              href: "https://website.com/authors/1",
            },
          ],
        }),
        HydrateFallback: () => null,
        Component() {
          let [count, setCount] = React.useState(0);
          return (
            <>
              <button onClick={() => setCount(count + 1)}>
                {`Increment ${count}`}
              </button>
              <Meta key={count} />
            </>
          );
        },
      },
    ]);

    let { container } = render(<RoutesStub />);

    await screen.findByText("Increment 0");
    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <link
            href="https://website.com/authors/1"
            rel="canonical"
          />
        </head>
        <body>
          <div>
            <button>
              Increment 0
            </button>
          </div>
        </body>
      </html>"
    `);

    user.click(screen.getByRole("button"));
    await screen.findByText("Increment 1");

    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <link
            href="https://website.com/authors/1"
            rel="canonical"
          />
        </head>
        <body>
          <div>
            <button>
              Increment 1
            </button>
          </div>
        </body>
      </html>"
    `);
  });

  it("loader errors are passed to meta", () => {
    let RoutesStub = createRoutesStub([
      {
        path: "/",
        Component() {
          return (
            <>
              <Meta />
              <Outlet />
            </>
          );
        },
        children: [
          {
            id: "index",
            index: true,
            meta: ({ error }) => [
              {
                title: (error as Error)?.message || "Home",
              },
            ],
            Component() {
              return <h1>Page</h1>;
            },
            ErrorBoundary() {
              return <h1>Boundary</h1>;
            },
          },
        ],
      },
    ]);

    let { container } = render(
      <RoutesStub hydrationData={{ errors: { index: new Error("Oh no!") } }} />
    );
    expect(getDocumentHtmlForElement(container)).toMatchInlineSnapshot(`
      "<html>
        <head>
          <title>
            Oh no!
          </title>
        </head>
        <body>
          <div>
            <h1>
              Boundary
            </h1>
          </div>
        </body>
      </html>"
    `);
  });
});
