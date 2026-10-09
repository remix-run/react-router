/**
 * @jest-environment node
 */

import { readableStreamToString } from "../index";

describe("readableStreamToString reader ownership", () => {
  it("releases its reader after consuming a stream", async () => {
    let stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("hello 世界"));
        controller.close();
      },
    });

    await expect(readableStreamToString(stream)).resolves.toBe("hello 世界");
    expect(stream.locked).toBe(false);
    let reader = stream.getReader();
    await expect(reader.read()).resolves.toEqual({
      done: true,
      value: undefined,
    });
    reader.releaseLock();
  });

  it("releases its reader and preserves a read failure", async () => {
    let error = new Error("source failed");
    let stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.error(error);
      },
    });

    await expect(readableStreamToString(stream)).rejects.toBe(error);
    expect(stream.locked).toBe(false);
    let reader = stream.getReader();
    await expect(reader.read()).rejects.toBe(error);
    reader.releaseLock();
  });

  it("releases its reader when decoding fails", async () => {
    let stream = new ReadableStream({
      start(controller) {
        controller.enqueue("not a byte array");
        controller.close();
      },
    });

    await expect(readableStreamToString(stream)).rejects.toMatchObject({
      name: "TypeError",
    });
    expect(stream.locked).toBe(false);
  });

  it("keeps its encoding and empty-stream behavior", async () => {
    let stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([0xe9]));
        controller.close();
      },
    });
    await expect(readableStreamToString(stream, "latin1")).resolves.toBe("é");
    await expect(
      readableStreamToString(new ReadableStream({ start: (c) => c.close() })),
    ).resolves.toBe("");
  });
});
