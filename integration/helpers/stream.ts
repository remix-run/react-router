import type { Readable } from "node:stream";

export async function match(
  stream: Readable,
  pattern: string | RegExp,
  options: {
    /** Measured in ms */
    timeout?: number;
  } = {},
): Promise<RegExpMatchArray> {
  // Prepare error outside of promise so that stacktrace points to caller of `matchLine`
  const timeoutError = new Error(
    `Timed out - Could not find pattern: ${pattern}`,
  );
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(
      () => reject(timeoutError),
      options.timeout ?? 10_000,
    );
    stream.on("data", (data) => {
      const line: string = data.toString();
      const matches = line.match(pattern);
      if (matches) {
        resolve(matches);
        clearTimeout(timeout);
      }
    });
  });
}
