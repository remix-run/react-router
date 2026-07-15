import { injectRSCPayload } from "../../lib/rsc/html-stream/server";
import { routeRSCServerRequest } from "../../lib/rsc/server.ssr";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  let promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createRSCStream({
  keepOpen = false,
  chunks = ['S1:"hello"'],
}: {
  keepOpen?: boolean;
  chunks?: string[];
} = {}) {
  let cancelled = false;
  let cancelReason: unknown;
  let stream = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      if (!keepOpen) {
        controller.close();
      }
    },
    cancel(reason) {
      cancelled = true;
      cancelReason = reason;
    },
  });
  return {
    stream,
    isCancelled: () => cancelled,
    cancelReason: () => cancelReason,
  };
}

async function withUnhandledRejections(run: () => Promise<void>) {
  let unhandledRejections: unknown[] = [];
  let onUnhandledRejection = (reason: unknown) =>
    unhandledRejections.push(reason);
  process.on("unhandledRejection", onUnhandledRejection);
  try {
    await run();
  } finally {
    process.off("unhandledRejection", onUnhandledRejection);
  }
  return unhandledRejections;
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

async function withTimeout<T>(promise: Promise<T>, message: string) {
  let timeout: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), 1000);
      }),
    ]);
  } finally {
    clearTimeout(timeout!);
  }
}

async function readStream(stream: ReadableStream<Uint8Array>) {
  let reader = stream.getReader();
  let chunks: Uint8Array[] = [];

  while (true) {
    let { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }

  let length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  let merged = new Uint8Array(length);
  let offset = 0;
  for (let chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return decoder.decode(merged);
}

describe("injectRSCPayload", () => {
  it("streams buffered HTML, RSC payload chunks, and the HTML trailer", async () => {
    let html = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("<html><body>"));
        controller.enqueue(encoder.encode("hi</body></html>"));
        controller.close();
      },
    });

    let result = await readStream(
      html.pipeThrough(injectRSCPayload(createRSCStream().stream)),
    );

    expect(result).toBe(
      '<html><body>hi<script>(self.__FLIGHT_DATA||=[]).push("S1:\\"hello\\"")</script></body></html>',
    );
  });

  it("adds an escaped nonce to every RSC payload script", async () => {
    let html = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("<html><body>hi</body></html>"));
        controller.close();
      },
    });

    let result = await readStream(
      html.pipeThrough(
        injectRSCPayload(
          createRSCStream({ chunks: ["first", "second"] }).stream,
          { nonce: 'test"&<>' },
        ),
      ),
    );

    expect(result).toBe(
      '<html><body>hi<script nonce="test&quot;&amp;&lt;&gt;">(self.__FLIGHT_DATA||=[]).push("first")</script><script nonce="test&quot;&amp;&lt;&gt;">(self.__FLIGHT_DATA||=[]).push("second")</script></body></html>',
    );
  });

  it("does not crash when the readable side is cancelled while a flush is pending", async () => {
    let rsc = createRSCStream({ keepOpen: true });
    let transform = injectRSCPayload(rsc.stream);
    let writer = transform.writable.getWriter();
    let reader = transform.readable.getReader();
    let reason = new Error("client aborted");

    let unhandledRejections = await withUnhandledRejections(async () => {
      // Schedule the buffered flush (`setTimeout(..., 0)`) by writing a chunk,
      // then cancel the readable side (client aborted the request) before the
      // timer fires.
      writer
        .write(encoder.encode("<html><body>hi</body></html>"))
        .catch(() => {});
      await reader.cancel(reason);

      // Let the pending flush timer fire.
      await tick();
    });

    // Without a cancel handler the pending flush enqueues into a cancelled
    // stream, and the rejection from the timer callback kills the process.
    expect(unhandledRejections).toEqual([]);
    expect(rsc.isCancelled()).toBe(true);
    expect(rsc.cancelReason()).toBe(reason);
  });

  it("does not crash when the readable side is cancelled while the RSC payload is streaming", async () => {
    let rsc = createRSCStream({ keepOpen: true });
    let transform = injectRSCPayload(rsc.stream);
    let writer = transform.writable.getWriter();
    let reader = transform.readable.getReader();
    let reason = new Error("client aborted");

    let unhandledRejections = await withUnhandledRejections(async () => {
      writer
        .write(encoder.encode("<html><body>hi</body></html>"))
        .catch(() => {});
      // Read the flushed HTML and the first RSC script chunk so the RSC
      // payload stream is being consumed, then abort.
      await reader.read();
      await reader.read();
      await reader.cancel(reason);

      await tick();
    });

    expect(unhandledRejections).toEqual([]);
    expect(rsc.isCancelled()).toBe(true);
    expect(rsc.cancelReason()).toBe(reason);
  });
});

describe("routeRSCServerRequest", () => {
  it("passes a nonce to the HTML renderer and RSC payload scripts", async () => {
    let renderNonce: string | undefined;
    let response = await routeRSCServerRequest({
      request: new Request("https://remix.run/"),
      serverResponse: new Response(createRSCStream().stream),
      nonce: "test-nonce",
      createFromReadableStream: async (body) => {
        await readStream(body);
        return { type: "render" } as never;
      },
      async renderHTML(getPayload, options) {
        await getPayload();
        renderNonce = options.nonce;
        return new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(encoder.encode("<html><body>hi</body></html>"));
            controller.close();
          },
        });
      },
    });

    expect(renderNonce).toBe("test-nonce");
    await expect(readStream(response.body!)).resolves.toContain(
      '<script nonce="test-nonce">(self.__FLIGHT_DATA||=[]).push(',
    );
  });

  it("passes the nonce through an HTML render retry", async () => {
    let renderNonces: Array<string | undefined> = [];
    let response = await routeRSCServerRequest({
      request: new Request("https://remix.run/"),
      serverResponse: new Response(createRSCStream().stream),
      nonce: "test-nonce",
      createFromReadableStream: async (body) => {
        await readStream(body);
        return { type: "render" } as never;
      },
      async renderHTML(getPayload, options) {
        renderNonces.push(options.nonce);
        if (renderNonces.length === 1) {
          throw new Error("render failed");
        }
        await getPayload();
        return new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              encoder.encode("<html><body>retry</body></html>"),
            );
            controller.close();
          },
        });
      },
    });

    expect(renderNonces).toEqual(["test-nonce", "test-nonce"]);
    await expect(readStream(response.body!)).resolves.toContain(
      '<script nonce="test-nonce">(self.__FLIGHT_DATA||=[]).push(',
    );
  });

  it("does not crash when an RSC Framework document response is cancelled while payload injection has a pending flush", async () => {
    let htmlPulled = createDeferred();
    let htmlCancelled = createDeferred<unknown>();
    let response = await routeRSCServerRequest({
      request: new Request("https://remix.run/"),
      serverResponse: new Response(createRSCStream().stream),
      createFromReadableStream: async (body) => {
        await readStream(body);
        return { type: "render" } as never;
      },
      async renderHTML(getPayload) {
        await getPayload();
        let sent = false;
        return new ReadableStream<Uint8Array>({
          pull(controller) {
            if (sent) {
              return;
            }
            sent = true;
            controller.enqueue(encoder.encode("<html><body>hi</body></html>"));
            htmlPulled.resolve();
          },
          cancel(reason) {
            htmlCancelled.resolve(reason);
          },
        });
      },
    });
    let reader = response.body!.getReader();
    let reason = new Error("client aborted");

    let unhandledRejections = await withUnhandledRejections(async () => {
      let read = reader.read().catch(() => {});

      await htmlPulled.promise;
      await Promise.resolve();
      await withTimeout(
        reader.cancel(reason),
        "Timed out cancelling document response body",
      );
      await withTimeout(read, "Timed out settling pending document body read");

      await tick();
    });

    expect(unhandledRejections).toEqual([]);
    await expect(
      withTimeout(htmlCancelled.promise, "Timed out cancelling HTML stream"),
    ).resolves.toBe(reason);
  });
});
