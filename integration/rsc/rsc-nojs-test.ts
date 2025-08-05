import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { implementations, js, setupRscTest, validateRSCHtml } from "./utils";

test.use({ javaScriptEnabled: false });

implementations.forEach((implementation) => {
  let stop: () => void;

  test.afterEach(() => {
    stop?.();
  });

  test.describe(`RSC nojs (${implementation.name})`, () => {
    test("Supports React Server Functions side-effect redirect headers for document requests", async ({
      page,
    }) => {
      test.skip(
        implementation.name === "parcel",
        "TODO: figure out why parcel isn't working here",
      );

      let port = await getPort();
      stop = await setupRscTest({
        implementation,
        port,
        files: {
          "src/routes/home.actions.ts": js`
            "use server";
            import { redirect } from "react-router";

            export async function redirectAction() {
              redirect("/?redirected=true", { headers: { "x-test": "test" } });
              return "redirected";
            }
          `,
          "src/routes/home.client.tsx": js`
            "use client";
            import { useState } from "react";

            export function Counter() {
              const [count, setCount] = useState(0);
              return <button type="button" onClick={() => setCount(c => c + 1)} data-count>Count: {count}</button>;
            }
          `,
          "src/routes/home.tsx": js`
            "use client";
            import {useActionState} from "react";
            import { redirectAction } from "./home.actions";
            import { Counter } from "./home.client";

            export default function HomeRoute(props) {
              const [state, action] = useActionState(redirectAction, null);
              return (
                <div>
                  <form action={action}>
                    <button type="submit" data-submit>
                      Redirect via Server Function
                    </button>
                  </form>
                  {state && <div data-testid="state">{state}</div>}
                  <Counter />
                </div>
              );
            }
          `,
        },
      });

      await page.goto(`http://localhost:${port}/`);

      const responseHeadersPromise = new Promise<Record<string, string>>(
        (resolve) => {
          page.addListener("response", (response) => {
            if (response.request().method() === "POST") {
              resolve(response.headers());
            }
          });
        },
      );

      await page.click("[data-submit]");

      await page.waitForURL(`http://localhost:${port}/?redirected=true`);

      expect((await responseHeadersPromise)["x-test"]).toBe("test");

      // Ensure this is using RSC
      validateRSCHtml(await page.content());
    });
  });
});
