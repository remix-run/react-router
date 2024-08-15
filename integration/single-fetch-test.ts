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
            <Link to="/">Home</Link><br/>
            <Link to="/data">Data</Link><br/>
            <Link to="/a/b/c">/a/b/c</Link><br/>
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

    export function loader({ request }) {
      if (new URL(request.url).searchParams.has("error")) {
        throw new Error("Loader Error");
      }
      return {
        message: "DATA",
        date: new Date("${ISO_DATE}"),
      };
    }

    export default function Index() {
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

  "app/routes/data-with-response.tsx": js`
    import { useActionData, useLoaderData, unstable_data as data } from "react-router";

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

    export function loader({ request }) {
      if (new URL(request.url).searchParams.has("error")) {
        throw new Error("Loader Error");
      }
      return data({
        message: "DATA",
        date: new Date("${ISO_DATE}"),
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
    let fixture = await createFixture(
      {
        files,
      },
      ServerMode.Development
    );
    let res = await fixture.requestSingleFetchData("/_root.data");
    expect(res.data).toEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/_index": {
        data: null,
      },
    });

    res = await fixture.requestSingleFetchData("/data.data");
    expect(res.data).toEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/data": {
        data: {
          message: "DATA",
          date: new Date(ISO_DATE),
        },
      },
    });
  });

  test("loads proper errors on single fetch loader requests", async () => {
    console.error = () => {};

    let fixture = await createFixture(
      {
        files,
      },
      ServerMode.Development
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
    let fixture = await createFixture(
      {
        files,
      },
      ServerMode.Development
    );
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

  test("loads proper data (via unstable_data) on single fetch loader requests", async () => {
    let fixture = await createFixture({
      files,
    });
    let res = await fixture.requestSingleFetchData("/data-with-response.data");
    expect(res.status).toEqual(206);
    expect(res.headers.get("X-Loader")).toEqual("yes");
    expect(res.data).toEqual({
      root: {
        data: {
          message: "ROOT",
        },
      },
      "routes/data-with-response": {
        data: {
          message: "DATA",
          date: new Date(ISO_DATE),
        },
      },
    });
  });

  test("loads proper data (via unstable_data) on single fetch action requests", async () => {
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

  test("does not revalidate on 4xx/5xx action responses (via unstable_data)", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "app/routes/action.tsx": js`
          import { Form, Link, useActionData, useLoaderData, useNavigation, unstable_data } from 'react-router';

          export async function action({ request }) {
            let fd = await request.formData();
            if (fd.get('throw') === "5xx") {
              throw unstable_data("Thrown 500", { status: 500 });
            }
            if (fd.get('throw') === "4xx") {
              throw unstable_data("Thrown 400", { status: 400 });
            }
            if (fd.get('return') === "5xx") {
              return unstable_data("Returned 500", { status: 500 });
            }
            if (fd.get('return') === "4xx") {
              return unstable_data("Returned 400", { status: 400 });
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
    let fixture = await createFixture(
      {
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
      },
      ServerMode.Development
    );

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

    let appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes returned action redirects via Response", async ({ page }) => {
    let fixture = await createFixture(
      {
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
      },
      ServerMode.Development
    );

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

    let appFixture = await createAppFixture(fixture, ServerMode.Development);
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

  test("processes redirects when a basename is present", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...files,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { vitePlugin as remix } from "@react-router/dev";
          export default defineConfig({
            plugins: [
              remix({
                basename: '/base',
              }),
            ],
          });
        `,
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

    let { status, data } = await fixture.requestSingleFetchData(
      "/base/data.data"
    );
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
      "RESOURCE 2024-03-12T12:00:00.000Z"
    );
  });

  test.describe("client loaders", () => {
    test("when no routes have client loaders", async ({ page }) => {
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
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
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("#c-data");
      expect(await app.getHtml("#a-data")).toContain("A server loader");
      expect(await app.getHtml("#b-data")).toContain("B server loader");
      expect(await app.getHtml("#c-data")).toContain(
        "C server loader (C client loader)"
      );

      // A/B can be loaded together, C needs it's own call due to it's clientLoader
      expect(urls.sort()).toEqual([
        expect.stringMatching(
          /\/a\/b\/c\.data\?_routes=routes%2Fa%2Croutes%2Fa\.b$/
        ),
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=routes%2Fa\.b\.c$/),
      ]);
    });

    test("when multiple routes have client loaders", async ({ page }) => {
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("#c-data");
      expect(await app.getHtml("#a-data")).toContain("A server loader");
      expect(await app.getHtml("#b-data")).toContain(
        "B server loader (B client loader)"
      );
      expect(await app.getHtml("#c-data")).toContain(
        "C server loader (C client loader)"
      );

      // B/C have client loaders so they get individual calls, which leaves A
      // getting it's own "individual" since it's the last route standing
      expect(urls.sort()).toEqual([
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=routes%2Fa$/),
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=routes%2Fa\.b$/),
        expect.stringMatching(/\/a\/b\/c\.data\?_routes=routes%2Fa\.b\.c$/),
      ]);
    });

    test("when all routes have client loaders", async ({ page }) => {
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let urls: string[] = [];
      page.on("request", (req) => {
        if (req.method() === "GET" && req.url().includes(".data")) {
          urls.push(req.url());
        }
      });

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("#c-data");
      expect(await app.getHtml("#a-data")).toContain(
        "A server loader (A client loader)"
      );
      expect(await app.getHtml("#b-data")).toContain(
        "B server loader (B client loader)"
      );
      expect(await app.getHtml("#c-data")).toContain(
        "C server loader (C client loader)"
      );

      // A/B/C all have client loaders so they get individual calls
      expect(urls.sort()).toEqual([
        expect.stringMatching(/\/a\/b\/c.data\?_routes=routes%2Fa$/),
        expect.stringMatching(/\/a\/b\/c.data\?_routes=routes%2Fa.b$/),
        expect.stringMatching(/\/a\/b\/c.data\?_routes=routes%2Fa.b.c$/),
      ]);
    });
  });

  test.describe("prefetching", () => {
    test("when no routes have client loaders", async ({ page }) => {
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      // No clientLoaders so we can make a single parameter-less fetch
      await page.waitForSelector(
        "nav link[rel='prefetch'][as='fetch'][href='/a/b/c.data']",
        { state: "attached" }
      );
      expect(await app.page.locator("nav link[as='fetch']").count()).toEqual(1);
    });

    test("when one route has a client loader", async ({ page }) => {
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // A/B can be prefetched, C doesn't get prefetched due to its `clientLoader`
      await page.waitForSelector(
        "nav link[rel='prefetch'][as='fetch'][href='/a/b/c.data?_routes=routes%2Fa%2Croutes%2Fa.b']",
        { state: "attached" }
      );
      expect(await app.page.locator("nav link[as='fetch']").count()).toEqual(1);
    });

    test("when multiple routes have client loaders", async ({ page }) => {
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // Only A can get prefetched, B/C can't due to `clientLoader`
      await page.waitForSelector(
        "nav link[rel='prefetch'][as='fetch'][href='/a/b/c.data?_routes=routes%2Fa']",
        { state: "attached" }
      );
      expect(await app.page.locator("nav link[as='fetch']").count()).toEqual(1);
    });

    test("when all routes have client loaders", async ({ page }) => {
      let fixture = await createFixture(
        {
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
        },
        ServerMode.Development
      );

      let appFixture = await createAppFixture(fixture, ServerMode.Development);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // No prefetching due to clientLoaders
      expect(await app.page.locator("nav link[as='fetch']").count()).toEqual(0);
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
      if (content.includes("window.__remix")) {
        remixScriptsCount++;
        expect(await script.getAttribute("nonce")).toEqual("the-nonce");
      }
    }
    expect(remixScriptsCount).toBe(4);
  });
});
