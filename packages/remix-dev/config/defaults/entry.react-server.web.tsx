// @ts-expect-error - no types
import RSD from "react-server-dom-diy/server";

export function renderToReadableStream(data: unknown) {
  return RSD.renderToReadableStream(data);
}
