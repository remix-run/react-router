import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

let fixture: Fixture;
let app: AppFixture;

let ROOT_BOUNDARY_TEXT = "ROOT_TEXT";
let LAYOUT_BOUNDARY_TEXT = "LAYOUT_BOUNDARY_TEXT";
let OWN_BOUNDARY_TEXT = "OWN_BOUNDARY_TEXT";

let NO_BOUNDARY_LOADER = "/no/loader";
let HAS_BOUNDARY_LAYOUT_NESTED_LOADER = "/yes/loader-layout-boundary";
let HAS_BOUNDARY_NESTED_LOADER = "/yes/loader-self-boundary";

let ROOT_DATA = "root data";
let LAYOUT_DATA = "root data";

beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/root.jsx": js`
        import { json, Links, Meta, Outlet, Scripts, useLoaderData, useMatches } from "remix";

        export const loader = () => json("${ROOT_DATA}");

        export default function Root() {
          const data = useLoaderData();

          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <div>{data}</div>
                <Outlet />
                <Scripts />
              </body>
            </html>
          );
        }

        export function CatchBoundary() {
          let matches = useMatches();
          let { data } = matches.find(match => match.id === "root");

          return (
            <html>
              <head />
              <body>
                <div>${ROOT_BOUNDARY_TEXT}</div>
                <div>{data}</div>
                <Scripts />
              </body>
            </html>
          );
        }
      `,

      "app/routes/index.jsx": js`
        import { Link } from "remix";
        export default function Index() {
          return (
            <div>
              <Link to="${NO_BOUNDARY_LOADER}">${NO_BOUNDARY_LOADER}</Link>
              <Link to="${HAS_BOUNDARY_LAYOUT_NESTED_LOADER}">${HAS_BOUNDARY_LAYOUT_NESTED_LOADER}</Link>
              <Link to="${HAS_BOUNDARY_NESTED_LOADER}">${HAS_BOUNDARY_NESTED_LOADER}</Link>
            </div>
          );
        }
      `,

      [`app/routes${NO_BOUNDARY_LOADER}.jsx`]: js`
        export function loader() {
          throw new Response("", { status: 401 });
        }
        export default function Index() {
          return <div/>;
        }
      `,

      [`app/routes${HAS_BOUNDARY_LAYOUT_NESTED_LOADER}.jsx`]: js`
        import { useMatches } from "remix";
        export function loader() {
          return "${LAYOUT_DATA}";
        }
        export default function Layout() {
          return <div/>;
        }
        export function CatchBoundary() {
          let matches = useMatches();
          let { data } = matches.find(match => match.id === "routes${HAS_BOUNDARY_LAYOUT_NESTED_LOADER}");

          return (
            <div>
              <div>${LAYOUT_BOUNDARY_TEXT}</div>
              <div>{data}</div>
            </div>
          );
        }
      `,

      [`app/routes${HAS_BOUNDARY_LAYOUT_NESTED_LOADER}/index.jsx`]: js`
        export function loader() {
          throw new Response("", { status: 401 });
        }
        export default function Index() {
          return <div/>;
        }
      `,

      [`app/routes${HAS_BOUNDARY_NESTED_LOADER}.jsx`]: js`
        import { Outlet, useLoaderData } from "remix";
        export function loader() {
          return "${LAYOUT_DATA}";
        }
        export default function Layout() {
          let data = useLoaderData();
          return (
            <div>
              <div>{data}</div>
              <Outlet/>
            </div>
          );
        }
      `,

      [`app/routes${HAS_BOUNDARY_NESTED_LOADER}/index.jsx`]: js`
        export function loader() {
          throw new Response("", { status: 401 });
        }
        export default function Index() {
          return <div/>;
        }
        export function CatchBoundary() {
          return (
            <div>${OWN_BOUNDARY_TEXT}</div>
          );
        }
      `,
    },
  });

  app = await createAppFixture(fixture);
});

afterAll(async () => app.close());

it("renders root boundary with data avaliable", async () => {
  let res = await fixture.requestDocument(NO_BOUNDARY_LOADER);
  expect(res.status).toBe(401);
  let html = await res.text();
  expect(html).toMatch(ROOT_BOUNDARY_TEXT);
  expect(html).toMatch(ROOT_DATA);
});

it("renders root boundary with data avaliable on transition", async () => {
  await app.goto("/");
  await app.clickLink(NO_BOUNDARY_LOADER);
  let html = await app.getHtml();
  expect(html).toMatch(ROOT_BOUNDARY_TEXT);
  expect(html).toMatch(ROOT_DATA);
});

it("renders layout boundary with data avaliable", async () => {
  let res = await fixture.requestDocument(HAS_BOUNDARY_LAYOUT_NESTED_LOADER);
  expect(res.status).toBe(401);
  let html = await res.text();
  expect(html).toMatch(ROOT_DATA);
  expect(html).toMatch(LAYOUT_BOUNDARY_TEXT);
  expect(html).toMatch(LAYOUT_DATA);
});

it("renders layout boundary with data avaliable on transition", async () => {
  await app.goto("/");
  await app.clickLink(HAS_BOUNDARY_LAYOUT_NESTED_LOADER);
  let html = await app.getHtml();
  expect(html).toMatch(ROOT_DATA);
  expect(html).toMatch(LAYOUT_BOUNDARY_TEXT);
  expect(html).toMatch(LAYOUT_DATA);
});

it("renders self boundary with layout data avaliable", async () => {
  let res = await fixture.requestDocument(HAS_BOUNDARY_NESTED_LOADER);
  expect(res.status).toBe(401);
  let html = await res.text();
  expect(html).toMatch(ROOT_DATA);
  expect(html).toMatch(LAYOUT_DATA);
  expect(html).toMatch(OWN_BOUNDARY_TEXT);
});

it("renders self boundary with layout data avaliable on transition", async () => {
  await app.goto("/");
  await app.clickLink(HAS_BOUNDARY_NESTED_LOADER);
  let html = await app.getHtml();
  expect(html).toMatch(ROOT_DATA);
  expect(html).toMatch(LAYOUT_DATA);
  expect(html).toMatch(OWN_BOUNDARY_TEXT);
});
