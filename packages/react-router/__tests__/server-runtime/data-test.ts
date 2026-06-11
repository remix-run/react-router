import { decodeViaTurboStream } from "../../lib/dom/ssr/single-fetch";
import { encodeViaTurboStream } from "../../lib/server-runtime/single-fetch";
import { createRequestHandler } from "../../lib/server-runtime/server";
import { ServerMode } from "../../lib/server-runtime/mode";
import { mockServerBuild } from "./utils";

describe("loaders", () => {
  // so that HTML/Fetch requests are the same, and so redirects don't hang on to
  // this param for no reason
  it("removes .data from request.url", async () => {
    let loader = async ({ request }) => {
      return new URL(request.url).pathname;
    };

    let routeId = "routes/random";
    let build = mockServerBuild({
      [routeId]: {
        path: "/random",
        default: {},
        loader,
      },
    });

    let handler = createRequestHandler(build);

    let request = new Request("http://example.com/random.data", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    let res = await handler(request);
    if (!res.body) throw new Error("No body");
    const decoded = await decodeViaTurboStream(res.body, global);
    expect((decoded.value as any)[routeId].data).toEqual("/random");
  });
});

describe("encodeViaTurboStream / decodeViaTurboStream roundtrip", () => {
  it("preserves a non-Error object thrown from a deferred loader promise", async () => {
    const rejection = { code: "NOT_FOUND", id: 42 };
    const controller = new AbortController();

    // Attach a no-op catch so Node does not raise an unhandled rejection before
    // the encoder consumes the promise.
    const deferred = Promise.reject(rejection);
    deferred.catch(() => {});

    const stream = encodeViaTurboStream(
      { deferred },
      controller.signal,
      undefined,
      ServerMode.Development,
    );

    const decoded = await decodeViaTurboStream(stream, global);
    const value = decoded.value as { deferred: Promise<unknown> };
    await expect(value.deferred).rejects.toEqual(rejection);
    await decoded.done;
  });

  it("preserves a string thrown from a deferred loader promise", async () => {
    const controller = new AbortController();

    const deferred = Promise.reject("custom string error");
    deferred.catch(() => {});

    const stream = encodeViaTurboStream(
      { deferred },
      controller.signal,
      undefined,
      ServerMode.Development,
    );

    const decoded = await decodeViaTurboStream(stream, global);
    const value = decoded.value as { deferred: Promise<unknown> };
    await expect(value.deferred).rejects.toBe("custom string error");
    await decoded.done;
  });
});
