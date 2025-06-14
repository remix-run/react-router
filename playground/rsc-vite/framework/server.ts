import * as stream from "node:stream";
// @ts-expect-error - no types yet
import RSD from "@jacob-ebey/react-server-dom-vite/server";
// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

export function renderToReadableStream(payload: any) {
  const { pipe } = RSD.renderToPipeableStream(payload, manifest);
  return stream.Readable.toWeb(
    pipe(new stream.PassThrough())
  ) as ReadableStream<Uint8Array>;
}

export function decodeReply(
  reply: FormData | string,
  options?: any
): unknown[] {
  return RSD.decodeReply(reply, manifest, options);
}
