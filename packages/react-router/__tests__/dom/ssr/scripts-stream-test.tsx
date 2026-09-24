import assert from "node:assert";
import * as React from "react";
import { render } from "@testing-library/react";
import { createStaticHandler } from "react-router";

import { Scripts } from "../../../index";
import { ServerRouter } from "../../../lib/dom/ssr/server";
import invariant from "../../../lib/dom/ssr/invariant";
import { mockEntryContext } from "../../utils/framework";

describe("<Scripts /> streamScript", () => {
  it("does not use pipeThrough or TextEncoderStream in streamScript to avoid WKWebView recursion crash", async () => {
    let staticHandlerContext = await createStaticHandler([
      { id: "root", path: "/" },
    ]).query(new Request("http://localhost/"));

    invariant(
      !(staticHandlerContext instanceof Response),
      "Expected a context",
    );

    let context = mockEntryContext({
      staticHandlerContext,
      serverHandoffString: "{}",
      manifest: {
        routes: {
          root: {
            hasLoader: true,
            hasClientLoader: false,
            hasAction: false,
            hasErrorBoundary: false,
            id: "root",
            module: "root.js",
            path: "/",
          },
        },
        entry: {
          imports: [],
          module: "entry.js",
        },
        url: "manifest.js",
        version: "",
      },
      routeModules: {
        root: {
          default: () => (
            <div>
              <h1>Root</h1>
              <Scripts />
            </div>
          ),
        },
      },
    });

    let { container } = render(
      <ServerRouter context={context} url="http://localhost/" />,
    );

    let inlineScripts = Array.from(
      container.ownerDocument.querySelectorAll("script"),
    ).map((s) => s.textContent || "");

    let streamInlineScript = inlineScripts.find((s) =>
      s.includes("__reactRouterContext.stream"),
    );

    expect(streamInlineScript).toBeDefined();
    // Regression check for #15486: must not use pipeThrough or TextEncoderStream
    assert(!streamInlineScript!.includes("pipeThrough"), "AssertionError: streamScript contains pipeThrough");
    assert(!streamInlineScript!.includes("TextEncoderStream"), "AssertionError: streamScript contains TextEncoderStream");
    expect(streamInlineScript).not.toContain("pipeThrough");
    expect(streamInlineScript).not.toContain("TextEncoderStream");

    delete (window as any).__reactRouterContext;
    expect(() => {
      // eslint-disable-next-line no-eval
      eval(streamInlineScript!);
    }).not.toThrow();

    let stream = (window as any).__reactRouterContext?.stream;
    let streamController = (window as any).__reactRouterContext?.streamController;

    expect(stream).toBeDefined();
    expect(streamController).toBeDefined();

    let reader = stream.getReader();
    streamController.enqueue("test chunk");
    streamController.close();

    let { value, done } = await reader.read();
    expect(value.constructor.name).toBe("Uint8Array");
    expect(new TextDecoder().decode(value)).toBe("test chunk");

    let end = await reader.read();
    expect(end.done).toBe(true);

    delete (window as any).__reactRouterContext;
  });
});
