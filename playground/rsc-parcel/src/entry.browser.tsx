"use client-entry";

import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import type { unstable_RSCPayload as RSCPayload } from "react-router";
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
  })
);

createFromReadableStream(getRSCStream(), { assets: "manifest" }).then(
  (payload: RSCPayload) => {
    // @ts-expect-error - on 18 types, requires 19.
    React.startTransition(async () => {
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
          formState
        }
      );
    });
  }
);
