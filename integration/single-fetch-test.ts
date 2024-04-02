import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { ServerMode } from "../build/node_modules/@remix-run/server-runtime/dist/mode.js";

const ISO_DATE = "2024-03-12T12:00:00.000Z";

const files = {
  "app/root.tsx": js`
    import { Form, Link, Links, Meta, Outlet, Scripts } from "@remix-run/react";

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
    import { useActionData, useLoaderData } from "@remix-run/react";

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
        singleFetch: true,
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
        singleFetch: true,
        files,
      },
      ServerMode.Development
    );

    console.error = () => {};

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
        singleFetch: true,
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

  test("loads proper data on document request", async ({ page }) => {
    let fixture = await createFixture({
      singleFetch: true,
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
      singleFetch: true,
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
      singleFetch: true,
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
      singleFetch: true,
      files: {
        ...files,
        "app/routes/no-revalidate.tsx": js`
          import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

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
      singleFetch: true,
      files: {
        ...files,
        "app/routes/action.tsx": js`
          import { Form, Link, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

          export async function action({ request, response }) {
            let fd = await request.formData();
            if (fd.get('throw') === "5xx") {
              response.status = 500;
              throw new Error("Thrown 500");
            }
            if (fd.get('throw') === "4xx") {
              response.status = 400;
              throw new Error("Thrown 400");
            }
            if (fd.get('return') === "5xx") {
              response.status = 500;
              return "Returned 500";
            }
            if (fd.get('return') === "4xx") {
              response.status = 400;
              return "Returned 400";
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
      singleFetch: true,
      files: {
        ...files,
        "app/routes/headers.tsx": js`
          export function action({ request, response }) {
            if (new URL(request.url).searchParams.has("error")) {
              response.headers.set("x-action-error", "true");
              throw response;
            }
            response.headers.set("x-action", "true");
            return null;
          }

          export function loader({ request, response }) {
            if (new URL(request.url).searchParams.has("error")) {
              response.headers.set("x-loader-error", "true");
              throw response;
            }
            response.headers.set("x-loader", "true");
            return null;
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

  test("merges headers from nested routes", async () => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/a.tsx": js`
          export function loader({ request, response }) {
            response.headers.set('x-one', 'a set');
            response.headers.append('x-one', 'a append');
            response.headers.set('x-two', 'a set');
            response.headers.append('x-three', 'a append');
            response.headers.set('x-four', 'a set');
            return null;
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.tsx": js`
          export function loader({ request, response }) {
            response.headers.set('x-one', 'b set');
            response.headers.append('x-one', 'b append');
            response.headers.set('x-two', 'b set');
            response.headers.append('x-three', 'b append');
            response.headers.delete('x-four');
            return null;
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.c.tsx": js`
          export function action({ request, response }) {
            response.headers.set('x-one', 'c action set');
            response.headers.append('x-one', 'c action append');
            response.headers.set('x-two', 'c action set');
            response.headers.append('x-three', 'c action append');
            response.headers.set('x-four', 'c action set');
            return null;
          }

          export function loader({ request, response }) {
            response.headers.set('x-one', 'c set');
            response.headers.append('x-one', 'c append');
            response.headers.set('x-two', 'c set');
            response.headers.append('x-three', 'c append');
            return null;
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
    expect(res.headers.get("x-one")).toEqual("a set, a append");
    expect(res.headers.get("x-two")).toEqual("a set");
    expect(res.headers.get("x-three")).toEqual("a append");
    expect(res.headers.get("x-four")).toEqual("a set");

    res = await fixture.requestSingleFetchData("/a.data");
    expect(res.headers.get("x-one")).toEqual("a set, a append");
    expect(res.headers.get("x-two")).toEqual("a set");
    expect(res.headers.get("x-three")).toEqual("a append");
    expect(res.headers.get("x-four")).toEqual("a set");

    res = await fixture.requestDocument("/a/b");
    expect(res.headers.get("x-one")).toEqual("b set, b append");
    expect(res.headers.get("x-two")).toEqual("b set");
    expect(res.headers.get("x-three")).toEqual("a append, b append");
    expect(res.headers.get("x-four")).toEqual(null);

    res = await fixture.requestSingleFetchData("/a/b.data");
    expect(res.headers.get("x-one")).toEqual("b set, b append");
    expect(res.headers.get("x-two")).toEqual("b set");
    expect(res.headers.get("x-three")).toEqual("a append, b append");
    expect(res.headers.get("x-four")).toEqual(null);

    res = await fixture.requestDocument("/a/b/c");
    expect(res.headers.get("x-one")).toEqual("c set, c append");
    expect(res.headers.get("x-two")).toEqual("c set");
    expect(res.headers.get("x-three")).toEqual("a append, b append, c append");
    expect(res.headers.get("x-four")).toEqual(null);

    res = await fixture.requestSingleFetchData("/a/b/c.data");
    expect(res.headers.get("x-one")).toEqual("c set, c append");
    expect(res.headers.get("x-two")).toEqual("c set");
    expect(res.headers.get("x-three")).toEqual("a append, b append, c append");
    expect(res.headers.get("x-four")).toEqual(null);

    // Fine-grained revalidation
    res = await fixture.requestDocument("/a/b/c.data?_routes=routes%2Fa");
    expect(res.headers.get("x-one")).toEqual("a set, a append");
    expect(res.headers.get("x-two")).toEqual("a set");
    expect(res.headers.get("x-three")).toEqual("a append");
    expect(res.headers.get("x-four")).toEqual("a set");

    res = await fixture.requestDocument(
      "/a/b.data?_routes=routes%2Fa,routes%2Fa.b"
    );
    expect(res.headers.get("x-one")).toEqual("b set, b append");
    expect(res.headers.get("x-two")).toEqual("b set");
    expect(res.headers.get("x-three")).toEqual("a append, b append");
    expect(res.headers.get("x-four")).toEqual(null);

    res = await fixture.requestDocument("/a/b/c.data?_routes=routes%2Fa.b.c");
    expect(res.headers.get("x-one")).toEqual("c set, c append");
    expect(res.headers.get("x-two")).toEqual("c set");
    expect(res.headers.get("x-three")).toEqual("c append");
    expect(res.headers.get("x-four")).toEqual(null);

    res = await fixture.requestDocument(
      "/a/b/c.data?_routes=routes%2Fa,routes%2Fa.b.c"
    );
    expect(res.headers.get("x-one")).toEqual("c set, c append");
    expect(res.headers.get("x-two")).toEqual("c set");
    expect(res.headers.get("x-three")).toEqual("a append, c append");
    expect(res.headers.get("x-four")).toEqual("a set");

    // Action only - single fetch request
    res = await fixture.requestSingleFetchData("/a/b/c.data", {
      method: "post",
      body: null,
    });
    expect(res.headers.get("x-one")).toEqual("c action set, c action append");
    expect(res.headers.get("x-two")).toEqual("c action set");
    expect(res.headers.get("x-three")).toEqual("c action append");
    expect(res.headers.get("x-four")).toEqual("c action set");

    // Actions and Loaders - Document request
    res = await fixture.requestDocument("/a/b/c", {
      method: "post",
      body: null,
    });
    expect(res.headers.get("x-one")).toEqual("c set, c append");
    expect(res.headers.get("x-two")).toEqual("c set");
    expect(res.headers.get("x-three")).toEqual(
      "c action append, a append, b append, c append"
    );
    expect(res.headers.get("x-four")).toEqual(null);
  });

  test("merges status codes from nested routes", async () => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/a.tsx": js`
          export function loader({ request, response }) {
            if (new URL(request.url).searchParams.has("error")) {
              response.status = 401
            } else {
              response.status = 201
            }
            return null;
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.tsx": js`
          export function loader({ request, response }) {
            response.status = 202
            return null;
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.c.tsx": js`
          export function action({ request, response }) {
            response.status = 206
            return null;
          }

          export function loader({ request, response }) {
            response.status = 203
            return null;
          }

          export default function Comp() {
            return null;
          }
        `,
      },
    });

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

  test("merges headers from nested routes when raw Responses are returned", async () => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/a.tsx": js`
          export function loader({ request}) {
            let headers = new Headers();
            headers.set('x-one', 'a set');
            headers.append('x-one', 'a append');
            headers.set('x-two', 'a set');
            headers.append('x-three', 'a append');
            headers.set('x-four', 'a set');
            return new Response(null, { headers });
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.tsx": js`
          export function action({ request, response }) {
            let headers = new Headers();
            headers.set('x-one', 'b action set');
            headers.append('x-one', 'b action append');
            headers.set('x-two', 'b action set');
            headers.append('x-three', 'b action append');
            headers.set('x-four', 'b action set');
            return new Response(null, { headers });
          }

          export function loader({ request, response }) {
            let headers = new Headers();
            headers.set('x-one', 'b set');
            headers.append('x-one', 'b append');
            headers.set('x-two', 'b set');
            headers.append('x-three', 'b append');
            headers.delete('x-four');
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
    expect(res.headers.get("x-one")).toEqual("a set, a append");
    expect(res.headers.get("x-two")).toEqual("a set");
    expect(res.headers.get("x-three")).toEqual("a append");
    expect(res.headers.get("x-four")).toEqual("a set");

    res = await fixture.requestSingleFetchData("/a.data");
    expect(res.headers.get("x-one")).toEqual("a set, a append");
    expect(res.headers.get("x-two")).toEqual("a set");
    expect(res.headers.get("x-three")).toEqual("a append");
    expect(res.headers.get("x-four")).toEqual("a set");

    res = await fixture.requestDocument("/a/b");
    expect(res.headers.get("x-one")).toEqual("b set, b append");
    expect(res.headers.get("x-two")).toEqual("b set");
    expect(res.headers.get("x-three")).toEqual("b append"); // Blows away "a append"
    expect(res.headers.get("x-four")).toEqual("a set");

    res = await fixture.requestSingleFetchData("/a/b.data");
    expect(res.headers.get("x-one")).toEqual("b set, b append");
    expect(res.headers.get("x-two")).toEqual("b set");
    expect(res.headers.get("x-three")).toEqual("b append"); // Blows away "a append"
    expect(res.headers.get("x-four")).toEqual("a set");

    // Action only - single fetch request
    res = await fixture.requestSingleFetchData("/a/b.data", {
      method: "post",
      body: null,
    });
    expect(res.headers.get("x-one")).toEqual("b action set, b action append");
    expect(res.headers.get("x-two")).toEqual("b action set");
    expect(res.headers.get("x-three")).toEqual("b action append");
    expect(res.headers.get("x-four")).toEqual("b action set");

    // Actions and Loaders - Document request
    res = await fixture.requestDocument("/a/b", {
      method: "post",
      body: null,
    });
    expect(res.headers.get("x-one")).toEqual("b set, b append");
    expect(res.headers.get("x-two")).toEqual("b set");
    expect(res.headers.get("x-three")).toEqual("b append"); // Blows away prior appends
    expect(res.headers.get("x-four")).toEqual("a set"); // Can't delete via Response
  });

  test("merges status codes from nested routes when raw Responses are used", async () => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/a.tsx": js`
          export function loader({ request, response }) {
            if (new URL(request.url).searchParams.has("error")) {
              return new Response(null, { status: 401 });
            } else {
              return new Response(null, { status: 201 });
            }
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.tsx": js`
          export function loader({ request, response }) {
            return new Response(null, { status: 202 });
          }

          export default function Comp() {
            return null;
          }
        `,
        "app/routes/a.b.c.tsx": js`
          export function action({ request, response }) {
            return new Response(null, { status: 206 });
          }

          export function loader({ request, response }) {
            return new Response(null, { status: 203 });
          }

          export default function Comp() {
            return null;
          }
        `,
      },
    });

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

  test("processes thrown loader redirects via responseStub", async ({
    page,
  }) => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from '@remix-run/node';
          export function loader({ request, response }) {
            response.status = 302;
            response.headers.set('Location', '/target');
            throw response;
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

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes returned loader redirects via responseStub", async ({
    page,
  }) => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from '@remix-run/node';
          export function loader({ request, response }) {
            response.status = 302;
            response.headers.set('Location', '/target');
            return null
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

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes thrown loader redirects via Response", async ({ page }) => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from '@remix-run/node';
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

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes returned loader redirects via Response", async ({ page }) => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/routes/data.tsx": js`
          import { redirect } from '@remix-run/node';
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

    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes thrown action redirects via responseStub", async ({
    page,
  }) => {
    let fixture = await createFixture(
      {
        singleFetch: true,
        files: {
          ...files,
          "app/routes/data.tsx": js`
            import { redirect } from '@remix-run/node';
            export function action({ response }) {
              response.status = 302;
              response.headers.set('Location', '/target');
              throw response;
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

    let appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes returned action redirects via responseStub", async ({
    page,
  }) => {
    let fixture = await createFixture(
      {
        singleFetch: true,
        files: {
          ...files,
          "app/routes/data.tsx": js`
            import { redirect } from '@remix-run/node';
            export function action({ response }) {
              response.status = 302;
              response.headers.set('Location', '/target');
              return null
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

    let appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes thrown action redirects via Response", async ({ page }) => {
    let fixture = await createFixture(
      {
        singleFetch: true,
        files: {
          ...files,
          "app/routes/data.tsx": js`
            import { redirect } from '@remix-run/node';
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
        singleFetch: true,
        files: {
          ...files,
          "app/routes/data.tsx": js`
            import { redirect } from '@remix-run/node';
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

    let appFixture = await createAppFixture(fixture, ServerMode.Development);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test("processes redirects from handleDataRequest (after loaders)", async ({
    page,
  }) => {
    let fixture = await createFixture({
      singleFetch: true,
      files: {
        ...files,
        "app/entry.server.tsx": js`
          import { PassThrough } from "node:stream";

          import type { EntryContext } from "@remix-run/node";
          import { createReadableStreamFromReadable } from "@remix-run/node";
          import { RemixServer } from "@remix-run/react";
          import { renderToPipeableStream } from "react-dom/server";

          export default function handleRequest(
            request: Request,
            responseStatusCode: number,
            responseHeaders: Headers,
            remixContext: EntryContext
          ) {
            return new Promise((resolve, reject) => {
              const { pipe } = renderToPipeableStream(
                <RemixServer context={remixContext} url={request.url} />,
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
          import { redirect } from '@remix-run/node';
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
      singleFetch: true,
      files: {
        ...files,
        "app/entry.server.tsx": js`
          import { PassThrough } from "node:stream";

          import type { EntryContext } from "@remix-run/node";
          import { createReadableStreamFromReadable } from "@remix-run/node";
          import { RemixServer } from "@remix-run/react";
          import { renderToPipeableStream } from "react-dom/server";

          export default function handleRequest(
            request: Request,
            responseStatusCode: number,
            responseHeaders: Headers,
            remixContext: EntryContext
          ) {
            return new Promise((resolve, reject) => {
              const { pipe } = renderToPipeableStream(
                <RemixServer context={remixContext} url={request.url} />,
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
          import { redirect } from '@remix-run/node';
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
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickSubmitButton("/data");
    await page.waitForSelector("#target");
    expect(await app.getHtml("#target")).toContain("Target");
  });

  test.describe("client loaders", () => {
    test("when no routes have client loaders", async ({ page }) => {
      let fixture = await createFixture(
        {
          singleFetch: true,
          files: {
            ...files,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
          singleFetch: true,
          files: {
            ...files,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
          singleFetch: true,
          files: {
            ...files,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
          singleFetch: true,
          files: {
            ...files,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
          singleFetch: true,
          files: {
            ...files,
            "app/routes/_index.tsx": js`
              import {  Link } from "@remix-run/react";

              export default function Index() {
                return (
                  <nav>
                    <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                  </nav>
                );
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
          singleFetch: true,
          files: {
            ...files,
            "app/routes/_index.tsx": js`
              import {  Link } from "@remix-run/react";

              export default function Index() {
                return (
                  <nav>
                    <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                  </nav>
                );
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
          singleFetch: true,
          files: {
            ...files,
            "app/routes/_index.tsx": js`
              import {  Link } from "@remix-run/react";

              export default function Index() {
                return (
                  <nav>
                    <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                  </nav>
                );
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
          singleFetch: true,
          files: {
            ...files,
            "app/routes/_index.tsx": js`
              import {  Link } from "@remix-run/react";

              export default function Index() {
                return (
                  <nav>
                    <Link to="/a/b/c" prefetch="render">/a/b/c</Link>
                  </nav>
                );
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { Outlet, useLoaderData } from '@remix-run/react';

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
              import { useLoaderData } from '@remix-run/react';

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
});
