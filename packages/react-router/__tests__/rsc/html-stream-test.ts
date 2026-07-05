import { injectRSCPayload } from "../../lib/rsc/html-stream/server";

const encoder = new TextEncoder();

function createRSCStream() {
  let cancelled = false;
  let stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('S1:"hello"'));
      // Keep the stream open so cancellation happens mid-stream.
    },
    cancel() {
      cancelled = true;
    },
  });
  return { stream, isCancelled: () => cancelled };
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

describe("injectRSCPayload", () => {
  it("does not crash when the readable side is cancelled while a flush is pending", async () => {
    let rsc = createRSCStream();
    let transform = injectRSCPayload(rsc.stream);
    let writer = transform.writable.getWriter();
    let reader = transform.readable.getReader();

    let unhandledRejections = await withUnhandledRejections(async () => {
      // Schedule the buffered flush (`setTimeout(..., 0)`) by writing a chunk,
      // then cancel the readable side (client aborted the request) before the
      // timer fires.
      writer
        .write(encoder.encode("<html><body>hi</body></html>"))
        .catch(() => {});
      await reader.cancel(new Error("client aborted"));

      // Let the pending flush timer fire.
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Without a cancel handler the pending flush enqueues into a cancelled
    // stream, and the rejection from the timer callback kills the process.
    expect(unhandledRejections).toEqual([]);
    expect(rsc.isCancelled()).toBe(true);
  });

  it("does not crash when the readable side is cancelled while the RSC payload is streaming", async () => {
    let rsc = createRSCStream();
    let transform = injectRSCPayload(rsc.stream);
    let writer = transform.writable.getWriter();
    let reader = transform.readable.getReader();

    let unhandledRejections = await withUnhandledRejections(async () => {
      writer
        .write(encoder.encode("<html><body>hi</body></html>"))
        .catch(() => {});
      // Read the flushed HTML and the first RSC script chunk so the RSC
      // payload stream is being consumed, then abort.
      await reader.read();
      await reader.read();
      await reader.cancel(new Error("client aborted"));

      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(unhandledRejections).toEqual([]);
    expect(rsc.isCancelled()).toBe(true);
  });
});
