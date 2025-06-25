import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
} from "@hiogawa/vite-rsc/browser";
import {
  unstable_createCallServer as createCallServer,
  unstable_getServerStream as getServerStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_ServerPayload as ServerPayload } from "react-router";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    encodeReply,
  })
);

createFromReadableStream<ServerPayload>(getServerStream()).then((payload) => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          payload={payload}
          createFromReadableStream={createFromReadableStream}
        />
      </StrictMode>
    );
  });
});
