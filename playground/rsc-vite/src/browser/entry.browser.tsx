import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  createFromReadableStream,
  encodeReply,
  // @ts-expect-error - no types
} from "@jacob-ebey/react-server-dom-vite/client";
// @ts-expect-error - no types yet
import { manifest } from "virtual:react-manifest";

import {
  type DecodeServerResponseFunction,
  type EncodeActionFunction,
  type ServerPayload,
  createCallServer,
  getServerStream,
  ServerBrowserRouter,
} from "react-router";

const encodeAction: EncodeActionFunction = (args: unknown[]) => encodeReply(args);

const decode: DecodeServerResponseFunction = (body) =>
  createFromReadableStream(body, manifest, { callServer });

const callServer = createCallServer({ decode, encodeAction });

createFromReadableStream(getServerStream(), manifest, { callServer }).then(
  (payload: ServerPayload) => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <ServerBrowserRouter decode={decode} payload={payload} />
        </StrictMode>
      );
    });
  }
);
