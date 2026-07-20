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
  type unstable_RSCPayload as RSCPayload,
} from "react-router/dom";
import { getContext } from "./config/get-context";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  }),
);

createFromReadableStream<RSCPayload>(getRSCStream()).then((payload) => {
  startTransition(async () => {
    const formState = payload.type === "render" ? payload.formState : undefined;

    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          payload={payload}
          createFromReadableStream={createFromReadableStream}
          getContext={getContext}
        />
      </StrictMode>,
      {
        formState,
      },
    );
  });
});
