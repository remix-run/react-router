import { PassThrough, Readable } from "node:stream";
// @ts-expect-error - no types
import ReactDOMServer from "react-dom/server.node";
import type {
  renderToPipeableStream as renderToPipeableStreamType,
  renderToReadableStream as renderToReadableStreamType,
  ReactDOMServerReadableStream,
} from "react-dom/server";

class Deferred<T> {
  promise: Promise<T>;
  // @ts-expect-error - no initializer
  resolve: (value: T) => void;
  // @ts-expect-error - no initializer
  reject: (reason?: unknown) => void;
  done = false;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (value) => {
        if (this.done) return;
        this.done = true;
        resolve(value);
      };
      this.reject = (reason) => {
        if (this.done) return;
        this.done = true;
        reject(reason);
      };
    });
  }
}

const renderToPipeableStream =
  ReactDOMServer.renderToPipeableStream as typeof renderToPipeableStreamType;

export const renderToReadableStream: typeof renderToReadableStreamType = async (
  element,
  options
) => {
  const { signal, ...rest } = options ?? {};

  const shellReady = new Deferred<ReactDOMServerReadableStream>();
  const allReady = new Deferred<void>();

  // If nobody ever awaits this promise, this line will prevent an UnhandledPromiseRejection error
  // from showing up in the console.
  allReady.promise.catch(() => {});

  const { pipe, abort } = renderToPipeableStream(element, {
    ...rest,
    onShellReady() {
      shellReady.resolve(readable);
    },
    onAllReady() {
      allReady.resolve();
    },
    onShellError(error) {
      allReady.reject(error);
      shellReady.reject(error);
    },
  });

  let startedFlowing = false;
  const passthrough = new PassThrough({
    read() {
      if (!startedFlowing) {
        startedFlowing = true;
        pipe(passthrough);
      }
    },
  });

  if (signal) {
    signal.addEventListener("abort", abort, { once: true });
  }

  const readable = Readable.toWeb(
    passthrough
  ) as unknown as ReactDOMServerReadableStream;
  readable.allReady = allReady.promise;

  return shellReady.promise;
};
