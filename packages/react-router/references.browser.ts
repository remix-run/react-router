import {
  createFromFetch,
  createServerReference as createServerReferenceImp,
  encodeReply,
  // @ts-expect-error - no types yet
} from "@jacob-ebey/react-server-dom-vite/client";
// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";
import type { UNSAFE_ServerPayload } from "./server";

export const api: {
  updatePayload?: React.Dispatch<
    React.SetStateAction<Promise<UNSAFE_ServerPayload>>
  >;
} = {};

export async function callServer(id: string, args: unknown) {
  const fetchPromise = fetch(
    new Request(window.location.href, {
      method: "POST",
      headers: {
        Accept: "text/x-component",
        "rsc-action": id,
      },
      body: await encodeReply(args),
    })
  );

  const payloadPromise: UNSAFE_ServerPayload = createFromFetch(
    fetchPromise,
    manifest,
    {
      callServer,
    }
  );

  api.updatePayload?.((promise) =>
    Promise.all([promise, payloadPromise]).then(([existing, payload]) => ({
      ...existing,
      ...payload,
    }))
  );

  return (await payloadPromise).returnValue;
}

export function createServerReference(imp: unknown, id: string, name: string) {
  return createServerReferenceImp(`${id}#${name}`, callServer);
}
