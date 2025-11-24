import { test, expect } from "@playwright/test";
import {
  UNSAFE_ServerMode as ServerMode,
  UNSAFE_SingleFetchRedirectSymbol as SingleFetchRedirectSymbol,
} from "react-router";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  EXPRESS_SERVER,
  createProject,
  customDev,
  reactRouterConfig,
  viteConfig,
} from "./helpers/vite.js";
import getPort from "get-port";

const ISO_DATE = "2024-03-12T12:00:00.000Z";

const files = {
  "app/root.tsx": js`
    import { Form, Link, Links, Meta, Outlet, Scripts } from "react-router";

    export function headers ({ actionHeaders, loaderHeaders, errorHeaders }) {
      if (errorHeaders) {
        return errorHeaders;
      } else if ([...actionHeaders].length > 0) {
        return actionHeaders;
      } else {
        return loaderHeaders;
      }
    }

    export function loader() {
      return {
        message: "ROOT",
      };
    }

    export default function Root() {
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <Link to="/">Go to Home</Link><br/>
            <Link to="/data">Go to Data</Link><br/>
            <Link to="/a/b/c">Go to /a/b/c</Link><br/>
            <Form method="post" action="/data">
              <button type="submit" name="key" value="value">
                Submit
              </button>
            </Form>
            <Outlet />
            <Scripts />
          </body>
        </html>
      );
    }
  `,

  "app/routes/_index.tsx": js`
    export default function Index() {
      return <h1>Index</h1>
    }
  `,

  "app/routes/data.tsx": js`
    import { useActionData, useLoaderData } from "react-router";

    export async function action({ request }) {
      let formData = await request.formData();
      return {
        key: formData.get('key'),
      };
    }

    class MyClass {
      a: string
      b: bigint
      constructor(a: string, b: bigint) {
        this.a = a
        this.b = b
      }
      c() {}
    }

    export function loader({ request }) {
      if (new URL(request.url).searchParams.has("error")) {
        throw new Error("Loader Error");
      }
      return {
        message: "DATA",
        date: new Date("${ISO_DATE}"),
        function: () => {},
        class: new MyClass("hello", BigInt(1)),
      };
    }

    export default function Index() {
      let data = useLoaderData();
      let actionData = useActionData();
      return (
        <>
          <h1 id="heading">Data Route</h1>
          <p id="message">{data.message}</p>
          <p id="date">{data.date.toISOString()}</p>
          {actionData ? <p id="action-data">{actionData.key}</p> : null}
        </>
      )
    }
  `,

  "app/routes/data-with-response.tsx": js`
    import { useActionData, useLoaderData, data } from "react-router";

    export function headers ({ actionHeaders, loaderHeaders, errorHeaders }) {
      if ([...actionHeaders].length > 0) {
        return actionHeaders;
      } else {
        return loaderHeaders;
      }
    }

    export async function action({ request }) {
      let formData = await request.formData();
      return data({
        key: formData.get('key'),
      }, { status: 201, headers: { 'X-Action': 'yes' }});
    }

    class MyClass {
      a: string
      b: Date
      constructor(a: string, b: Date) {
        this.a = a
        this.b = b
      }
      c() {}
    }

    export function loader({ request }) {
      if (new URL(request.url).searchParams.has("error")) {
        throw new Error("Loader Error");
      }
      return data({
        message: "DATA",
        date: new Date("${ISO_DATE}"),
        function: () => {},
        class: new MyClass("hello", BigInt(1)),
      }, { status: 206, headers: { 'X-Loader': 'yes' }});
    }

    export default function DataWithResponse() {
      let data = useLoaderData();
      let actionData = useActionData();
      return (
        <>
          <h1 id="heading">Data</h1>
          <p id="message">{data.message}</p>
          <p id="date">{data.date.toISOString()}</p>
          {actionData ? <p id="action-data">{actionData.key}</p> : null}
        </>
      )
    }
  `,

  "app/routes/invalid-date.tsx": js`
    import { useLoaderData, data } from "react-router";

    export function loader({ request }) {
      return data({ invalidDate: new Date("invalid") });
    }

    export default function InvalidDate() {
      let data = useLoaderData();
      return (
        <>
          <h1 id="heading">Invalid Date</h1>
          <p id="date">{data.invalidDate.toISOString()}</p>
        </>
      )
    }
  `,
};

test.describe("single-fetch", () => {
  let oldConsoleError: typeof console.error;

  test.beforeEach(() => {
    oldConsoleError = console.error;
  });

  test.afterEach(() => {
    console.error = oldConsoleError;
  });

  test("loads proper data on single fetch loader requests", async () => {
    let fixture = await createFixture({
      files,
    });
    let res = await fixture.requestSingleFetchData("/_root.data");
    expect(res.data).toEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
    });
    expect(res.headers.get("Content-Type")).toBe("text/x-script");

    res = await fixture.requestSingleFetchData("/data.data");
    expect(res.data).toStrictEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/data": {
        data: {
          message: "DATA",
          date: new Date(ISO_DATE),
          function: undefined,
          class: {
            a: "hello",
            b: BigInt(1),
          },
        },
      },
    });

    res = await fixture.requestSingleFetchData("/invalid-date.data");
    expect(res.data).toEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/invalid-date": {
        data: {
          invalidDate: expect.any(Date),
        },
      },
    });

    let date = (
      res.data as { ["routes/invalid-date"]: { data: { invalidDate: Date } } }
    )["routes/invalid-date"].data.invalidDate;
    expect(isNaN(date.getTime())).toBe(true);
  });

  test("loads proper errors on single fetch loader requests", async () => {
    console.error = () => {};

    let fixture = await createFixture(
      {
        files,
      },
      ServerMode.Development,
    );

    let res = await fixture.requestSingleFetchData("/data.data?error=true");
    expect(res.data).toEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/data": {
        error: new Error("Loader Error"),
      },
    });
  });

  test("loads proper data on single fetch action requests", async () => {
    let fixture = await createFixture({
      files,
    });
    let postBody = new URLSearchParams();
    postBody.set("key", "value");
    let res = await fixture.requestSingleFetchData("/data.data", {
      method: "post",
      body: postBody,
    });
    expect(res.data).toEqual({
      data: {
        key: "value",
      },
    });
  });

  test("loads proper data (via data()) on single fetch loader requests", async () => {
    let fixture = await createFixture({
      files,
    });
    let res = await fixture.requestSingleFetchData("/data-with-response.data");
    expect(res.status).toEqual(206);
    expect(res.headers.get("X-Loader")).toEqual("yes");
    expect(res.data).toStrictEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/data-with-response": {
        data: {
          message: "DATA",
          date: new Date(ISO_DATE),
          function: undefined,
          class: {
            a: "hello",
            b: BigInt(1),
          },
        },
      },
    });
  });

  test("loads proper data (via data()) on single fetch action requests", async () => {
    let fixture = await createFixture({
      files,
    });
    let postBody = new URLSearchParams();
    postBody.set("key", "value");
    let res = await fixture.requestSingleFetchData("/data-with-response.data", {
      method: "post",
      body: postBody,
    });
    expect(res.status).toEqual(201);
    expect(res.headers.get("X-Action")).toEqual("yes");
    expect(res.data).toEqual({
      data: {
        key: "value",
      },
    });
  });

  test("loads proper data on document request", async ({ page }) => {
    let fixture = await createFixture({
      files,
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/data");
    expect(await app.getHtml("#heading")).toContain("Data");
    expect(await app.getHtml("#message")).toContain("DATA");
    expect(await app.getHtml("#date")).toContain(ISO_DATE);
  });

  test("allows SSR loaders to return undefined", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/_index.tsx": js`
          export function loader() {}
          export default function Index() {
            return <h1>Index</h1>
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    expect(await app.getHtml("h1")).toContain("Index");
  });

  test("loads proper data on client side navigation", async ({ page }) => {
    let fixture = await createFixture({
      files,
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#message");
    expect(await app.getHtml("#heading")).toContain("Data");
    expect(await app.getHtml("#message")).toContain("DATA");
    expect(await app.getHtml("#date")).toContain(ISO_DATE);
  });

  test("loads proper data on client side action navigation", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files,
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#message");
    expect(await app.getHtml("#heading")).toContain("Data");
    expect(await app.getHtml("#message")).toContain("DATA");
    expect(await app.getHtml("#date")).toContain(ISO_DATE);
    expect(await app.getHtml("#action-data")).toContain("value");
  });

  test("allows fine-grained revalidation", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/no-revalidate.tsx": js`
          import { Form, useActionData, useLoaderData, useNavigation } from 'react-router';

          export async function action({ request }) {
            let fd = await request.formData();
            return { shouldRevalidate: fd.get('revalidate') === "yes" }
          }

          let count = 0;
          export function loader() {
            return { count: ++count };
          }

          export default function Comp() {
            let navigation = useNavigation();
            let data = useLoaderData();
            let actionData = useActionData();
            return (
              <Form method="post">
                <button type="submit" name="revalidate" value="yes">Submit w/Revalidation</button>
                <button type="submit" name="revalidate" value="no">Submit w/o Revalidation</button>
                <p id="data">{data.count}</p>
                {navigation.state === "idle" ? <p id="idle">idle</p> : null}
                {actionData ? <p id="action-data">yes</p> : null}
              </Form>
            );
          }

          export function shouldRevalidate({ actionResult }) {
            return actionResult.shouldRevalidate === true;
          }
        `,
      },
    });

    let urls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "GET" && req.url().includes(".data")) {
        urls.push(req.url());
      }
    });

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/no-revalidate");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="revalidate"][value="yes"]');
    await page.waitForSelector("#action-data");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("2");
    expect(urls).toEqual([expect.stringMatching(/\/no-revalidate\.data$/)]);

    await page.click('button[name="revalidate"][value="no"]');
    await page.waitForSelector("#action-data");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("2");
    expect(urls).toEqual([
      expect.stringMatching(/\/no-revalidate\.data$/),
      expect.stringMatching(/\/no-revalidate\.data\?_routes=root$/),
    ]);
  });

  test("revalidates on reused routes by default", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";
          export default function Index() {
            return <Link to="/parent">Go to Parent</Link>
          }
        `,
        "app/routes/parent.tsx": js`
          import { Link, Outlet } from "react-router";
          import type { Route } from "./+types/parent";

          let count = 0;
          export function loader() {
            return ++count;
          }

          export default function Parent({ loaderData }: Route.ComponentProps) {
            return (
              <>
                <h1 data-parent={loaderData}>PARENT:{loaderData}</h1>
                <Link to="/parent">Go to Parent</Link><br/>
                <Link to="/parent/child">Go to Child</Link>
                <Outlet />
              </>
            );
          }
        `,
        "app/routes/parent.child.tsx": js`
          import { Outlet } from "react-router";
          import type { Route } from "./+types/parent";

          export function loader() {
            return "CHILD"
          }

          export default function Parent({ loaderData }: Route.ComponentProps) {
            return <h2 data-child>{loaderData}</h2>
          }
        `,
      },
    });

    let urls: string[] = [];
    page.on("request", (req) => {
      let url = new URL(req.url());
      if (req.method() === "GET" && url.pathname.endsWith(".data")) {
        urls.push(url.pathname + url.search);
      }
    });

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);

    await app.clickLink("/parent");
    await page.waitForSelector('[data-parent="1"]');
    expect(urls).toEqual(["/parent.data"]);
    urls.length = 0;

    await app.clickLink("/parent/child");
    await page.waitForSelector("[data-child]");
    await expect(page.locator('[data-parent="2"]')).toBeDefined();
    expect(urls).toEqual(["/parent/child.data"]);
    urls.length = 0;

    await app.clickLink("/parent");
    await page.waitForSelector('[data-parent="3"]');
    expect(urls).toEqual(["/parent.data"]);
    urls.length = 0;
  });

  test("does not revalidate on 4xx/5xx action responses", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/action.tsx": js`
          import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router';

          export async function action({ request }) {
            let fd = await request.formData();
            if (fd.get('throw') === "5xx") {
              throw new Response("Thrown 500", { status: 500 });
            }
            if (fd.get('throw') === "4xx") {
              throw new Response("Thrown 400", { status: 400 });
            }
            if (fd.get('return') === "5xx") {
              return new Response("Returned 500", { status: 500 });
            }
            if (fd.get('return') === "4xx") {
              return  new Response("Returned 400", { status: 400 });
            }
            return null;
          }

          let count = 0;
          export function loader() {
            return { count: ++count };
          }

          export default function Comp() {
            let navigation = useNavigation();
            let data = useLoaderData();
            return (
              <Form method="post">
                <button type="submit" name="throw" value="5xx">Throw 5xx</button>
                <button type="submit" name="throw" value="4xx">Throw 4xx</button>
                <button type="submit" name="return" value="5xx">Return 5xx</button>
                <button type="submit" name="return" value="4xx">Return 4xx</button>
                <p id="data">{data.count}</p>
                {navigation.state === "idle" ? <p id="idle">idle</p> : null}
              </Form>
            );
          }

          export function ErrorBoundary() {
            return (
              <div>
                <h1 id="error">Error</h1>
                <Link to="/action">Back</Link>
              </div>
            );
          }
        `,
      },
    });

    let urls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "GET" && req.url().includes(".data")) {
        urls.push(req.url());
      }
    });

    console.error = () => {};

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/action");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="return"][value="5xx"]');
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="return"][value="4xx"]');
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="throw"][value="5xx"]');
    await page.waitForSelector("#error");
    expect(urls).toEqual([]);

    await app.clickLink("/action");
    await page.waitForSelector("#data");
    expect(await app.getHtml("#data")).toContain("2");
    urls = [];

    await page.click('button[name="throw"][value="4xx"]');
    await page.waitForSelector("#error");
    expect(urls).toEqual([]);
  });

  test("does not revalidate on 4xx/5xx action responses (via data())", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/action.tsx": js`
          import { Form, Link, useActionData, useLoaderData, useNavigation, data } from 'react-router';

          export async function action({ request }) {
            let fd = await request.formData();
            if (fd.get('throw') === "5xx") {
              throw data("Thrown 500", { status: 500 });
            }
            if (fd.get('throw') === "4xx") {
              throw data("Thrown 400", { status: 400 });
            }
            if (fd.get('return') === "5xx") {
              return data("Returned 500", { status: 500 });
            }
            if (fd.get('return') === "4xx") {
              return data("Returned 400", { status: 400 });
            }
            return null;
          }

          let count = 0;
          export function loader() {
            return { count: ++count };
          }

          export default function Comp() {
            let navigation = useNavigation();
            let data = useLoaderData();
            return (
              <Form method="post">
                <button type="submit" name="throw" value="5xx">Throw 5xx</button>
                <button type="submit" name="throw" value="4xx">Throw 4xx</button>
                <button type="submit" name="return" value="5xx">Return 5xx</button>
                <button type="submit" name="return" value="4xx">Return 4xx</button>
                <p id="data">{data.count}</p>
                {navigation.state === "idle" ? <p id="idle">idle</p> : null}
              </Form>
            );
          }

          export function ErrorBoundary() {
            return (
              <div>
                <h1 id="error">Error</h1>
                <Link to="/action">Back</Link>
              </div>
            );
          }
        `,
      },
    });

    let urls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "GET" && req.url().includes(".data")) {
        urls.push(req.url());
      }
    });

    console.error = () => {};

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/action");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="return"][value="5xx"]');
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="return"][value="4xx"]');
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="throw"][value="5xx"]');
    await page.waitForSelector("#error");
    expect(urls).toEqual([]);

    await app.clickLink("/action");
    await page.waitForSelector("#data");
    expect(await app.getHtml("#data")).toContain("2");
    urls = [];

    await page.click('button[name="throw"][value="4xx"]');
    await page.waitForSelector("#error");
    expect(urls).toEqual([]);
  });

  test("provides proper defaultShouldRevalidate value on 4xx/5xx action responses", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/action.tsx": js`
          import { Form, Link, useActionData, useLoaderData, useNavigation, data } from 'react-router';

          export async function action({ request }) {
            let fd = await request.formData();
            if (fd.get('throw') === "5xx") {
              throw data("Thrown 500", { status: 500 });
            }
            if (fd.get('throw') === "4xx") {
              throw data("Thrown 400", { status: 400 });
            }
            if (fd.get('return') === "5xx") {
              return data("Returned 500", { status: 500 });
            }
            if (fd.get('return') === "4xx") {
              return data("Returned 400", { status: 400 });
            }
            return null;
          }

          let count = 0;
          export function loader() {
            return { count: ++count };
          }

          export function shouldRevalidate({ defaultShouldRevalidate }) {
            return defaultShouldRevalidate;
          }

          export default function Comp() {
            let navigation = useNavigation();
            let data = useLoaderData();
            return (
              <Form method="post">
                <button type="submit" name="throw" value="5xx">Throw 5xx</button>
                <button type="submit" name="throw" value="4xx">Throw 4xx</button>
                <button type="submit" name="return" value="5xx">Return 5xx</button>
                <button type="submit" name="return" value="4xx">Return 4xx</button>
                <p id="data">{data.count}</p>
                {navigation.state === "idle" ? <p id="idle">idle</p> : null}
              </Form>
            );
          }

          export function ErrorBoundary() {
            return (
              <div>
                <h1 id="error">Error</h1>
                <Link to="/action">Back</Link>
              </div>
            );
          }
        `,
      },
    });

    let urls: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "GET" && req.url().includes(".data")) {
        urls.push(req.url());
      }
    });

    console.error = () => {};

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/action");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="return"][value="5xx"]');
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="return"][value="4xx"]');
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#data")).toContain("1");
    expect(urls).toEqual([]);

    await page.click('button[name="throw"][value="5xx"]');
    await page.waitForSelector("#error");
    expect(urls).toEqual([]);

    await app.clickLink("/action");
    await page.waitForSelector("#data");
    expect(await app.getHtml("#data")).toContain("2");
    urls = [];

    await page.click('button[name="throw"][value="4xx"]');
    await page.waitForSelector("#error");
    expect(urls).toEqual([]);
  });

  test("returns headers correctly for singular loader and action calls", async () => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/headers.tsx": js`
          export function headers ({ actionHeaders, loaderHeaders, errorHeaders }) {
            if (errorHeaders) {
              return errorHeaders;
            } else if ([...actionHeaders].length > 0) {
              return actionHeaders;
            } else {
              return loaderHeaders;
            }
          }

          export function action({ request }) {
            if (new URL(request.url).searchParams.has("error")) {
              throw new Response(null, { headers: { "x-action-error": "true" } });
            }
            return new Response(null, { headers: { "x-action": "true" } });
          }

          export function loader({ request }) {
            if (new URL(request.url).searchParams.has("error")) {
              throw new Response(null, { headers: { "x-loader-error": "true" } });
            }
            return new Response(null, { headers: { "x-loader": "true" } });
          }

          export default function Comp() {
            return null;
          }
        `,
      },
    });

    // Loader
    let docResponse = await fixture.requestDocument("/headers");
    let dataResponse = await fixture.requestSingleFetchData("/headers.data");
    expect(docResponse.headers.get("x-loader")).toEqual("true");
    expect(dataResponse.headers.get("x-loader")).toEqual("true");

    // Action
    docResponse = await fixture.requestDocument("/headers", {
      method: "post",
      body: null,
    });
    dataResponse = await fixture.requestSingleFetchData("/headers.data", {
      method: "post",
      body: null,
    });
    expect(docResponse.headers.get("x-action")).toEqual("true");
    expect(dataResponse.headers.get("x-action")).toEqual("true");

    console.error = () => {};

    // Loader Error
    docResponse = await fixture.requestDocument("/headers?error");
    dataResponse = await fixture.requestSingleFetchData("/headers.data?error");
    expect(docResponse.headers.get("x-loader-error")).toEqual("true");
    expect(dataResponse.headers.get("x-loader-error")).toEqual("true");

    // Action Error
    docResponse = await fixture.requestDocument("/headers?error", {
      method: "post",
      body: null,
    });
    dataResponse = await fixture.requestSingleFetchData("/headers.data?error", {
      method: "post",
      body: null,
    });
    expect(docResponse.headers.get("x-action-error")).toEqual("true");
    expect(dataResponse.headers.get("x-action-error")).toEqual("true");
  });

  test("merges headers from nested routes when raw Responses are returned", async () => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/a.tsx": js`
          export function headers({ loaderHeaders }) {
            return loaderHeaders;
          }

          export function loader({ request }) {
            let headers = new Headers();
            headers.set('x-one', 'a set');
            headers.set('x-two', 'a set');
            return new Response(null, { headers });
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.tsx": js`
          export function headers({ actionHeaders, loaderHeaders, parentHeaders }) {
            let h = new Headers();
            for (let [name, value] of parentHeaders) {
              h.set(name, value);
            }
            for (let [name, value] of loaderHeaders) {
              h.set(name, value);
            }
            for (let [name, value] of actionHeaders) {
              h.set(name, value);
            }
            return h;
          }

          export function action({ request }) {
            let headers = new Headers();
            headers.set('x-two', 'b action set');
            return new Response(null, { headers });
          }

          export function loader({ request }) {
            let headers = new Headers();
            headers.set('x-two', 'b set');
            return new Response(null, { headers });
          }

          export default function Comp() {
            return null;
          }
        `,
      },
    });

    // x-one uses both set and append
    // x-two only uses set
    // x-three only uses append
    // x-four deletes
    let res: Awaited<
      ReturnType<
        typeof fixture.requestDocument | typeof fixture.requestSingleFetchData
      >
    >;
    res = await fixture.requestDocument("/a");
    expect(res.headers.get("x-one")).toEqual("a set");
    expect(res.headers.get("x-two")).toEqual("a set");

    res = await fixture.requestSingleFetchData("/a.data");
    expect(res.headers.get("x-one")).toEqual("a set");
    expect(res.headers.get("x-two")).toEqual("a set");

    res = await fixture.requestDocument("/a/b");
    expect(res.headers.get("x-one")).toEqual("a set");
    expect(res.headers.get("x-two")).toEqual("b set");

    res = await fixture.requestSingleFetchData("/a/b.data");
    expect(res.headers.get("x-one")).toEqual("a set");
    expect(res.headers.get("x-two")).toEqual("b set");

    // Action only - single fetch request
    res = await fixture.requestSingleFetchData("/a/b.data", {
      method: "post",
      body: null,
    });
    expect(res.headers.get("x-one")).toEqual(null);
    expect(res.headers.get("x-two")).toEqual("b action set");

    // Actions and Loaders - Document request
    res = await fixture.requestDocument("/a/b", {
      method: "post",
      body: null,
    });
    expect(res.headers.get("x-one")).toEqual("a set");
    expect(res.headers.get("x-two")).toEqual("b action set");
  });

  test("merges status codes from nested routes when raw Responses are used", async () => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/a.tsx": js`
          export function loader({ request }) {
            if (new URL(request.url).searchParams.has("error")) {
              throw new Response(null, { status: 401 });
            } else {
              return new Response(null, { status: 201 });
            }
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.tsx": js`
          export function loader({ request }) {
            return new Response(null, { status: 202 });
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.c.tsx": js`
          export function action({ request }) {
            return new Response(null, { status: 206 });
          }

          export function loader({ request }) {
            return new Response(null, { status: 203 });
          }

          export default function Comp() {
            return null;
          }
        `,
      },
    });

    console.error = () => {};

    // Loaders
    let res: Awaited<
      ReturnType<
        typeof fixture.requestDocument | typeof fixture.requestSingleFetchData
      >
    >;
    res = await fixture.requestDocument("/a");
    expect(res.status).toEqual(201);

    res = await fixture.requestSingleFetchData("/a.data");
    expect(res.status).toEqual(201);

    res = await fixture.requestDocument("/a/b");
    expect(res.status).toEqual(202);

    res = await fixture.requestSingleFetchData("/a/b.data");
    expect(res.status).toEqual(202);

    res = await fixture.requestDocument("/a/b/c");
    expect(res.status).toEqual(203);

    res = await fixture.requestSingleFetchData("/a/b/c.data");
    expect(res.status).toEqual(203);

    // Errors
    res = await fixture.requestDocument("/a?error");
    expect(res.status).toEqual(401);

    res = await fixture.requestSingleFetchData("/a.data?error");
    expect(res.status).toEqual(401);

    res = await fixture.requestDocument("/a/b?error");
    expect(res.status).toEqual(401);

    res = await fixture.requestSingleFetchData("/a/b.data?error");
    expect(res.status).toEqual(401);

    // Actions
    res = await fixture.requestDocument("/a/b/c", {
      method: "post",
      body: null,
    });
    expect(res.status).toEqual(206);

    res = await fixture.requestSingleFetchData("/a/b/c.data", {
      method: "post",
      body: null,
    });
    expect(res.status).toEqual(206);
  });

  test("processes thrown loader redirects via Response", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function loader() {
            throw redirect('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    console.error = () => {};

    let res = await fixture.requestDocument("/data");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/target");
    expect(await res.text()).toBe("");

    let { status, data } = await fixture.requestSingleFetchData("/data.data");
    expect(data).toEqual({
      [SingleFetchRedirectSymbol]: {
        status: 302,
        redirect: "/target",
        reload: false,
        replace: false,
        revalidate: false,
      },
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes returned loader redirects via Response", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function loader() {
            return redirect('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });
    let res = await fixture.requestDocument("/data");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/target");
    expect(await res.text()).toBe("");

    let { status, data } = await fixture.requestSingleFetchData("/data.data");
    expect(data).toEqual({
      [SingleFetchRedirectSymbol]: {
        status: 302,
        redirect: "/target",
        reload: false,
        replace: false,
        revalidate: false,
      },
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes thrown loader replace redirects via Response", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { replace } from 'react-router';
          export function loader() {
            throw replace('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    console.error = () => {};

    let res = await fixture.requestDocument("/data");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/target");
    expect(await res.text()).toBe("");

    let { status, data } = await fixture.requestSingleFetchData("/data.data");
    expect(data).toEqual({
      [SingleFetchRedirectSymbol]: {
        status: 302,
        redirect: "/target",
        reload: false,
        replace: true,
        revalidate: false,
      },
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes thrown action redirects via Response", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function action() {
            throw redirect('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    console.error = () => {};

    let res = await fixture.requestDocument("/data", {
      method: "post",
      body: null,
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/target");
    expect(await res.text()).toBe("");

    let { status, data } = await fixture.requestSingleFetchData("/data.data", {
      method: "post",
      body: null,
    });
    expect(data).toEqual({
      status: 302,
      redirect: "/target",
      reload: false,
      replace: false,
      revalidate: false,
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes returned action redirects via Response", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function action() {
            return redirect('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    let res = await fixture.requestDocument("/data", {
      method: "post",
      body: null,
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/target");
    expect(await res.text()).toBe("");

    let { status, data } = await fixture.requestSingleFetchData("/data.data", {
      method: "post",
      body: null,
    });
    expect(data).toEqual({
      status: 302,
      redirect: "/target",
      reload: false,
      replace: false,
      revalidate: false,
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes thrown loader redirects (resource route)", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function loader({ request }) {
            throw redirect('/target');
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    console.error = () => {};

    let res = await fixture.requestDocument("/data");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/target");
    expect(await res.text()).toBe("");

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes returned loader redirects (resource route)", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function loader({ request }) {
            return redirect('/target');
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    let res = await fixture.requestDocument("/data");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/target");
    expect(await res.text()).toBe("");

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes redirects from handleDataRequest (after loaders)", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/entry.server.tsx": js`
          import { PassThrough } from "node:stream";

          import type { EntryContext } from "react-router";
          import { createReadableStreamFromReadable } from "@react-router/node";
          import { ServerRouter } from "react-router";
          import { renderToPipeableStream } from "react-dom/server";

          export default function handleRequest(
            request: Request,
            responseStatusCode: number,
            responseHeaders: Headers,
            remixContext: EntryContext
          ) {
            return new Promise((resolve, reject) => {
              const { pipe } = renderToPipeableStream(
                <ServerRouter context={remixContext} url={request.url} />,
                {
                  onShellReady() {
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);
                    responseHeaders.set("Content-Type", "text/html");
                    resolve(
                      new Response(stream, {
                        headers: responseHeaders,
                        status: responseStatusCode,
                      })
                    );
                    pipe(body);
                  },
                  onShellError(error: unknown) {
                    reject(error);
                  },
                  onError(error: unknown) {
                    responseStatusCode = 500;
                  },
                }
              );
            });
          }

          export function handleDataRequest(response, { request }) {
            if (request.url.endsWith("/data.data")) {
              return new Response(null, {
                status: 302,
                headers: {
                  Location: "/target",
                },
              });
            }
            return response;
          }
        `,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function loader() {
            return redirect('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    let { status, data } = await fixture.requestSingleFetchData("/data.data");
    expect(data).toEqual({
      [SingleFetchRedirectSymbol]: {
        status: 302,
        redirect: "/target",
        reload: false,
        replace: false,
        revalidate: false,
      },
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes redirects from handleDataRequest (after actions)", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/entry.server.tsx": js`
          import { PassThrough } from "node:stream";

          import type { EntryContext } from "react-router";
          import { createReadableStreamFromReadable } from "@react-router/node";
          import { ServerRouter } from "react-router";
          import { renderToPipeableStream } from "react-dom/server";

          export default function handleRequest(
            request: Request,
            responseStatusCode: number,
            responseHeaders: Headers,
            remixContext: EntryContext
          ) {
            return new Promise((resolve, reject) => {
              const { pipe } = renderToPipeableStream(
                <ServerRouter context={remixContext} url={request.url} />,
                {
                  onShellReady() {
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);
                    responseHeaders.set("Content-Type", "text/html");
                    resolve(
                      new Response(stream, {
                        headers: responseHeaders,
                        status: responseStatusCode,
                      })
                    );
                    pipe(body);
                  },
                  onShellError(error: unknown) {
                    reject(error);
                  },
                  onError(error: unknown) {
                    responseStatusCode = 500;
                  },
                }
              );
            });
          }

          export function handleDataRequest(response, { request }) {
            if (request.url.endsWith("/data.data")) {
              return new Response(null, {
                status: 302,
                headers: {
                  Location: "/target",
                },
              });
            }
            return response;
          }
        `,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function action() {
            return redirect('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    let { status, data } = await fixture.requestSingleFetchData("/data.data", {
      method: "post",
      body: null,
    });
    expect(data).toEqual({
      status: 302,
      redirect: "/target",
      reload: false,
      replace: false,
      revalidate: false,
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("supports a basename", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        "vite.config.ts": js`
          import { reactRouter } from "@react-router/dev/vite";

          export default {
            base: "/base/",
            plugins: [reactRouter()]
          }
        `,
        "react-router.config.ts": reactRouterConfig({
          basename: "/base/",
        }),
        ...files,
      },
      useReactRouterServe: true,
    });

    let appFixture = await createAppFixture(fixture);

    let requests: string[] = [];
    page.on("request", (req) => {
      let url = new URL(req.url());
      if (url.pathname.endsWith(".data")) {
        requests.push(url.pathname + url.search);
      }
    });

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/base/");
    await app.clickLink("/base/data");
    await expect(page.getByText("Data Route")).toBeVisible();
    await app.clickLink("/base/");
    await expect(page.getByText("Index")).toBeVisible();

    expect(requests).toEqual(["/base/data.data", "/base/_root.data"]);
  });

  test("processes redirects when a basename is present", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "react-router.config.ts": reactRouterConfig({
          basename: "/base",
        }),
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          export function loader() {
            throw redirect('/target');
          }
          export default function Component() {
            return null
          }
        `,
        "app/routes/target.tsx": js`
          export default function Component() {
            return <h1 id="target">Target</h1>
          }
        `,
      },
    });

    console.error = () => {};

    let res = await fixture.requestDocument("/base/data");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/base/target");
    expect(await res.text()).toBe("");

    let { status, data } =
      await fixture.requestSingleFetchData("/base/data.data");
    expect(data).toEqual({
      [SingleFetchRedirectSymbol]: {
        status: 302,
        redirect: "/target",
        reload: false,
        replace: false,
        revalidate: false,
      },
    });
    expect(status).toBe(202);

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/base/");
    await app.clickLink("/base/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes redirects returned outside of react router", async ({
    page,
  }) => {
    let port = await getPort();
    let cwd = await createProject({
      "vite.config.js": await viteConfig.basic({ port }),
      "server.mjs": EXPRESS_SERVER({
        port,
        customLogic: js`
          app.use(async (req, res, next) => {
            if (req.url === "/page.data") {
              res.status(204);
              res.append('X-Remix-Status', '302');
              res.append('X-Remix-Redirect', '/target');
              res.end();
            } else {
              next();
            }
          });
        `,
      }),
      "app/routes/_index.tsx": js`
        import { Link, Form } from "react-router";
        export default function Component() {
          return (
            <div id="index">
              <Link to="/page">Go to /page</Link>
              <Form method="post" action="/page">
                <button type="submit" name="key" value="value">Submit</button>
              </Form>
            </div>
          );
        }
      `,
      "app/routes/page.tsx": js`
        export function action() {
          return null
        }
        export function loader() {
            return null
        }
        export default function Component() {
          return <p>Should not see me</p>
        }
      `,
      "app/routes/target.tsx": js`
        import { Link } from "react-router";
        export default function Component() {
          return (
            <>
              <h1 id="target">Target</h1>
              <Link to="/">Go home</Link>
            </>
          );
        }
      `,
    });
    let stop = await customDev({ cwd, port });

    try {
      await page.goto(`http://localhost:${port}/`, {
        waitUntil: "networkidle",
      });

      await page.locator('a[href="/page"]').click();
      await page.waitForSelector("#target");
      await expect(page.locator("#target")).toHaveText("Target");

      await page.locator('a[href="/"]').click();
      await page.waitForSelector("#index");

      await page.locator('button[type="submit"]').click();
      await page.waitForSelector("#target");
      await expect(page.locator("#target")).toHaveText("Target");
    } finally {
      stop();
    }
  });

  test("processes thrown loader errors", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          import { isRouteErrorResponse, useRouteError } from 'react-router';
          export function headers({ errorHeaders }) {
            return errorHeaders;
          }
          export function loader({ request }) {
            throw new Response(null, { status: 404, headers: { 'X-Foo': 'Bar' } });
          }
          export default function Component() {
            return null
          }
          export function ErrorBoundary() {
            let error = useRouteError();
            if (isRouteErrorResponse(error)) {
              return <p id="error">{error.status}</p>
            }
            throw new Error('Nope')
          }
        `,
      },
    });

    console.error = () => {};

    let res = await fixture.requestDocument("/data");
    expect(res.status).toBe(404);
    expect(res.headers.get("X-Foo")).toBe("Bar");
    expect(await res.text()).toContain('<p id="error">404</p>');

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#error");
    expect(await app.getHtml("#error")).toContain("404");
  });

  test("processes thrown action errors via responseStub", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from 'react-router';
          import { isRouteErrorResponse, useRouteError } from 'react-router';
          export function headers({ errorHeaders }) {
            return errorHeaders;
          }
          export function action({ request }) {
            throw new Response(null, { status: 404, headers: { 'X-Foo': 'Bar' } });
          }
          export default function Component() {
            return null
          }
          export function ErrorBoundary() {
            let error = useRouteError();
            if (isRouteErrorResponse(error)) {
              return <p id="error">{error.status}</p>
            }
            throw new Error('Nope')
          }
        `,
      },
    });

    console.error = () => {};

    let res = await fixture.requestDocument("/data", {
      method: "post",
      body: null,
    });
    expect(res.status).toBe(404);
    expect(res.headers.get("X-Foo")).toBe("Bar");
    expect(await res.text()).toContain('<p id="error">404</p>');

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#error");
    expect(await app.getHtml("#error")).toContain("404");
  });

  test("allows fetcher to hit resource route and return via turbo stream", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/_index.tsx": js`
          import { useFetcher } from "react-router";

          export default function Component() {
            let fetcher = useFetcher();
            return (
              <div>
                <button id="load" onClick={() => fetcher.load('/resource')}>
                  Load
                </button>
                {fetcher.data ? <pre id="fetcher-data">{fetcher.data.message} {fetcher.data.date.toISOString()}</pre> : null}
              </div>
            );
          }
        `,
        "app/routes/resource.tsx": js`
          export function loader() {
            // Fetcher calls to resource routes will append ".data" and we'll go through
            // the turbo-stream flow.  If a user were to curl this endpoint they'd go
            // through "handleResourceRoute" and it would be returned as "json()"
            return {
              message: "RESOURCE",
              date: new Date("${ISO_DATE}"),
            };
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("#load");
    await page.waitForSelector("#fetcher-data");
    expect(await app.getHtml("#fetcher-data")).toContain(
      "RESOURCE 2024-03-12T12:00:00.000Z",
    );
  });

  test("Strips ?_routes query param from loader/action requests", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";
          export default function Component() {
            return <Link to="/parent/a">Go to /parent/a</Link>;
          }
        `,
        "app/routes/parent.tsx": js`
          import { Link, Outlet, useLoaderData } from "react-router";
          export function loader({ request }) {
            return { url: request.url };
          }
          export default function Component() {
            return (
              <>
                <p id="parent">Parent loader URL: {useLoaderData().url}</p>
                <Outlet/>
              </>
            );
          }
        `,
        "app/routes/parent.a.tsx": js`
          import { useLoaderData } from "react-router";
          export function loader({ request }) {
            return { url: request.url };
          }
          export async function clientLoader({ request, serverLoader }) {
            let serverData = await serverLoader();
            return {
              serverUrl: serverData.url,
              clientUrl: request.url
            }
          }
          export default function Component() {
            let data = useLoaderData();
            return (
              <>
                <p id="a-server">A server loader URL: {data.serverUrl}</p>
                <p id="a-client">A client loader URL: {data.clientUrl}</p>
              </>
            );
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let urls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes(".data")) {
        urls.push(req.url());
      }
    });

    await app.goto("/");

    await app.clickLink("/parent/a");
    await page.waitForSelector("#a-server");

    // HTTP Requests contained routes params
    expect(urls.length).toBe(2);
    expect(urls[0].endsWith("/parent/a.data?_routes=routes%2Fparent.a")).toBe(
      true,
    );
    expect(
      urls[1].endsWith("/parent/a.data?_routes=root%2Croutes%2Fparent"),
    ).toBe(true);

    // But loaders don't receive any routes params
    expect(await app.getHtml("#parent")).toMatch(
      />Parent loader URL: http:\/\/localhost:\d+\/parent\/a</,
    );
    expect(await app.getHtml("#a-server")).toMatch(
      />A server loader URL: http:\/\/localhost:\d+\/parent\/a</,
    );
    expect(await app.getHtml("#a-client")).toMatch(
      />A client loader URL: http:\/\/localhost:\d+\/parent\/a</,
    );
  });

  test("Strips Content-Length header from loader/action responses", async () => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/data-with-response.tsx": js`
          import { useActionData, useLoaderData, data } from "react-router";

          export function headers ({ actionHeaders, loaderHeaders, errorHeaders }) {
            if ([...actionHeaders].length > 0) {
              return actionHeaders;
            } else {
              return loaderHeaders;
            }
          }

          export async function action({ request }) {
            let formData = await request.formData();
            return data({
              key: formData.get('key'),
            }, { headers: { 'Content-Length': '0' }});
          }

          export function loader({ request }) {
            return data({
              message: "DATA",
            }, { headers: { 'Content-Length': '0' }});
          }

          export default function DataWithResponse() {
            let data = useLoaderData();
            let actionData = useActionData();
            return (
              <>
                <h1 id="heading">Data</h1>
                <p id="message">{data.message}</p>
                <p id="date">{data.date.toISOString()}</p>
                {actionData ? <p id="action-data">{actionData.key}</p> : null}
              </>
            )
          }
        `,
      },
    });

    let res = await fixture.requestSingleFetchData("/data-with-response.data");
    expect(res.headers.get("Content-Length")).toEqual(null);
    expect(res.data).toStrictEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/data-with-response": {
        data: {
          message: "DATA",
        },
      },
    });

    let postBody = new URLSearchParams();
    postBody.set("key", "value");
    res = await fixture.requestSingleFetchData("/data-with-response.data", {
      method: "post",
      body: postBody,
    });
    expect(res.headers.get("Content-Length")).toEqual(null);
    expect(res.data).toEqual({
      data: {
        key: "value",
      },
    });
  });

  test("Action requests do not use _routes and do not call loaders on the server", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/page.tsx": js`
          import { Form, useActionData, useLoaderData } from "react-router";
          let count = 0;
          export function loader({ request }) {
            return { count: ++count };
          }
          export function action({ request }) {
            return { message: "ACTION" };
          }
          export default function Component() {
            let data = useLoaderData();
            let actionData = useActionData();
            return (
              <>
                <p id="data">{"Count:" + data.count}</p>
                <Form method="post">
                  <button type="submit">Submit</button>
                  {actionData ? <p id="action">{actionData.message}</p> : null}
                </Form>
              </>
            )
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let urls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes(".data")) {
        urls.push(req.method() + " " + req.url());
      }
    });

    await app.goto("/page");
    expect(await app.getHtml("#data")).toContain("Count:1");

    await app.clickSubmitButton("/page");
    await page.waitForSelector("#action");
    expect(await app.getHtml("#data")).toContain("Count:2");

    // HTTP Requests contained routes params
    expect(urls).toEqual([
      expect.stringMatching(/POST .*\/page.data$/),
      expect.stringMatching(/GET .*\/page.data$/),
    ]);
  });

  test("does not try to encode a turbo-stream body into 204 responses", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/_index.tsx": js`
          import { data, Form, useActionData, useNavigation } from "react-router";

          export async function action({ request }) {
            await new Promise(r => setTimeout(r, 500));
            return data(null, { status: 204 });
          };

          export default function Index() {
            const navigation = useNavigation();
            const actionData = useActionData();
            return (
              <Form method="post">
                {navigation.state === "idle" ? <p data-idle>idle</p> : <p data-active>active</p>}
                <button data-submit type="submit">{actionData ?? 'no content!'}</button>
              </Form>
            );
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);

    let app = new PlaywrightFixture(appFixture, page);

    let requests: [string, number, string][] = [];
    page.on("request", async (req) => {
      if (req.url().includes(".data")) {
        let url = new URL(req.url());
        requests.push([
          req.method(),
          (await req.response())!.status(),
          url.pathname + url.search,
        ]);
      }
    });

    // Document requests
    let documentRes = await fixture.requestDocument("/?index", {
      method: "post",
    });
    expect(documentRes.status).toBe(204);
    expect(await documentRes.text()).toBe("");

    // Data requests
    await app.goto("/");
    (await page.$("[data-submit]"))?.click();
    await page.waitForSelector("[data-active]");
    await page.waitForSelector("[data-idle]");

    expect(await page.innerText("[data-submit]")).toEqual("no content!");
    expect(requests).toEqual([
      ["POST", 204, "/_root.data?index"],
      ["GET", 200, "/_root.data"],
    ]);
  });

  test("does not try to encode a turbo-stream body into 304 responses", async () => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/_index.tsx": js`
          import { useLoaderData } from "react-router";

          const eTag = "1234";
          export function loader({ request }) {
            if (request.headers.get("If-None-Match") === eTag) {
              throw new Response(null, { status: 304 });
            }
            return { message: "Hello from the loader!" };
          };
          export default function Index() {
            const { message } = useLoaderData<typeof loader>();
            return <h1>{message}</h1>
          }
        `,
      },
    });

    // Document requests
    let documentRes = await fixture.requestDocument("/");
    let html = await documentRes.text();
    expect(html).toContain("<body>");
    expect(html).toContain("<h1>Hello from the loader!</h1>");
    documentRes = await fixture.requestDocument("/", {
      headers: {
        "If-None-Match": "1234",
      },
    });
    expect(documentRes.status).toBe(304);
    expect(await documentRes.text()).toBe("");

    // Data requests
    let dataRes = await fixture.requestSingleFetchData("/_root.data");
    expect(dataRes.data).toEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/_index": {
        data: {
          message: "Hello from the loader!",
        },
      },
    });
    dataRes = await fixture.requestSingleFetchData("/_root.data", {
      headers: {
        "If-None-Match": "1234",
      },
    });
    expect(dataRes.status).toBe(304);
    expect(dataRes.data).toBeNull();
  });

  test.describe("revalidations/_routes param", () => {
    test("does not make a server call if no loaders need to run", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "app/root.tsx": js`
            import { Link, Links, Meta, Outlet, Scripts } from "react-router";
            export default function Root() {
              return (
                <html lang="en">
                  <head>
                    <Meta />
                    <Links />
                  </head>
                  <body>
                    <Link to="/">Home</Link><br/>
                    <Link to="/a/b">/a/b</Link><br/>
                    <Outlet />
                    <Scripts />
                  </body>
                </html>
              );
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet } from "react-router";
            export default function Root() {
              return <Outlet />;
            }
          `,
          "app/routes/a.b.tsx": js`
            export default function Root() {
              return <h1>B</h1>;
            }
          `,
        },
      });

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      await app.clickLink("/a/b");
      await page.waitForSelector("h1");
      expect(await app.getHtml("h1")).toBe("<h1>B</h1>");
      expect(urls.length).toBe(0);
    });

    test("calls reused parent routes by default", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";
            export default function Component() {
              return <Link to="/parent/a">Go to /parent/a</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return (
                <>
                  <p id="parent">Parent Count: {useLoaderData().count}</p>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="a">A Count: {useLoaderData().count}</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="b">B Count: {useLoaderData().count}</p>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/");

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 1");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 2");
      expect(await app.getHtml("#b")).toContain("B Count: 1");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/parent/b.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 3");
      expect(await app.getHtml("#a")).toContain("A Count: 2");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
    });

    test("allows reused routes to opt out via shouldRevalidate", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";
            export default function Component() {
              return <Link to="/parent/a">Go to /parent/a</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export function shouldRevalidate() {
              return false;
            }
            export default function Component() {
              return (
                <>
                  <p id="parent">Parent Count: {useLoaderData().count}</p>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="a">A Count: {useLoaderData().count}</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="b">B Count: {useLoaderData().count}</p>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/");

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 1");
      expect(urls.length).toBe(1);
      // Not a revalidation on the first navigation so no params
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#b")).toContain("B Count: 1");
      expect(urls.length).toBe(1);
      // Don't reload the parent route
      expect(
        urls[0].endsWith("/parent/b.data?_routes=root%2Croutes%2Fparent.b"),
      ).toBe(true);
      urls = [];

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 2");
      expect(urls.length).toBe(1);
      // Don't reload the parent route
      expect(
        urls[0].endsWith("/parent/a.data?_routes=root%2Croutes%2Fparent.a"),
      ).toBe(true);
    });

    test("allows reused routes to opt out via shouldRevalidate (w/clientLoader)", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";
            export default function Component() {
              return <Link to="/parent/a">Go to /parent/a</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export function shouldRevalidate() {
              return false;
            }
            export function clientLoader({ serverLoader }) {
              return serverLoader()
            }
            export default function Component() {
              return (
                <>
                  <p id="parent">Parent Count: {useLoaderData().count}</p>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="a">A Count: {useLoaderData().count}</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="b">B Count: {useLoaderData().count}</p>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/");

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 1");
      expect(urls.length).toBe(2);
      // Client loader triggers 2 requests on the first navigation
      expect(urls[0].endsWith("/parent/a.data?_routes=routes%2Fparent")).toBe(
        true,
      );
      expect(
        urls[1].endsWith("/parent/a.data?_routes=root%2Croutes%2Fparent.a"),
      ).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#b")).toContain("B Count: 1");
      expect(urls.length).toBe(1);
      // Don't reload the parent route
      expect(
        urls[0].endsWith("/parent/b.data?_routes=root%2Croutes%2Fparent.b"),
      ).toBe(true);
      urls = [];

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 2");
      expect(urls.length).toBe(1);
      // Don't reload the parent route
      expect(
        urls[0].endsWith("/parent/a.data?_routes=root%2Croutes%2Fparent.a"),
      ).toBe(true);
    });

    test("allows reused routes to opt out via shouldRevalidate (w/only clientLoader)", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";
            export default function Component() {
              return <Link to="/parent/a">Go to /parent/a</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useLoaderData } from "react-router";
            let count = 0;
            export function clientLoader({ request }) {
              return { count: ++count };
            }
            export function shouldRevalidate() {
              return false;
            }
            export default function Component() {
              return (
                <>
                  <p id="parent">Parent Count: {useLoaderData().count}</p>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="a">A Count: {useLoaderData().count}</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="b">B Count: {useLoaderData().count}</p>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/");

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 1");
      expect(urls.length).toBe(1);
      // Client loader triggers 2 requests on the first navigation
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#b")).toContain("B Count: 1");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/parent/b.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 2");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
    });

    test("provides the proper defaultShouldRevalidate value", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router';
            export default function Component() {
              return <Link to="/parent/a">Go to /parent/a</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useLoaderData } from 'react-router';
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export function shouldRevalidate({ defaultShouldRevalidate }) {
              return defaultShouldRevalidate;
            }
            export default function Component() {
              return (
                <>
                  <p id="parent">Parent Count: {useLoaderData().count}</p>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            import { useLoaderData } from 'react-router';
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="a">A Count: {useLoaderData().count}</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            import { useLoaderData } from 'react-router';
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="b">B Count: {useLoaderData().count}</p>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/");

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 1");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 2");
      expect(await app.getHtml("#b")).toContain("B Count: 1");
      expect(urls.length).toBe(1);
      // Reload the parent route
      expect(urls[0].endsWith("/parent/b.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 3");
      expect(await app.getHtml("#a")).toContain("A Count: 2");
      expect(urls.length).toBe(1);
      // Reload the parent route
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
    });

    test("does not add a _routes param for routes without loaders", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";
            export default function Component() {
              return <Link to="/parent/a">Go to /parent/a</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export function shouldRevalidate() {
              return false;
            }
            export default function Component() {
              return (
                <>
                  <p id="parent">Parent Count: {useLoaderData().count}</p>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            import { useLoaderData } from "react-router";
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <p id="a">A Count: {useLoaderData().count}</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            export default function Component() {
              return <p id="b">B</p>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/");

      await app.clickLink("/parent/a");
      await page.waitForSelector("#a");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#a")).toContain("A Count: 1");
      expect(urls.length).toBe(1);
      // Not a revalidation on the first navigation so no params
      expect(urls[0].endsWith("/parent/a.data")).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#parent")).toContain("Parent Count: 1");
      expect(await app.getHtml("#b")).toContain("B");
      expect(urls.length).toBe(1);
      // Don't reload the parent route
      expect(urls[0].endsWith("/parent/b.data?_routes=root")).toBe(true);
      urls = [];
    });
  });

  test.describe("client loaders", () => {
    test("when no routes have client loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("#c-data");
      expect(await app.getHtml("#a-data")).toContain("A server loader");
      expect(await app.getHtml("#b-data")).toContain("B server loader");
      expect(await app.getHtml("#c-data")).toContain("C server loader");

      // No clientLoaders so we can make a single parameter-less fetch
      expect(urls).toEqual([expect.stringMatching(/\/a\/b\/c\.data$/)]);
    });

    test("when one route has a client loader", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (C client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("#c-data");
      expect(await app.getHtml("#a-data")).toContain("A server loader");
      expect(await app.getHtml("#b-data")).toContain("B server loader");
      expect(await app.getHtml("#c-data")).toContain(
        "C server loader (C client loader)",
      );

      // root/A/B can be loaded together, C needs it's own call due to it's clientLoader
      expect(urls.sort()).toEqual([
        expect.stringMatching(
          /\/a\/b\/c\.data\?_routes=root%2Croutes%2Fa%2Croutes%2Fa\.b$/,
        ),
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=routes%2Fa\.b\.c$/),
      ]);
    });

    test("when multiple routes have client loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (B client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (C client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("#c-data");
      expect(await app.getHtml("#a-data")).toContain("A server loader");
      expect(await app.getHtml("#b-data")).toContain(
        "B server loader (B client loader)",
      );
      expect(await app.getHtml("#c-data")).toContain(
        "C server loader (C client loader)",
      );

      // B/C have client loaders so they get individual calls, root/A go together
      expect(urls.sort()).toEqual([
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=root%2Croutes%2Fa$/),
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=routes%2Fa\.b$/),
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=routes%2Fa\.b\.c$/),
      ]);
    });

    test("when all routes have client loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (A client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (B client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (C client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("#c-data");
      expect(await app.getHtml("#a-data")).toContain(
        "A server loader (A client loader)",
      );
      expect(await app.getHtml("#b-data")).toContain(
        "B server loader (B client loader)",
      );
      expect(await app.getHtml("#c-data")).toContain(
        "C server loader (C client loader)",
      );

      // root/A/B/C all have client loaders so they get individual calls
      expect(urls.sort()).toEqual([
        expect.stringMatching(/\/a\/b\/c.data\?_routes=root$/),
        expect.stringMatching(/\/a\/b\/c.data\?_routes=routes%2Fa$/),
        expect.stringMatching(/\/a\/b\/c.data\?_routes=routes%2Fa.b$/),
        expect.stringMatching(/\/a\/b\/c.data\?_routes=routes%2Fa.b.c$/),
      ]);
    });
  });

  test.describe("fetchers", () => {
    test("Fetcher loaders call singular routes", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Outlet } from "react-router";
            export default function Comp() {
              return <Outlet />;
            }
          `,
          "app/routes/a.b.tsx": js`
            import { useFetcher } from "react-router";
            export function loader() {
              return { message: 'LOADER' };
            }
            export default function Comp() {
              let fetcher = useFetcher();
              return (
                <>
                  <button id="load" onClick={() => fetcher.load('/a/b')}>Load</button>
                  {fetcher.data ? <p id="data">{fetcher.data.message}</p> : null}
                </>
              );
            }
          `,
        },
      });

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a/b");
      await app.clickElement("#load");
      await page.waitForSelector("#data");
      expect(await app.getHtml("#data")).toContain("LOADER");

      // No clientLoaders so we can make a single parameter-less fetch
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/a/b.data?_routes=routes%2Fa.b")).toBe(true);
    });

    test("Fetcher actions call singular routes", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Outlet } from "react-router";
            export default function Comp() {
              return <Outlet />;
            }
          `,
          "app/routes/a.b.tsx": js`
            import { useFetcher } from "react-router";
            export function action() {
              return { message: 'ACTION' };
            }
            export default function Comp() {
              let fetcher = useFetcher();
              return (
                <>
                  <button id="submit" onClick={() => {
                    fetcher.submit({}, {
                      method: 'post',
                      action: '/a/b'
                    });
                  }}>
                    Load
                  </button>
                  {fetcher.data ? <p id="data">{fetcher.data.message}</p> : null}
                </>
              );
            }
          `,
        },
      });

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a/b");
      await app.clickElement("#submit");
      await page.waitForSelector("#data");
      expect(await app.getHtml("#data")).toContain("ACTION");

      // No clientLoaders so we can make a single parameter-less fetch
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/a/b.data")).toBe(true);
    });

    test("Fetcher loads do not revalidate on GET navigations by default", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useFetcher } from "react-router";
            export default function Component() {
              let fetcher = useFetcher();
              return (
                <>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <button id="load" onClick={() => fetcher.load('/fetch')}>
                    Load Fetcher
                  </button>
                  {fetcher.data ? <p id="fetch">Fetch Count: {fetcher.data.count}</p> : null}
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            export default function Component() {
              return <p id="a">A</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            export default function Component() {
              return <p id="b">B</p>;
            }
          `,
          "app/routes/fetch.tsx": js`
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export default function Component() {
              return <h1>Fetch</h1>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/parent/a");
      await app.clickElement("#load");
      await page.waitForSelector("#fetch");
      expect(await app.getHtml("#fetch")).toContain("Fetch Count: 1");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/fetch.data?_routes=routes%2Ffetch")).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#fetch")).toContain("Fetch Count: 1");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/parent/b.data")).toBe(true);
    });

    test("Fetcher loads can opt into revalidation on GET navigations", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/parent.tsx": js`
            import { Link, Outlet, useFetcher } from "react-router";
            export default function Component() {
              let fetcher = useFetcher();
              return (
                <>
                  <Link to="/parent/a">Go to /parent/a</Link>
                  <Link to="/parent/b">Go to /parent/b</Link>
                  <button id="load" onClick={() => fetcher.load('/fetch')}>
                    Load Fetcher
                  </button>
                  {fetcher.data ? <p id="fetch">Fetch Count: {fetcher.data.count}</p> : null}
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.a.tsx": js`
            export default function Component() {
              return <p id="a">A</p>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            export default function Component() {
              return <p id="b">B</p>;
            }
          `,
          "app/routes/fetch.tsx": js`
            let count = 0;
            export function loader({ request }) {
              return { count: ++count };
            }
            export function shouldRevalidate() {
              return true;
            }
            export default function Component() {
              return <h1>Fetch</h1>;
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      await app.goto("/parent/a");
      await app.clickElement("#load");
      await page.waitForSelector("#fetch");
      expect(await app.getHtml("#fetch")).toContain("Fetch Count: 1");
      expect(urls.length).toBe(1);
      expect(urls[0].endsWith("/fetch.data?_routes=routes%2Ffetch")).toBe(true);
      urls = [];

      await app.clickLink("/parent/b");
      await page.waitForSelector("#b");
      expect(await app.getHtml("#fetch")).toContain("Fetch Count: 2");
      expect(urls.length).toBe(2);
      expect(urls[0].endsWith("/fetch.data?_routes=routes%2Ffetch")).toBe(true);
      expect(urls[1].endsWith("/parent/b.data")).toBe(true);
    });

    test("Aborted fetcher loads don't cause console errors", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Form, redirect, useFetcher } from "react-router";

            export function action() {
              return redirect("/other");
            }

            export default function Page() {
              const fetcher = useFetcher();
              const isPending = fetcher.state !== "idle";

              return (
                <>
                  <button id="fetch" onClick={() => fetcher.load("/fetch")}>
                    {isPending ? "Loading..." : "First load data"}
                  </button>
                  <Form method="POST">
                    <button type="submit">Then submit before load ends</button>
                  </Form>
                </>
              );
            }
          `,
          "app/routes/other.tsx": js`
            export default function Component() {
              return <p id="other">Other</p>;
            }
          `,
          "app/routes/fetch.tsx": js`
            export async function loader() {
              await new Promise((r) => setTimeout(r, 10000));
              return 'nope';
            }
          `,
        },
      });
      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      // Capture console logs and uncaught errors
      let msgs: string[] = [];
      page.on("console", (msg) => msgs.push(msg.text()));
      page.on("pageerror", (error) => msgs.push(error.message));

      await app.goto("/", true);
      app.clickElement("#fetch");
      await app.clickSubmitButton("/?index");
      await page.waitForSelector("#other");
      expect(msgs).toEqual([]);
    });
  });

  test.describe("prefetching", () => {
    test("when no routes have client loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import {  Link } from "react-router";

            export default function Index() {
              return (
                <nav>
                  <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                </nav>
              );
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      // No clientLoaders so we can make a single parameter-less fetch
      await page.waitForSelector(
        "link[rel='prefetch'][as='fetch'][href='/a/b/c.data']",
        { state: "attached" },
      );
      expect(await app.page.locator("link[as='fetch']").count()).toEqual(1);
    });

    test("when one route has a client loader", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import {  Link } from "react-router";

            export default function Index() {
              return (
                <nav>
                  <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                </nav>
              );
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (C client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // root/A/B can be prefetched, C doesn't get prefetched due to its `clientLoader`
      await page.waitForSelector(
        "link[rel='prefetch'][as='fetch'][href='/a/b/c.data?_routes=root%2Croutes%2Fa%2Croutes%2Fa.b']",
        { state: "attached" },
      );
      expect(await app.page.locator("link[as='fetch']").count()).toEqual(1);
    });

    test("when multiple routes have client loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import {  Link } from "react-router";

            export default function Index() {
              return (
                <nav>
                  <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                </nav>
              );
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (B client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (C client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // root/A can get prefetched, B/C can't due to `clientLoader`
      await page.waitForSelector(
        "link[rel='prefetch'][as='fetch'][href='/a/b/c.data?_routes=root%2Croutes%2Fa']",
        { state: "attached" },
      );
      expect(await app.page.locator("link[as='fetch']").count()).toEqual(1);
    });

    test("when all routes have client loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/root.tsx": js`
            import { Links, Meta, Outlet, Scripts } from "react-router";
            export function loader() {
              return {
                message: "ROOT",
              };
            }
            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (root client loader)" };
            }
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
            import {  Link } from "react-router";

            export default function Index() {
              return (
                <nav>
                  <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                </nav>
              );
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "A server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (A client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';

            export function loader() {
              return { message: "B server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (B client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';

            export function  loader() {
              return { message: "C server loader" };
            }

            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (C client loader)" };
            }

            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // No prefetching due to clientLoaders
      expect(await app.page.locator("link[as='fetch']").count()).toEqual(0);
    });

    test("when a reused route opts out of revalidation", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Link, Outlet, useLoaderData } from 'react-router';
            export function loader() {
              return { message: "A server loader" };
            }
            export function shouldRevalidate() {
              return false;
            }
            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <nav>
                    <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                  </nav>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';
            export function loader() {
              return { message: "B server loader" };
            }
            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';
            export function  loader() {
              return { message: "C server loader" };
            }
            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a", true);

      // A opted out of revalidation
      await page.waitForSelector(
        "link[rel='prefetch'][as='fetch'][href='/a/b/c.data?_routes=root%2Croutes%2Fa.b%2Croutes%2Fa.b.c']",
        { state: "attached" },
      );
      expect(await app.page.locator("link[as='fetch']").count()).toEqual(1);
    });

    test("when a reused route opts out of revalidation and another route has a clientLoader", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          ...files,
          "app/routes/a.tsx": js`
            import { Link, Outlet, useLoaderData } from 'react-router';
            export function loader() {
              return { message: "A server loader" };
            }
            export function shouldRevalidate() {
              return false;
            }
            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>A</h1>
                  <p id="a-data">{data.message}</p>
                  <nav>
                    <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                  </nav>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet, useLoaderData } from 'react-router';
            export function loader() {
              return { message: "B server loader" };
            }
            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>B</h1>
                  <p id="b-data">{data.message}</p>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { useLoaderData } from 'react-router';
            export function  loader() {
              return { message: "C server loader" };
            }
            export async function clientLoader({ serverLoader }) {
              let data = await serverLoader();
              return { message: data.message + " (C client loader)" };
            }
            export default function Comp() {
              let data = useLoaderData();
              return (
                <>
                  <h1>C</h1>
                  <p id="c-data">{data.message}</p>
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a", true);

      // A opted out of revalidation
      await page.waitForSelector(
        "link[rel='prefetch'][as='fetch'][href='/a/b/c.data?_routes=root%2Croutes%2Fa.b']",
        { state: "attached" },
      );
      expect(await app.page.locator("link[as='fetch']").count()).toEqual(1);
    });
  });

  test("supports nonce on streaming script tags", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "react-router";

          export function loader() {
            return {
              message: "ROOT",
            };
          }

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <Outlet />
                  <Scripts nonce="the-nonce" />
                </body>
              </html>
            );
          }
        `,
        "app/entry.server.tsx": js`
          import { PassThrough } from "node:stream";

          import type { EntryContext } from "react-router";
          import { createReadableStreamFromReadable } from "@react-router/node";
          import { ServerRouter } from "react-router";
          import { renderToPipeableStream } from "react-dom/server";

          export default function handleRequest(
            request: Request,
            responseStatusCode: number,
            responseHeaders: Headers,
            remixContext: EntryContext
          ) {
            return new Promise((resolve, reject) => {
              const { pipe } = renderToPipeableStream(
                <ServerRouter context={remixContext} url={request.url} nonce="the-nonce" />,
                {
                  onShellReady() {
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);
                    responseHeaders.set("Content-Type", "text/html");
                    resolve(
                      new Response(stream, {
                        headers: responseHeaders,
                        status: responseStatusCode,
                      })
                    );
                    pipe(body);
                  },
                  onShellError(error: unknown) {
                    reject(error);
                  },
                  onError(error: unknown) {
                    responseStatusCode = 500;
                  },
                }
              );
            });
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/data", true);
    let scripts = await page.$$("script");
    expect(scripts.length).toBe(6);
    let remixScriptsCount = 0;
    for (let script of scripts) {
      let content = await script.innerHTML();
      if (content.includes("window.__reactRouter")) {
        remixScriptsCount++;
        expect(await script.getAttribute("nonce")).toEqual("the-nonce");
      }
    }
    expect(remixScriptsCount).toBe(4);
  });

  test("supports loaders that return undefined", async ({ page }) => {
    let fixture = await createFixture(
      {
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";

            export default function () {
              return <Link to="/loader">Go to /loader</Link>;
            }
          `,
          "app/routes/loader.tsx": js`
            import { useLoaderData } from "react-router";

            export async function loader() {}

            export default function () {
              let data = useLoaderData();
              return <h1>{data === undefined? 'It worked!' : 'Error'}</h1>;
            }
          `,
        },
      },
      ServerMode.Development,
    );

    // Document requests
    let res = await fixture.requestDocument("/loader");
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch("It worked!");

    // SPA navigations
    let appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/loader");
    await page.waitForSelector("h1");
    expect(await app.getHtml("h1")).toMatch("It worked!");
  });

  test("supports actions that return undefined", async ({ page }) => {
    let fixture = await createFixture(
      {
        files: {
          ...files,
          "app/routes/_index.tsx": js`
            import { Form } from "react-router";

            export default function () {
              return (
                <Form method="post" action="/action">
                  <input name="test" />
                  <button type="submit">Submit</button>
                </Form>
              );
            }
          `,
          "app/routes/action.tsx": js`
            import { useActionData } from "react-router";

            export async function action() {}

            export default function () {
              let data = useActionData();
              return <h1>{data === undefined? 'It worked!' : 'Error'}</h1>;
            }
          `,
        },
      },
      ServerMode.Development,
    );

    // Document requests
    let res = await fixture.requestDocument("/action");
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch("It worked!");

    // SPA navigations
    let appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/action");
    await page.waitForSelector("h1");
    expect(await app.getHtml("h1")).toMatch("It worked!");
  });
});
