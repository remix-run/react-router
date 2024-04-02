import { expect, test } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("useFetcher", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let CHEESESTEAK = "CHEESESTEAK";
  let LUNCH = "LUNCH";
  let PARENT_LAYOUT_LOADER = "parent layout loader";
  let PARENT_LAYOUT_ACTION = "parent layout action";
  let PARENT_INDEX_LOADER = "parent index loader";
  let PARENT_INDEX_ACTION = "parent index action";

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/resource-route-action-only.ts": js`
          import { json } from "@remix-run/node";
          export function action() {
            return json("${CHEESESTEAK}");
          }
        `,

        "app/routes/fetcher-action-only-call.tsx": js`
          import { useFetcher } from "@remix-run/react";

          export default function FetcherActionOnlyCall() {
            let fetcher = useFetcher();

            let executeFetcher = () => {
              fetcher.submit(new URLSearchParams(), {
                method: 'post',
                action: '/resource-route-action-only',
              });
            };

            return (
              <>
                <button id="fetcher-submit" onClick={executeFetcher}>Click Me</button>
                {fetcher.data && <pre>{fetcher.data}</pre>}
              </>
            );
          }
        `,

        "app/routes/resource-route.tsx": js`
          export function loader() {
            return "${LUNCH}";
          }
          export function action() {
            return "${CHEESESTEAK}";
          }
        `,

        "app/routes/_index.tsx": js`
          import { useFetcher } from "@remix-run/react";
          export default function Index() {
            let fetcher = useFetcher();
            return (
              <>
                <fetcher.Form action="/resource-route">
                  <button type="submit" formMethod="get">get</button>
                  <button type="submit" formMethod="post">post</button>
                </fetcher.Form>
                <button id="fetcher-load" type="button" onClick={() => {
                  fetcher.load('/resource-route');
                }}>
                  load
                </button>
                <button id="fetcher-submit" type="button" onClick={() => {
                  fetcher.submit(new URLSearchParams(), {
                    method: 'post',
                    action: '/resource-route'
                  });
                }}>
                  submit
                </button>
                <pre>{fetcher.data}</pre>
              </>
            );
          }
        `,

        "app/routes/parent.tsx": js`
          import { Outlet } from "@remix-run/react";

          export function action() {
            return "${PARENT_LAYOUT_ACTION}";
          };

          export function loader() {
            return "${PARENT_LAYOUT_LOADER}";
          };

          export default function Parent() {
            return <Outlet />;
          }
        `,

        "app/routes/parent._index.tsx": js`
          import { useFetcher } from "@remix-run/react";

          export function action() {
            return "${PARENT_INDEX_ACTION}";
          };

          export function loader() {
            return "${PARENT_INDEX_LOADER}";
          };

          export default function ParentIndex() {
            let fetcher = useFetcher();

            return (
              <>
                <pre>{fetcher.data}</pre>
                <button id="load-parent" onClick={() => fetcher.load('/parent')}>
                  Load parent
                </button>
                <button id="load-index" onClick={() => fetcher.load('/parent?index')}>
                  Load index
                </button>
                <button id="submit-empty" onClick={() => fetcher.submit({})}>
                  Submit empty
                </button>
                <button id="submit-parent-get" onClick={() => fetcher.submit({}, { method: 'get', action: '/parent' })}>
                  Submit parent
                </button>
                <button id="submit-index-get" onClick={() => fetcher.submit({}, { method: 'get', action: '/parent?index' })}>
                  Submit index
                </button>
                <button id="submit-parent-post" onClick={() => fetcher.submit({}, { method: 'post', action: '/parent' })}>
                  Submit parent
                </button>
                <button id="submit-index-post" onClick={() => fetcher.submit({}, { method: 'post', action: '/parent?index' })}>
                  Submit index
                </button>
              </>
            );
          }
        `,

        "app/routes/fetcher-echo.tsx": js`
          import { json } from "@remix-run/node";
          import { useFetcher } from "@remix-run/react";

          export async function action({ request }) {
            await new Promise(r => setTimeout(r, 1000));
            let contentType = request.headers.get('Content-Type');
            let value;
            if (contentType.includes('application/json')) {
              let json = await request.json();
              value = json === null ? json : json.value;
            } else if (contentType.includes('text/plain')) {
              value = await request.text();
            } else {
              value = (await request.formData()).get('value');
            }
            return json({ data: "ACTION (" + contentType + ") " + value })
          }

          export async function loader({ request }) {
            await new Promise(r => setTimeout(r, 1000));
            let value = new URL(request.url).searchParams.get('value');
            return json({ data: "LOADER " + value })
          }

          export default function Index() {
            let fetcherValues = [];
            if (typeof window !== 'undefined') {
              if (!window.fetcherValues) {
                window.fetcherValues = [];
              }
              fetcherValues = window.fetcherValues
            }

            let fetcher = useFetcher();

            let currentValue = fetcher.state + '/' + fetcher.data?.data;
            if (fetcherValues[fetcherValues.length - 1] !== currentValue) {
              fetcherValues.push(currentValue)
            }

            return (
              <>
                <input id="fetcher-input" name="value" />
                <button id="fetcher-load" onClick={() => {
                  let value = document.getElementById('fetcher-input').value;
                  fetcher.load('/fetcher-echo?value=' + value)
                }}>Load</button>
                <button id="fetcher-submit" onClick={() => {
                  let value = document.getElementById('fetcher-input').value;
                  fetcher.submit({ value }, { method: 'post', action: '/fetcher-echo' })
                }}>Submit</button>
                <button id="fetcher-submit-json" onClick={() => {
                  let value = document.getElementById('fetcher-input').value;
                  fetcher.submit({ value }, { method: 'post', action: '/fetcher-echo', encType: 'application/json' })
                }}>Submit JSON</button>
                <button id="fetcher-submit-json-null" onClick={() => {
                  fetcher.submit(null, { method: 'post', action: '/fetcher-echo', encType: 'application/json' })
                }}>Submit Null JSON</button>
                <button id="fetcher-submit-text" onClick={() => {
                  let value = document.getElementById('fetcher-input').value;
                  fetcher.submit(value, { method: 'post', action: '/fetcher-echo', encType: 'text/plain' })
                }}>Submit Text</button>
                <button id="fetcher-submit-text-empty" onClick={() => {
                  fetcher.submit("", { method: 'post', action: '/fetcher-echo', encType: 'text/plain' })
                }}>Submit Empty Text</button>

                {fetcher.state === 'idle' ? <p id="fetcher-idle">IDLE</p> : null}
                <pre>{JSON.stringify(fetcherValues)}</pre>
              </>
            );
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test.describe("No JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("Form can hit a loader", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      await Promise.all([
        page.waitForNavigation(),
        app.clickSubmitButton("/resource-route", {
          wait: false,
          method: "get",
        }),
      ]);
      // Check full HTML here - Chromium/Firefox/Webkit seem to render this in
      // a <pre> but Edge puts it in some weird code editor markup:
      // <body data-code-mirror="Readonly code editor.">
      //   <div hidden="true">"LUNCH"</div>
      expect(await app.getHtml()).toContain(LUNCH);
    });

    test("Form can hit an action", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        app.clickSubmitButton("/resource-route", {
          wait: false,
          method: "post",
        }),
      ]);
      // Check full HTML here - Chromium/Firefox/Webkit seem to render this in
      // a <pre> but Edge puts it in some weird code editor markup:
      // <body data-code-mirror="Readonly code editor.">
      //   <div hidden="true">"LUNCH"</div>
      expect(await app.getHtml()).toContain(CHEESESTEAK);
    });
  });

  test("load can hit a loader", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#fetcher-load");
    await page.waitForSelector(`pre:has-text("${LUNCH}")`);
  });

  test("submit can hit an action", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
  });

  test("submit can hit an action with json", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/fetcher-echo", true);
    await page.fill("#fetcher-input", "input value");
    await app.clickElement("#fetcher-submit-json");
    await page.waitForSelector(`#fetcher-idle`);
    expect(await app.getHtml()).toMatch(
      'ACTION (application/json) input value"'
    );
  });

  test("submit can hit an action with null json", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/fetcher-echo", true);
    await app.clickElement("#fetcher-submit-json-null");
    await new Promise((r) => setTimeout(r, 1000));
    await page.waitForSelector(`#fetcher-idle`);
    expect(await app.getHtml()).toMatch('ACTION (application/json) null"');
  });

  test("submit can hit an action with text", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/fetcher-echo", true);
    await page.fill("#fetcher-input", "input value");
    await app.clickElement("#fetcher-submit-text");
    await page.waitForSelector(`#fetcher-idle`);
    expect(await app.getHtml()).toMatch(
      'ACTION (text/plain;charset=UTF-8) input value"'
    );
  });

  test("submit can hit an action with empty text", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/fetcher-echo", true);
    await app.clickElement("#fetcher-submit-text-empty");
    await new Promise((r) => setTimeout(r, 1000));
    await page.waitForSelector(`#fetcher-idle`);
    expect(await app.getHtml()).toMatch('ACTION (text/plain;charset=UTF-8) "');
  });

  test("submit can hit an action only route", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/fetcher-action-only-call");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
  });

  test("fetchers handle ?index param correctly", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/parent");

    await app.clickElement("#load-parent");
    await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_LOADER}")`);

    await app.clickElement("#load-index");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

    // fetcher.submit({}) defaults to GET for the current Route
    await app.clickElement("#submit-empty");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

    await app.clickElement("#submit-parent-get");
    await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_LOADER}")`);

    await app.clickElement("#submit-index-get");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

    await app.clickElement("#submit-parent-post");
    await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_ACTION}")`);

    await app.clickElement("#submit-index-post");
    await page.waitForSelector(`pre:has-text("${PARENT_INDEX_ACTION}")`);
  });

  test("fetcher.load persists data through reloads", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/fetcher-echo", true);
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify(["idle/undefined"])
    );

    await page.fill("#fetcher-input", "1");
    await app.clickElement("#fetcher-load");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify(["idle/undefined", "loading/undefined", "idle/LOADER 1"])
    );

    await page.fill("#fetcher-input", "2");
    await app.clickElement("#fetcher-load");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify([
        "idle/undefined",
        "loading/undefined",
        "idle/LOADER 1",
        "loading/LOADER 1", // Preserves old data during reload
        "idle/LOADER 2",
      ])
    );
  });

  test("fetcher.submit persists data through resubmissions", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/fetcher-echo", true);
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify(["idle/undefined"])
    );

    await page.fill("#fetcher-input", "1");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify([
        "idle/undefined",
        "submitting/undefined",
        "loading/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
        "idle/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
      ])
    );

    await page.fill("#fetcher-input", "2");
    await app.clickElement("#fetcher-submit");
    await page.waitForSelector("#fetcher-idle");
    expect(await app.getHtml("pre")).toMatch(
      JSON.stringify([
        "idle/undefined",
        "submitting/undefined",
        "loading/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
        "idle/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
        // Preserves old data during resubmissions
        "submitting/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
        "loading/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 2",
        "idle/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 2",
      ])
    );
  });
});

test.describe("fetcher aborts and adjacent forms", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
          import * as React from "react";
          import {
            Form,
            useFetcher,
            useLoaderData,
            useNavigation
          } from "@remix-run/react";

          export async function loader({ request }) {
            // 1 second timeout on data
            await new Promise((r) => setTimeout(r, 1000));
            return { foo: 'bar' };
          }

          export default function Index() {
            const [open, setOpen] = React.useState(true);
            const { data } = useLoaderData();
            const navigation = useNavigation();

            return (
              <div>
                  {navigation.state === 'idle' && <div id="idle">Idle</div>}
                  <Form id="main-form">
                    <input id="submit-form" type="submit" />
                  </Form>

                  <button id="open" onClick={() => setOpen(true)}>Show async form</button>
                  {open && <Child onClose={() => setOpen(false)} />}
              </div>
            );
          }

          function Child({ onClose }) {
            const fetcher = useFetcher();

            return (
              <fetcher.Form method="get" action="/api">
                <button id="submit-fetcher" type="submit">Trigger fetcher (shows a message)</button>
                <button
                  type="submit"
                  form="main-form"
                  id="submit-and-close"
                  onClick={() => setTimeout(onClose, 250)}
                >
                  Submit main form and close async form
                </button>
              </fetcher.Form>
            );
          }
        `,

        "app/routes/api.tsx": js`
          export async function loader() {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return { message: 'Hello world!' }
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("Unmounting a fetcher does not cancel the request of an adjacent form", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    // Works as expected before the fetcher is loaded

    // submit the main form and unmount the fetcher form
    await app.clickElement("#submit-and-close");
    // Wait for our navigation state to be "Idle"
    await page.waitForSelector("#idle", { timeout: 2000 });

    // Breaks after the fetcher is loaded

    // re-mount the fetcher form
    await app.clickElement("#open");
    // submit the fetcher form
    await app.clickElement("#submit-fetcher");
    // submit the main form and unmount the fetcher form
    await app.clickElement("#submit-and-close");
    // Wait for navigation state to be "Idle"
    await page.waitForSelector("#idle", { timeout: 2000 });
  });
});

// Duplicate suite of the tests above running with single fetch enabled
// TODO(v3): remove the above suite of tests and just keep these
test.describe("single fetch", () => {
  test.describe("useFetcher", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    let CHEESESTEAK = "CHEESESTEAK";
    let LUNCH = "LUNCH";
    let PARENT_LAYOUT_LOADER = "parent layout loader";
    let PARENT_LAYOUT_ACTION = "parent layout action";
    let PARENT_INDEX_LOADER = "parent index loader";
    let PARENT_INDEX_ACTION = "parent index action";

    test.beforeAll(async () => {
      fixture = await createFixture({
        singleFetch: true,
        files: {
          "app/routes/resource-route-action-only.ts": js`
            import { json } from "@remix-run/node";
            export function action() {
              return new Response("${CHEESESTEAK}");
            }
          `,

          "app/routes/fetcher-action-only-call.tsx": js`
            import { useFetcher } from "@remix-run/react";

            export default function FetcherActionOnlyCall() {
              let fetcher = useFetcher();

              let executeFetcher = () => {
                fetcher.submit(new URLSearchParams(), {
                  method: 'post',
                  action: '/resource-route-action-only',
                });
              };

              return (
                <>
                  <button id="fetcher-submit" onClick={executeFetcher}>Click Me</button>
                  {fetcher.data && <pre>{fetcher.data}</pre>}
                </>
              );
            }
          `,

          "app/routes/resource-route.tsx": js`
            export function loader() {
              return new Response("${LUNCH}");
            }
            export function action() {
              return new Response("${CHEESESTEAK}");
            }
          `,

          "app/routes/_index.tsx": js`
            import { useFetcher } from "@remix-run/react";
            export default function Index() {
              let fetcher = useFetcher();
              return (
                <>
                  <fetcher.Form action="/resource-route">
                    <button type="submit" formMethod="get">get</button>
                    <button type="submit" formMethod="post">post</button>
                  </fetcher.Form>
                  <button id="fetcher-load" type="button" onClick={() => {
                    fetcher.load('/resource-route');
                  }}>
                    load
                  </button>
                  <button id="fetcher-submit" type="button" onClick={() => {
                    fetcher.submit(new URLSearchParams(), {
                      method: 'post',
                      action: '/resource-route'
                    });
                  }}>
                    submit
                  </button>
                  <pre>{fetcher.data}</pre>
                </>
              );
            }
          `,

          "app/routes/parent.tsx": js`
            import { Outlet } from "@remix-run/react";

            export function action() {
              return new Response("${PARENT_LAYOUT_ACTION}");
            };

            export function loader() {
              return new Response("${PARENT_LAYOUT_LOADER}");
            };

            export default function Parent() {
              return <Outlet />;
            }
          `,

          "app/routes/parent._index.tsx": js`
            import { useFetcher } from "@remix-run/react";

            export function action() {
              return new Response("${PARENT_INDEX_ACTION}");
            };

            export function loader() {
              return new Response("${PARENT_INDEX_LOADER}");
            };

            export default function ParentIndex() {
              let fetcher = useFetcher();

              return (
                <>
                  <pre>{fetcher.data}</pre>
                  <button id="load-parent" onClick={() => fetcher.load('/parent')}>
                    Load parent
                  </button>
                  <button id="load-index" onClick={() => fetcher.load('/parent?index')}>
                    Load index
                  </button>
                  <button id="submit-empty" onClick={() => fetcher.submit({})}>
                    Submit empty
                  </button>
                  <button id="submit-parent-get" onClick={() => fetcher.submit({}, { method: 'get', action: '/parent' })}>
                    Submit parent
                  </button>
                  <button id="submit-index-get" onClick={() => fetcher.submit({}, { method: 'get', action: '/parent?index' })}>
                    Submit index
                  </button>
                  <button id="submit-parent-post" onClick={() => fetcher.submit({}, { method: 'post', action: '/parent' })}>
                    Submit parent
                  </button>
                  <button id="submit-index-post" onClick={() => fetcher.submit({}, { method: 'post', action: '/parent?index' })}>
                    Submit index
                  </button>
                </>
              );
            }
          `,

          "app/routes/fetcher-echo.tsx": js`
            import { json } from "@remix-run/node";
            import { useFetcher } from "@remix-run/react";

            export async function action({ request }) {
              await new Promise(r => setTimeout(r, 1000));
              let contentType = request.headers.get('Content-Type');
              let value;
              if (contentType.includes('application/json')) {
                let json = await request.json();
                value = json === null ? json : json.value;
              } else if (contentType.includes('text/plain')) {
                value = await request.text();
              } else {
                value = (await request.formData()).get('value');
              }
              return json({ data: "ACTION (" + contentType + ") " + value })
            }

            export async function loader({ request }) {
              await new Promise(r => setTimeout(r, 1000));
              let value = new URL(request.url).searchParams.get('value');
              return json({ data: "LOADER " + value })
            }

            export default function Index() {
              let fetcherValues = [];
              if (typeof window !== 'undefined') {
                if (!window.fetcherValues) {
                  window.fetcherValues = [];
                }
                fetcherValues = window.fetcherValues
              }

              let fetcher = useFetcher();

              let currentValue = fetcher.state + '/' + fetcher.data?.data;
              if (fetcherValues[fetcherValues.length - 1] !== currentValue) {
                fetcherValues.push(currentValue)
              }

              return (
                <>
                  <input id="fetcher-input" name="value" />
                  <button id="fetcher-load" onClick={() => {
                    let value = document.getElementById('fetcher-input').value;
                    fetcher.load('/fetcher-echo?value=' + value)
                  }}>Load</button>
                  <button id="fetcher-submit" onClick={() => {
                    let value = document.getElementById('fetcher-input').value;
                    fetcher.submit({ value }, { method: 'post', action: '/fetcher-echo' })
                  }}>Submit</button>
                  <button id="fetcher-submit-json" onClick={() => {
                    let value = document.getElementById('fetcher-input').value;
                    fetcher.submit({ value }, { method: 'post', action: '/fetcher-echo', encType: 'application/json' })
                  }}>Submit JSON</button>
                  <button id="fetcher-submit-json-null" onClick={() => {
                    fetcher.submit(null, { method: 'post', action: '/fetcher-echo', encType: 'application/json' })
                  }}>Submit Null JSON</button>
                  <button id="fetcher-submit-text" onClick={() => {
                    let value = document.getElementById('fetcher-input').value;
                    fetcher.submit(value, { method: 'post', action: '/fetcher-echo', encType: 'text/plain' })
                  }}>Submit Text</button>
                  <button id="fetcher-submit-text-empty" onClick={() => {
                    fetcher.submit("", { method: 'post', action: '/fetcher-echo', encType: 'text/plain' })
                  }}>Submit Empty Text</button>

                  {fetcher.state === 'idle' ? <p id="fetcher-idle">IDLE</p> : null}
                  <pre>{JSON.stringify(fetcherValues)}</pre>
                </>
              );
            }
          `,
        },
      });

      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture.close();
    });

    test.describe("No JavaScript", () => {
      test.use({ javaScriptEnabled: false });

      test("Form can hit a loader", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/");

        await Promise.all([
          page.waitForNavigation(),
          app.clickSubmitButton("/resource-route", {
            wait: false,
            method: "get",
          }),
        ]);
        // Check full HTML here - Chromium/Firefox/Webkit seem to render this in
        // a <pre> but Edge puts it in some weird code editor markup:
        // <body data-code-mirror="Readonly code editor.">
        //   <div hidden="true">"LUNCH"</div>
        expect(await app.getHtml()).toContain(LUNCH);
      });

      test("Form can hit an action", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/");
        await Promise.all([
          page.waitForNavigation({ waitUntil: "load" }),
          app.clickSubmitButton("/resource-route", {
            wait: false,
            method: "post",
          }),
        ]);
        // Check full HTML here - Chromium/Firefox/Webkit seem to render this in
        // a <pre> but Edge puts it in some weird code editor markup:
        // <body data-code-mirror="Readonly code editor.">
        //   <div hidden="true">"LUNCH"</div>
        expect(await app.getHtml()).toContain(CHEESESTEAK);
      });
    });

    test("load can hit a loader", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickElement("#fetcher-load");
      await page.waitForSelector(`pre:has-text("${LUNCH}")`);
    });

    test("submit can hit an action", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickElement("#fetcher-submit");
      await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
    });

    test("submit can hit an action with json", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/fetcher-echo", true);
      await page.fill("#fetcher-input", "input value");
      await app.clickElement("#fetcher-submit-json");
      await page.waitForSelector(`#fetcher-idle`);
      expect(await app.getHtml()).toMatch(
        'ACTION (application/json) input value"'
      );
    });

    test("submit can hit an action with null json", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/fetcher-echo", true);
      await app.clickElement("#fetcher-submit-json-null");
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector(`#fetcher-idle`);
      expect(await app.getHtml()).toMatch('ACTION (application/json) null"');
    });

    test("submit can hit an action with text", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/fetcher-echo", true);
      await page.fill("#fetcher-input", "input value");
      await app.clickElement("#fetcher-submit-text");
      await page.waitForSelector(`#fetcher-idle`);
      expect(await app.getHtml()).toMatch(
        'ACTION (text/plain;charset=UTF-8) input value"'
      );
    });

    test("submit can hit an action with empty text", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/fetcher-echo", true);
      await app.clickElement("#fetcher-submit-text-empty");
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector(`#fetcher-idle`);
      expect(await app.getHtml()).toMatch(
        'ACTION (text/plain;charset=UTF-8) "'
      );
    });

    test("submit can hit an action only route", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/fetcher-action-only-call");
      await app.clickElement("#fetcher-submit");
      await page.waitForSelector(`pre:has-text("${CHEESESTEAK}")`);
    });

    test("fetchers handle ?index param correctly", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent");

      await app.clickElement("#load-parent");
      await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_LOADER}")`);

      await app.clickElement("#load-index");
      await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

      // fetcher.submit({}) defaults to GET for the current Route
      await app.clickElement("#submit-empty");
      await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

      await app.clickElement("#submit-parent-get");
      await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_LOADER}")`);

      await app.clickElement("#submit-index-get");
      await page.waitForSelector(`pre:has-text("${PARENT_INDEX_LOADER}")`);

      await app.clickElement("#submit-parent-post");
      await page.waitForSelector(`pre:has-text("${PARENT_LAYOUT_ACTION}")`);

      await app.clickElement("#submit-index-post");
      await page.waitForSelector(`pre:has-text("${PARENT_INDEX_ACTION}")`);
    });

    test("fetcher.load persists data through reloads", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);

      await app.goto("/fetcher-echo", true);
      expect(await app.getHtml("pre")).toMatch(
        JSON.stringify(["idle/undefined"])
      );

      await page.fill("#fetcher-input", "1");
      await app.clickElement("#fetcher-load");
      await page.waitForSelector("#fetcher-idle");
      expect(await app.getHtml("pre")).toMatch(
        JSON.stringify(["idle/undefined", "loading/undefined", "idle/LOADER 1"])
      );

      await page.fill("#fetcher-input", "2");
      await app.clickElement("#fetcher-load");
      await page.waitForSelector("#fetcher-idle");
      expect(await app.getHtml("pre")).toMatch(
        JSON.stringify([
          "idle/undefined",
          "loading/undefined",
          "idle/LOADER 1",
          "loading/LOADER 1", // Preserves old data during reload
          "idle/LOADER 2",
        ])
      );
    });

    test("fetcher.submit persists data through resubmissions", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);

      await app.goto("/fetcher-echo", true);
      expect(await app.getHtml("pre")).toMatch(
        JSON.stringify(["idle/undefined"])
      );

      await page.fill("#fetcher-input", "1");
      await app.clickElement("#fetcher-submit");
      await page.waitForSelector("#fetcher-idle");
      expect(await app.getHtml("pre")).toMatch(
        JSON.stringify([
          "idle/undefined",
          "submitting/undefined",
          "loading/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
          "idle/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
        ])
      );

      await page.fill("#fetcher-input", "2");
      await app.clickElement("#fetcher-submit");
      await page.waitForSelector("#fetcher-idle");
      expect(await app.getHtml("pre")).toMatch(
        JSON.stringify([
          "idle/undefined",
          "submitting/undefined",
          "loading/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
          "idle/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
          // Preserves old data during resubmissions
          "submitting/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 1",
          "loading/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 2",
          "idle/ACTION (application/x-www-form-urlencoded;charset=UTF-8) 2",
        ])
      );
    });
  });

  test.describe("fetcher aborts and adjacent forms", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        singleFetch: true,
        files: {
          "app/routes/_index.tsx": js`
            import * as React from "react";
            import {
              Form,
              useFetcher,
              useLoaderData,
              useNavigation
            } from "@remix-run/react";

            export async function loader({ request }) {
              // 1 second timeout on data
              await new Promise((r) => setTimeout(r, 1000));
              return { foo: 'bar' };
            }

            export default function Index() {
              const [open, setOpen] = React.useState(true);
              const { data } = useLoaderData();
              const navigation = useNavigation();

              return (
                <div>
                    {navigation.state === 'idle' && <div id="idle">Idle</div>}
                    <Form id="main-form">
                      <input id="submit-form" type="submit" />
                    </Form>

                    <button id="open" onClick={() => setOpen(true)}>Show async form</button>
                    {open && <Child onClose={() => setOpen(false)} />}
                </div>
              );
            }

            function Child({ onClose }) {
              const fetcher = useFetcher();

              return (
                <fetcher.Form method="get" action="/api">
                  <button id="submit-fetcher" type="submit">Trigger fetcher (shows a message)</button>
                  <button
                    type="submit"
                    form="main-form"
                    id="submit-and-close"
                    onClick={() => setTimeout(onClose, 250)}
                  >
                    Submit main form and close async form
                  </button>
                </fetcher.Form>
              );
            }
          `,

          "app/routes/api.tsx": js`
            export async function loader() {
              await new Promise((resolve) => setTimeout(resolve, 500));
              return { message: 'Hello world!' }
            }
          `,
        },
      });

      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture.close();
    });

    test("Unmounting a fetcher does not cancel the request of an adjacent form", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      // Works as expected before the fetcher is loaded

      // submit the main form and unmount the fetcher form
      await app.clickElement("#submit-and-close");
      // Wait for our navigation state to be "Idle"
      await page.waitForSelector("#idle", { timeout: 2000 });

      // Breaks after the fetcher is loaded

      // re-mount the fetcher form
      await app.clickElement("#open");
      // submit the fetcher form
      await app.clickElement("#submit-fetcher");
      // submit the main form and unmount the fetcher form
      await app.clickElement("#submit-and-close");
      // Wait for navigation state to be "Idle"
      await page.waitForSelector("#idle", { timeout: 2000 });
    });
  });
});
