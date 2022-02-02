import { createFixture, js } from "./helpers/create-fixture";
import type { Fixture } from "./helpers/create-fixture";

describe("headers export", () => {
  const ROOT_HEADER_KEY = "X-Test";
  const ROOT_HEADER_VALUE = "SUCCESS";
  const ACTION_HKEY = "X-Test-Action";
  const ACTION_HVALUE = "SUCCESS";

  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Outlet } from "remix";

          export function loader() {
            return null
          }

          export default function Index() {
            return <html><body><Outlet/></body></html>
          }
        `,

        "app/routes/index.jsx": js`
          import { json } from "remix";

          export function loader() {
            return json(null, {
              headers: {
                "${ROOT_HEADER_KEY}": "${ROOT_HEADER_VALUE}"
              }
            })
          }

          export function headers({ loaderHeaders }) {
            return {
              "${ROOT_HEADER_KEY}": loaderHeaders.get("${ROOT_HEADER_KEY}")
            }
          }

          export default function Index() {
            return <div>Heyo!</div>
          }
        `,

        "app/routes/action.jsx": js`
          import { json } from "remix";

          export function action() {
            return json(null, {
              headers: {
                "${ACTION_HKEY}": "${ACTION_HVALUE}"
              }
            })
          }

          export function headers({ actionHeaders }) {
            return {
              "${ACTION_HKEY}": actionHeaders.get("${ACTION_HKEY}")
            }
          }

          export default function Action() { return <div/> }
        `
      }
    });
  });

  it("can use `action` headers", async () => {
    let response = await fixture.postDocument("/action", new URLSearchParams());
    expect(response.headers.get(ACTION_HKEY)).toBe(ACTION_HVALUE);
  });

  it("can use the loader headers when all routes have loaders", async () => {
    let response = await fixture.requestDocument("/");
    expect(response.headers.get(ROOT_HEADER_KEY)).toBe(ROOT_HEADER_VALUE);
  });

  // FIXME: this test is busted
  it.skip("can use the loader headers when parents don't have loaders", async () => {
    const HEADER_KEY = "X-Test";
    const HEADER_VALUE = "SUCCESS";

    let fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Outlet } from "remix";

          export default function Index() {
            return <html><body><Outlet/></body></html>
          }
        `,

        "app/routes/index.jsx": js`
          import { json } from "remix";

          export function loader() {
            return json(null, {
              headers: {
                "${HEADER_KEY}": "${HEADER_VALUE}"
              }
            })
          }

          export function headers({ loaderHeaders }) {
            return {
              "${HEADER_KEY}": loaderHeaders.get("${HEADER_KEY}")
            }
          }

          export default function Index() {
            return <div>Heyo!</div>
          }
        `
      }
    });
    let response = await fixture.requestDocument("/");
    expect(response.headers.get(HEADER_KEY)).toBe(HEADER_VALUE);
  });
});
