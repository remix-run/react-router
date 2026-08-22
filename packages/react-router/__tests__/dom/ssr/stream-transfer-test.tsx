/**
 * @jest-environment node
 */
import * as React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";

import { createStaticHandler } from "react-router";
import { Scripts } from "../../../index";
import { ServerRouter } from "../../../lib/dom/ssr/server";
import invariant from "../../../lib/dom/ssr/invariant";
import { mockEntryContext } from "../../utils/framework";

// Renders the document to completion (`onAllReady`) and resolves with the
// full HTML output
function renderDocument(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        let sink = new PassThrough();
        let html = "";
        sink.on("data", (chunk) => {
          html += chunk.toString();
        });
        sink.on("end", () => resolve(html));
        pipe(sink);
      },
      onShellError(error) {
        reject(error);
      },
      onError() {},
    });
  });
}

// A hook that suspends on the first render and settles in a microtask,
// mimicking libraries like react-i18next that initialize asynchronously
// above `<Scripts>` (https://github.com/remix-run/react-router/issues/15390)
function createSuspendingGate() {
  let ready = false;
  let promise: Promise<void> | undefined;
  return function useGate() {
    if (ready) return;
    if (!promise) {
      promise = Promise.resolve().then(() => {
        ready = true;
      });
    }
    throw promise;
  };
}

function createServerHandoffStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('[["loaderData"]]'));
      controller.close();
    },
  });
}

async function createContext(Root: React.ComponentType) {
  let staticHandlerContext = await createStaticHandler([
    { id: "root", path: "/" },
  ]).query(new Request("http://localhost/"));
  invariant(!(staticHandlerContext instanceof Response), "Expected a context");

  return mockEntryContext({
    manifest: {
      routes: {
        root: {
          hasLoader: false,
          hasAction: false,
          hasErrorBoundary: false,
          id: "root",
          module: "root.js",
          path: "/",
        },
      },
      entry: { imports: [], module: "" },
      url: "",
      version: "",
    },
    routeModules: {
      root: { default: Root },
    },
    staticHandlerContext,
    serverHandoffString: "{}",
    serverHandoffStream: createServerHandoffStream(),
    renderMeta: {},
  });
}

describe("<StreamTransfer>", () => {
  it("streams the handoff when a component above <Scripts> suspends", async () => {
    let useGate = createSuspendingGate();

    function Root() {
      useGate();
      return (
        <html lang="en">
          <body>
            <h1>Root</h1>
            <Scripts />
          </body>
        </html>
      );
    }

    let context = await createContext(Root);
    let html = await renderDocument(
      <ServerRouter context={context} url="http://localhost/" />,
    );

    expect(html).toMatch("<h1>Root</h1>");
    expect(html).toContain(
      "window.__reactRouterContext.streamController.enqueue(",
    );
    expect(html).toContain(
      "window.__reactRouterContext.streamController.close();",
    );
  });

  it("streams the handoff when nothing suspends", async () => {
    function Root() {
      return (
        <html lang="en">
          <body>
            <h1>Root</h1>
            <Scripts />
          </body>
        </html>
      );
    }

    let context = await createContext(Root);
    let html = await renderDocument(
      <ServerRouter context={context} url="http://localhost/" />,
    );

    expect(html).toContain(
      "window.__reactRouterContext.streamController.enqueue(",
    );
    expect(html).toContain(
      "window.__reactRouterContext.streamController.close();",
    );
  });

  it("does not stream anything when the document never renders <Scripts>", async () => {
    function Root() {
      return (
        <html lang="en">
          <body>
            <h1>No scripts</h1>
          </body>
        </html>
      );
    }

    let context = await createContext(Root);
    let html = await renderDocument(
      <ServerRouter context={context} url="http://localhost/" />,
    );

    expect(html).toMatch("<h1>No scripts</h1>");
    expect(html).not.toContain("streamController.enqueue(");
    expect(html).not.toContain("streamController.close();");
  });

  it("does not stream anything when a suspending document never renders <Scripts>", async () => {
    let useGate = createSuspendingGate();

    function Root() {
      useGate();
      return (
        <html lang="en">
          <body>
            <h1>No scripts</h1>
          </body>
        </html>
      );
    }

    let context = await createContext(Root);
    let html = await renderDocument(
      <ServerRouter context={context} url="http://localhost/" />,
    );

    expect(html).toMatch("<h1>No scripts</h1>");
    expect(html).not.toContain("streamController.enqueue(");
    expect(html).not.toContain("streamController.close();");
  });
});
