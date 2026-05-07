import { test, expect } from "@playwright/test";

import { UNSAFE_ServerMode as ServerMode } from "react-router";
import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

test.describe("HTTP behavior", () => {
  let appFixture: Fixture;

  test.beforeAll(async () => {
    appFixture = await createFixture({
      files: {
        "app/root.tsx": js`
            import { Links, Meta, Outlet, Scripts } from "react-router";

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
            import { data } from "react-router";

            export function loader() {
              return data("INDEX", { status: 202 })
            }

            export default function Index() {
              return <div>Heyo!</div>
            }
          `,

        "app/routes/resource.tsx": js`
            export function loader() {
              return new Response("RESOURCE", { status: 202 })
            }
          `,
      },
    });
  });

  test("includes body on GET request", async () => {
    let response = await appFixture.requestDocument("/");
    expect(response.status).toBe(202);
    expect(await response.text()).toContain("<div>Heyo!</div>");

    response = await appFixture.requestResource("/resource");
    expect(response.status).toBe(202);
    expect(await response.text()).toBe("RESOURCE");

    let singleFetchResponse =
      await appFixture.requestSingleFetchData("/_root.data");
    expect(response.status).toBe(202);
    expect(singleFetchResponse.data).toEqual({
      "routes/_index": { data: "INDEX" },
    });
  });

  test("does not include body on HEAD request", async () => {
    let response = await appFixture.requestDocument("/", { method: "HEAD" });
    expect(response.status).toBe(202);
    expect(response.body).toBe(null);

    response = await appFixture.requestResource("/resource", {
      method: "HEAD",
    });
    expect(response.status).toBe(202);
    expect(response.body).toBe(null);

    let singleFetchResponse = await appFixture.requestSingleFetchData(
      "/_root.data",
      { method: "HEAD" },
    );
    expect(response.status).toBe(202);
    expect(singleFetchResponse.data).toBe(null);
  });
});
