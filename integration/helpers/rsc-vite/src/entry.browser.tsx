import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";
import {
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_RSCPayload as RSCPayload } from "react-router";
import { unstable_getContext } from "./config/unstable-get-context";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  }),
);

createFromReadableStream<RSCPayload>(getRSCStream()).then((payload) => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          payload={payload}
          createFromReadableStream={createFromReadableStream}
          unstable_getContext={unstable_getContext}
        />
      </StrictMode>,
    );
  });
});
