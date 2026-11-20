/** @jest-environment node */
import * as React from "react";
import { renderToString } from "react-dom/server";
import {
  Form,
  Link,
  MemoryRouter,
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
  type StaticHandlerContext,
} from "../index";
import { redirect, redirectDocument, replace } from "../lib/router/utils";
const IMPLICIT_EXTERNAL_URLS = [
  "/\t/example.com/path",
  "/\\example.com/path",
  "\\/example.com/path",
  "\\\\example.com/path",
];
const EXPLICIT_EXTERNAL_URLS = [
  "http://example.com/path",
  "https://example.com/path",
  "//example.com/path",
  "mailto:test@example.com",
  "tel:5551234567",
  "myapp://open/path",
];
describe("native navigation targets", () => {
  it.each(IMPLICIT_EXTERNAL_URLS)(
    "validates Link destinations during server rendering: %s",
    (to) => {
      expect(() =>
        renderToString(
          <MemoryRouter>
            <Link to={to}>Go</Link>
          </MemoryRouter>,
        ),
      ).toThrow("External navigation is not allowed");
    },
  );

  it.each(EXPLICIT_EXTERNAL_URLS)(
    "renders supported absolute Link destinations: %s",
    (to) => {
      expect(
        renderToString(
          <MemoryRouter>
            <Link to={to}>Go</Link>
          </MemoryRouter>,
        ),
      ).toContain(`href="${to}"`);
    },
  );

  it("validates form actions during server rendering", async () => {
    let routes = [
      {
        path: "/",
        element: (
          <Form reloadDocument action={"/\t/example.com/path"} method="post" />
        ),
      },
    ];
    let { query } = createStaticHandler(routes);
    let context = await query(new Request("https://app.example/"));
    let router = createStaticRouter(routes, context as StaticHandlerContext);
    expect(() =>
      renderToString(
        <StaticRouterProvider
          router={router}
          context={context as StaticHandlerContext}
        />,
      ),
    ).toThrow("External navigation is not allowed");
  });

  it.each(IMPLICIT_EXTERNAL_URLS)(
    "validates redirect destinations: %s",
    (to) => {
      for (let fn of [redirect, redirectDocument, replace]) {
        expect(() => fn(to)).toThrow("External navigation is not allowed");
      }
    },
  );

  it.each(EXPLICIT_EXTERNAL_URLS)(
    "preserves redirect Location headers: %s",
    (to) => {
      expect(redirect(to).headers.get("Location")).toBe(to);
    },
  );
});
