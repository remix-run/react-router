import {
  createServerReference as createServerReferenceImp,
  createFromReadableStream,
  encodeReply,
  // @ts-expect-error - no types yet
} from "@jacob-ebey/react-server-dom-vite/client";
import { unstable_createCallServer as createCallServer } from "react-router";

export const callServer = createCallServer({
  decode: (body) => createFromReadableStream(body, { callServer }),
  encodeAction: (args) => encodeReply(args),
});

export function createServerReference(imp: unknown, id: string, name: string) {
  return createServerReferenceImp(`${id}#${name}`, callServer);
}
