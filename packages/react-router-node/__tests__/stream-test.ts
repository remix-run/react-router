/**
 * @jest-environment node
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Writable } from "node:stream";

import { transformFileSync } from "@babel/core";

import {
  writeAsyncIterableToWritable,
  writeReadableStreamToWritable,
} from "../stream";

function createBackpressureSamplingWritable(
  highWaterMark: number,
  writeDelayMs: number,
) {
  let writable: Writable = new Writable({
    highWaterMark,
    write(_chunk, _encoding, callback) {
      setTimeout(callback, writeDelayMs);
    },
  });

  let maxBufferedLength = 0;
  let originalWrite = writable.write.bind(writable);
  writable.write = function (chunk: any, ...rest: any[]) {
    let result = originalWrite(chunk, ...rest);
    maxBufferedLength = Math.max(maxBufferedLength, writable.writableLength);
    return result;
  } as typeof writable.write;

  return {
    writable,
    getMaxBufferedLength: () => maxBufferedLength,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  let timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Timed out")), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timeout),
  );
}

// Fixtures are plain ESM so they can run in a child process on any supported
// Node version without relying on `--experimental-strip-types` (which is
// unavailable before Node 22.6). They import the `stream.ts` source via a
// transpiled copy whose path is provided in the STREAM_MODULE_PATH env var.
let compiledStreamModulePath: string | undefined;

function getStreamModulePath(): string {
  if (!compiledStreamModulePath) {
    let tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "react-router-node-stream-"),
    );
    let result = transformFileSync(path.join(__dirname, "..", "stream.ts"), {
      babelrc: false,
      configFile: false,
      presets: ["@babel/preset-typescript"],
    });
    compiledStreamModulePath = path.join(tempDir, "stream.mjs");
    fs.writeFileSync(compiledStreamModulePath, result!.code!);
  }

  return compiledStreamModulePath;
}

function runFixtureProcess(fixtureName: string) {
  let fixture = path.join(__dirname, "fixtures", fixtureName);
  let result = spawnSync(process.execPath, [fixture], {
    encoding: "utf8",
    timeout: 5_000,
    env: { ...process.env, STREAM_MODULE_PATH: getStreamModulePath() },
  });

  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

afterAll(() => {
  if (compiledStreamModulePath) {
    fs.rmSync(path.dirname(compiledStreamModulePath), {
      recursive: true,
      force: true,
    });
    compiledStreamModulePath = undefined;
  }
});

let survivedProcess = {
  status: 0,
  signal: null,
  stdout: "process survived\n",
  stderr: "",
};

describe("writeReadableStreamToWritable", () => {
  it("respects writable backpressure", async () => {
    let highWaterMark = 16;
    let chunkSize = 8;
    let numChunks = 100;
    let { writable, getMaxBufferedLength } = createBackpressureSamplingWritable(
      highWaterMark,
      5,
    );

    let readable = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < numChunks; i++) {
          controller.enqueue(new Uint8Array(chunkSize));
        }
        controller.close();
      },
    });

    await writeReadableStreamToWritable(readable, writable);

    expect(getMaxBufferedLength()).toBeLessThanOrEqual(
      highWaterMark + chunkSize,
    );
  });

  it("rejects if the writable errors while waiting for the next chunk", async () => {
    let writableError = new Error("Writable failed");
    let writable = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    let readable = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1));
      },
    });

    let writePromise = writeReadableStreamToWritable(readable, writable);

    setTimeout(() => writable.destroy(writableError), 10);

    await expect(withTimeout(writePromise, 100)).rejects.toThrow(
      "Writable failed",
    );
  });

  it("does not crash when a destination writable closes mid-stream", () => {
    expect(runFixtureProcess("stream-closed-writable.mjs")).toEqual(
      survivedProcess,
    );
  });

  it("does not crash when a destination close cancels a Node readable", () => {
    expect(runFixtureProcess("stream-cancelled-node-readable.mjs")).toEqual(
      survivedProcess,
    );
  });

  it("does not crash while a destroyed writable has an error pending", () => {
    expect(runFixtureProcess("stream-pending-writable-error.mjs")).toEqual(
      survivedProcess,
    );
  });
});

describe("writeAsyncIterableToWritable", () => {
  it("respects writable backpressure", async () => {
    let highWaterMark = 16;
    let chunkSize = 8;
    let numChunks = 100;
    let { writable, getMaxBufferedLength } = createBackpressureSamplingWritable(
      highWaterMark,
      5,
    );

    async function* chunks() {
      for (let i = 0; i < numChunks; i++) {
        yield new Uint8Array(chunkSize);
      }
    }

    await writeAsyncIterableToWritable(chunks(), writable);

    expect(getMaxBufferedLength()).toBeLessThanOrEqual(
      highWaterMark + chunkSize,
    );
  });

  it("rejects if the writable closes while waiting for the next chunk", async () => {
    let writable = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    async function* chunks() {
      yield new Uint8Array(1);
      await new Promise<never>(() => {});
    }

    let writePromise = writeAsyncIterableToWritable(chunks(), writable);

    setTimeout(() => writable.destroy(), 10);

    await expect(withTimeout(writePromise, 100)).rejects.toThrow(
      "Writable closed before stream finished",
    );
  });
});
