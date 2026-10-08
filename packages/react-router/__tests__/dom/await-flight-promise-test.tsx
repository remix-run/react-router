import * as React from "react";
import * as ReactDOMServer from "react-dom/server.edge";
import { Await } from "../../index";

// Mimics the `ReactPromise` chunks returned by `react-server-dom-*/client`
// when decoding a Flight stream. They inherit from `Promise.prototype` (so they
// pass `instanceof Promise`), but their `then` method returns `undefined`
// instead of a new promise.
function createFlightPromise<T>(
  executor: (
    resolve: (value: T) => void,
    reject: (error: unknown) => void,
  ) => void,
): Promise<T> {
  let inner = new Promise<T>(executor);
  let flightPromise = Object.create(Promise.prototype);
  flightPromise.then = function (
    onFulfilled?: (value: T) => unknown,
    onRejected?: (error: unknown) => unknown,
  ) {
    inner.then(onFulfilled, onRejected);
  };
  return flightPromise;
}

async function renderToHTML(element: React.ReactElement) {
  let errors: unknown[] = [];
  let stream = await ReactDOMServer.renderToReadableStream(element, {
    onError(error) {
      errors.push(error);
    },
  });
  await stream.allReady;
  let html = await new Response(stream).text();
  return { html, errors };
}

describe("<Await> with Flight (RSC) promises", () => {
  it("test helper produces a promise whose `then` returns undefined", () => {
    let promise = createFlightPromise(() => {});
    expect(promise instanceof Promise).toBe(true);
    expect(promise.then(() => {})).toBeUndefined();
  });

  it("server renders resolved data without switching to client rendering", async () => {
    let promise = createFlightPromise<string>((resolve) =>
      setTimeout(() => resolve("RESOLVED_VALUE"), 10),
    );

    let { html, errors } = await renderToHTML(
      <React.Suspense fallback={<p>loading</p>}>
        <Await resolve={promise}>
          {(value) => <p id="resolved">{value}</p>}
        </Await>
      </React.Suspense>,
    );

    expect(errors).toEqual([]);
    // `<!--$!-->` marks a Suspense boundary that errored on the server and
    // will be client rendered
    expect(html).not.toContain("<!--$!-->");
    expect(html).toContain('<p id="resolved">RESOLVED_VALUE</p>');
  });

  it("server renders the errorElement for rejected promises", async () => {
    let promise = createFlightPromise<string>((_, reject) =>
      setTimeout(() => reject(new Error("REJECTED")), 10),
    );

    let { html, errors } = await renderToHTML(
      <React.Suspense fallback={<p>loading</p>}>
        <Await resolve={promise} errorElement={<p id="error">ERROR_ELEMENT</p>}>
          {(value) => <p id="resolved">{value}</p>}
        </Await>
      </React.Suspense>,
    );

    expect(errors).toEqual([]);
    expect(html).not.toContain("<!--$!-->");
    expect(html).toContain('<p id="error">ERROR_ELEMENT</p>');
  });
});
