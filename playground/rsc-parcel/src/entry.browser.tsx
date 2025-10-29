"use client-entry";

import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
  type unstable_RSCPayload as RSCPayload,
} from "react-router/dom";
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
  // @ts-expect-error
} from "react-server-dom-parcel/client";

setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  }),
);

createFromReadableStream(getRSCStream(), { assets: "manifest" }).then(
  (payload: RSCPayload) => {
    // @ts-expect-error - on 18 types, requires 19.
    startTransition(async () => {
      const formState =
        payload.type === "render" ? await payload.formState : undefined;

      hydrateRoot(
        document,
        <React.StrictMode>
          <RSCHydratedRouter
            payload={payload}
            routeDiscovery="eager"
            createFromReadableStream={createFromReadableStream}
          />
        </React.StrictMode>,
        {
          // @ts-expect-error - no types for this yet
          formState,
        },
      );
    });
  },
);
