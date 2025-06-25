"use client-entry";

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import type { unstable_ServerPayload as ServerPayload } from "react-router";
import {
  unstable_createCallServer as createCallServer,
  unstable_getServerStream as getServerStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
  // @ts-expect-error - no types for this yet
} from "react-server-dom-parcel/client";

// Create and set the callServer function to support post-hydration server actions.
setServerCallback(
  createCallServer({
    createFromReadableStream,
    encodeReply,
  })
);

// Get and decode the initial server payload
createFromReadableStream(getServerStream()).then((payload: ServerPayload) => {
  // @ts-expect-error - on 18 types, requires 19.
  startTransition(async () => {
    const formState =
      payload.type === "render" ? await payload.formState : undefined;

    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          payload={payload}
          createFromReadableStream={createFromReadableStream}
        />
      </StrictMode>,
      {
        // @ts-expect-error - no types for this yet
        formState,
      }
    );
  });
});
