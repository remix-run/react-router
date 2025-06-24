import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
} from "@hiogawa/vite-rsc/browser";
import type { unstable_DecodeServerResponseFunction as DecodeServerResponseFunction } from "react-router";
import {
  unstable_createCallServer as createCallServer,
  unstable_getServerStream as getServerStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_ServerPayload as ServerPayload } from "react-router";

const decode: DecodeServerResponseFunction = (
  body: ReadableStream<Uint8Array>
) => createFromReadableStream(body);

setServerCallback(
  createCallServer({
    decode,
    encodeAction: (args) => encodeReply(args),
  })
);

createFromReadableStream<ServerPayload>(getServerStream()).then((payload) => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter decode={decode} payload={payload as any} />
      </StrictMode>
    );
  });
});
