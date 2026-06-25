import type { Readable, Writable } from "node:stream";
import { Stream } from "node:stream";

export async function writeReadableStreamToWritable(
  stream: ReadableStream,
  writable: Writable,
) {
  let reader = stream.getReader();
  let flushable = writable as { flush?: Function };
  let writableError = monitorWritableError(writable);

  try {
    while (true) {
      writableError.throwIfClosed();

      let { done, value } = await writableError.race(reader.read());

      if (done) {
        writable.end();
        break;
      }

      writableError.throwIfClosed();

      let canContinueWriting = writable.write(value);
      if (typeof flushable.flush === "function") {
        flushable.flush();
      }

      if (!canContinueWriting) {
        await waitForDrain(writable, writableError);
      }
    }
  } catch (error: unknown) {
    try {
      reader.cancel(error).catch(() => {});
    } catch {
      // Ignore cancellation errors so we preserve the original write failure.
    }
    writable.destroy(error as Error);
    throw error;
  } finally {
    writableError.cleanup();
    try {
      reader.releaseLock();
    } catch {
      // Ignore release errors so we preserve the original write failure.
    }
  }
}

interface WritableErrorMonitor {
  cleanup(): void;
  race<T>(promise: Promise<T>): Promise<T>;
  throwIfClosed(): void;
}

function monitorWritableError(writable: Writable): WritableErrorMonitor {
  let settled = false;
  let writableError: Error | undefined;
  let rejectWritableError!: (error: Error) => void;
  let writableErrorPromise = new Promise<never>((_, reject) => {
    rejectWritableError = reject;
  });
  writableErrorPromise.catch(() => {});

  function cleanup() {
    writable.off("error", onError);
    writable.off("close", onClose);
  }

  function reject(error: Error) {
    if (settled) {
      return;
    }

    settled = true;
    writableError = error;
    cleanup();
    rejectWritableError(error);
  }

  function onError(error: Error) {
    reject(error);
  }

  function onClose() {
    reject(new Error("Writable closed before stream finished"));
  }

  writable.once("error", onError);
  writable.once("close", onClose);

  return {
    cleanup,
    race<T>(promise: Promise<T>) {
      return Promise.race([promise, writableErrorPromise]);
    },
    throwIfClosed() {
      if (writableError) {
        throw writableError;
      }

      if (writable.destroyed || writable.writableEnded) {
        throw new Error("Cannot write to a destroyed or ended writable stream");
      }
    },
  };
}

function waitForDrain(
  writable: Writable,
  writableError: WritableErrorMonitor,
): Promise<void> {
  let cleanup = () => {};
  let drainPromise = new Promise<void>((resolve) => {
    function onDrain() {
      cleanup();
      resolve();
    }

    cleanup = function cleanup() {
      writable.off("drain", onDrain);
    };

    writable.once("drain", onDrain);
  });

  return writableError.race(drainPromise).finally(cleanup);
}

export async function writeAsyncIterableToWritable(
  iterable: AsyncIterable<Uint8Array>,
  writable: Writable,
) {
  let writableError = monitorWritableError(writable);
  let iterator = iterable[Symbol.asyncIterator]();
  let completed = false;

  try {
    while (true) {
      writableError.throwIfClosed();

      let { done, value: chunk } = await writableError.race(iterator.next());

      if (done) {
        completed = true;
        break;
      }

      writableError.throwIfClosed();

      let canContinueWriting = writable.write(chunk);

      if (!canContinueWriting) {
        await waitForDrain(writable, writableError);
      }
    }

    writable.end();
  } catch (error: any) {
    if (!completed) {
      try {
        Promise.resolve(iterator.return?.()).catch(() => {});
      } catch {
        // Ignore return errors so we preserve the original write failure.
      }
    }
    writable.destroy(error);
    throw error;
  } finally {
    writableError.cleanup();
  }
}

export async function readableStreamToString(
  stream: ReadableStream<Uint8Array>,
  encoding?: BufferEncoding,
) {
  let reader = stream.getReader();
  let chunks: Uint8Array[] = [];

  while (true) {
    let { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }

  return Buffer.concat(chunks).toString(encoding);
}

export const createReadableStreamFromReadable = (
  source: Readable & { readableHighWaterMark?: number },
) => {
  let pump = new StreamPump(source);
  let stream = new ReadableStream(pump, pump);
  return stream;
};

class StreamPump {
  public highWaterMark: number;
  public accumulatedSize: number;
  private stream: Stream & {
    readableHighWaterMark?: number;
    readable?: boolean;
    resume?: () => void;
    pause?: () => void;
    destroy?: (error?: Error) => void;
  };
  private controller?: ReadableStreamController<Uint8Array>;

  constructor(
    stream: Stream & {
      readableHighWaterMark?: number;
      readable?: boolean;
      resume?: () => void;
      pause?: () => void;
      destroy?: (error?: Error) => void;
    },
  ) {
    this.highWaterMark =
      stream.readableHighWaterMark ||
      new Stream.Readable().readableHighWaterMark;
    this.accumulatedSize = 0;
    this.stream = stream;
    this.enqueue = this.enqueue.bind(this);
    this.error = this.error.bind(this);
    this.close = this.close.bind(this);
  }

  size(chunk: Uint8Array) {
    return chunk?.byteLength || 0;
  }

  start(controller: ReadableStreamController<Uint8Array>) {
    this.controller = controller;
    this.stream.on("data", this.enqueue);
    this.stream.once("error", this.error);
    this.stream.once("end", this.close);
    this.stream.once("close", this.close);
  }

  pull() {
    this.resume();
  }

  cancel(reason?: Error) {
    if (this.stream.destroy) {
      this.stream.destroy(reason);
    }

    this.stream.off("data", this.enqueue);
    this.stream.off("error", this.error);
    this.stream.off("end", this.close);
    this.stream.off("close", this.close);
  }

  enqueue(chunk: Uint8Array | string) {
    if (this.controller) {
      try {
        let bytes: Uint8Array<ArrayBuffer> =
          typeof chunk === "string"
            ? Buffer.from(chunk)
            : new Uint8Array(chunk);

        let available = (this.controller.desiredSize || 0) - bytes.byteLength;
        this.controller.enqueue(bytes);
        if (available <= 0) {
          this.pause();
        }
      } catch (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        e
      ) {
        this.controller.error(
          new Error(
            "Could not create Buffer, chunk must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object",
          ),
        );
        this.cancel();
      }
    }
  }

  pause() {
    if (this.stream.pause) {
      this.stream.pause();
    }
  }

  resume() {
    if (this.stream.readable && this.stream.resume) {
      this.stream.resume();
    }
  }

  close() {
    if (this.controller) {
      this.controller.close();
      delete this.controller;
    }
  }

  error(error: Error) {
    if (this.controller) {
      this.controller.error(error);
      delete this.controller;
    }
  }
}
